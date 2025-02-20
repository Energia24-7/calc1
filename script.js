let userLocation = { lat: null, lon: null };
let solarChart;

function obtenerUbicacion() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            userLocation.lat = position.coords.latitude;
            userLocation.lon = position.coords.longitude;
            document.getElementById("ubicacion").innerHTML = `Ubicación: ${userLocation.lat.toFixed(4)}, ${userLocation.lon.toFixed(4)}`;
        }, error => {
            document.getElementById("ubicacion").innerHTML = "Acceso a la ubicación denegado.";
        });
    } else {
        document.getElementById("ubicacion").innerHTML = "Geolocalización no soportada.";
    }
}

function calcularPotencialSolar() {
    if (!userLocation.lat || !userLocation.lon) {
        document.getElementById("ubicacion").innerHTML = "Por favor, activa los servicios de ubicación.";
        return;
    }

    const capacidadSistema = parseFloat(document.getElementById("capacidad").value);
    const tarifaElectricidad = parseFloat(document.getElementById("tarifaElectricidad").value);
    const demandaDiaria = parseFloat(document.getElementById("demandaDiaria").value);

    if (capacidadSistema <= 0 || tarifaElectricidad <= 0 || demandaDiaria <= 0) {
        document.getElementById("ahorros").innerHTML = "Ingrese valores válidos en todos los campos.";
        return;
    }

    const apiKey = "wgXhSAQTTg1UHYaxZ5P4KneLK6IUgs3Cd9JsdWF8"; // Reemplazar con tu clave API de PVWatts
    const apiUrl = `https://developer.nrel.gov/api/pvwatts/v8.json?api_key=${apiKey}&lat=${userLocation.lat}&lon=${userLocation.lon}&system_capacity=${capacidadSistema}&module_type=0&losses=14&array_type=1&tilt=20&azimuth=180`;

    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            if (data.errors.length === 0) {
                let generacionMensual = data.outputs.ac_monthly;
                let promedioDiario = (generacionMensual.reduce((a, b) => a + b, 0) / 365).toFixed(2);
                let promedioMensual = (generacionMensual.reduce((a, b) => a + b, 0) / 12).toFixed(2);

                actualizarGrafico(generacionMensual);
                calcularAhorros(generacionMensual, tarifaElectricidad, promedioDiario, promedioMensual);
                calcularDimensionSistema(demandaDiaria);
            } else {
                document.getElementById("ahorros").innerHTML = "Error al obtener datos solares.";
            }
        })
        .catch(error => {
            document.getElementById("ahorros").innerHTML = "Fallo en la solicitud API.";
        });
}

function actualizarGrafico(generacionMensual) {
    let meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

    if (solarChart) {
        solarChart.destroy();
    }

    let ctx = document.getElementById("graficoSolar").getContext("2d");
    solarChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: meses,
            datasets: [{
                label: "Producción mensual (kWh)",
                data: generacionMensual,
                backgroundColor: "rgba(40, 167, 69, 0.7)",
                borderColor: "rgba(40, 167, 69, 1)",
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function calcularAhorros(generacionMensual, tarifaElectricidad, promedioDiario, promedioMensual) {
    let generacionAnual = generacionMensual.reduce((a, b) => a + b, 0);
    let ahorrosAnuales = generacionAnual * tarifaElectricidad;
    let costoSistema = document.getElementById("capacidad").value * 1000 * 2;

    let roi = (ahorrosAnuales / costoSistema) * 100;
    let paybackYears = costoSistema / ahorrosAnuales;

    document.getElementById("ahorros").innerHTML = `
        <h3>Resumen Financiero</h3>
        <p>Producción Anual: ${generacionAnual.toFixed(2)} kWh</p>
        <p>Promedio Mensual: ${promedioMensual} kWh</p>
        <p>Promedio Diario: ${promedioDiario} kWh</p>
        <p>Ahorro Anual: $${ahorrosAnuales.toFixed(2)}</p>
    `;
}

function calcularDimensionSistema(demandaDiaria) {
    const potenciaPanel = 550;
    const horasSol = 5;
    const tamanosInversor = [3000, 3600, 6500, 10000, 12000];

    let cantidadPaneles = Math.ceil((demandaDiaria * 1000) / (potenciaPanel * horasSol));
    let tamanoInversor = tamanosInversor.find(size => size >= cantidadPaneles * (potenciaPanel / 1000));

    let voltajeBateria = tamanoInversor <= 3600 ? 24 : 48;
    let capacidadBateria = Math.ceil((demandaDiaria * 1000) / (voltajeBateria * (voltajeBateria === 24 ? 0.5 : 0.8)));

    const costoPanel = 250;
    const costoInversor = 500 * (tamanoInversor / 1000);
    const costoBateria = (voltajeBateria === 24 ? 200 : 400) * capacidadBateria / 100; 

    const costoTotalSistema = (cantidadPaneles * costoPanel) + costoInversor + costoBateria;
    const costoInstalacion = costoTotalSistema * 0.2;

    document.getElementById("especificaciones").innerHTML = `
        <h3>Especificaciones del Sistema</h3>
        <table border="1">
            <tr><th>Elemento</th><th>Cantidad</th><th>Costo Unitario</th><th>Total ($)</th></tr>
            <tr><td>Paneles Solares (550W)</td><td>${cantidadPaneles}</td><td>$${costoPanel}</td><td>$${(cantidadPaneles * costoPanel).toFixed(2)}</td></tr>
            <tr><td>Inversor Híbrido (${tamanoInversor}W)</td><td>1</td><td>$${costoInversor.toFixed(2)}</td><td>$${costoInversor.toFixed(2)}</td></tr>
            <tr><td>Batería (${voltajeBateria}V)</td><td>${capacidadBateria} Ah</td><td>$${costoBateria.toFixed(2)}</td><td>$${costoBateria.toFixed(2)}</td></tr>
            <tr><td><strong>Total del Sistema</strong></td><td colspan="2"></td><td><strong>$${costoTotalSistema.toFixed(2)}</strong></td></tr>
            <tr><td><strong>Costo de Instalación (20%)</strong></td><td colspan="2"></td><td><strong>$${costoInstalacion.toFixed(2)}</strong></td></tr>
        </table>
        <p><b>Total Final: $${(costoTotalSistema + costoInstalacion).toFixed(2)}</b></p>
    `;
}
