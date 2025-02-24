document.addEventListener("DOMContentLoaded", function() {
    const apiKey = "wgXhSAQTTg1UHYaxZ5P4KneLK6IUgs3Cd9JsdWF8";
    const usarUbicacionBtn = document.getElementById("usarUbicacion");
    const ciudadesSelect = document.getElementById("ciudades");
    let coordenadas = null;

    usarUbicacionBtn.addEventListener("click", function() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(position => {
                coordenadas = {
                    lat: position.coords.latitude,
                    lon: position.coords.longitude
                };
                actualizarUbicacion(coordenadas);
            }, () => alert("No se pudo obtener la ubicación"));
        }
    });

    ciudadesSelect.addEventListener("change", function() {
        if (this.value) {
            const [lat, lon] = this.value.split(",").map(Number);
            coordenadas = { lat, lon };
            actualizarUbicacion(coordenadas);
        }
    });

    function actualizarUbicacion({ lat, lon }) {
        document.getElementById("ubicacion").textContent = `Ubicación: ${lat.toFixed(4)}, ${lon.toFixed(4)}`;
        cargarMapa(lat, lon);
    }

    function calcularPotencialSolar() {
        if (!coordenadas) {
            alert("Por favor selecciona una ubicación.");
            return;
        }

        const url = `https://developer.nrel.gov/api/pvwatts/v8.json?api_key=${apiKey}&lat=${coordenadas.lat}&lon=${coordenadas.lon}&system_capacity=${document.getElementById("capacidad").value}&module_type=0&losses=14&array_type=1&tilt=20&azimuth=180`;

        fetch(url)
            .then(response => response.json())
            .then(data => {
                if (data.errors) {
                    console.error("Errores en la API:", data.errors);
                    return;
                }
                mostrarResultados(data);
            })
            .catch(error => console.error("Error en la API:", error));
    }

    function mostrarResultados(data) {
        const radiacion = Math.round(data.outputs.solrad_annual);
        document.getElementById("radiacion").textContent = `Radiación Solar: ${radiacion} kWh/m²/año`;

        const generacionMensual = data.outputs.ac_monthly;
        mostrarGrafico(generacionMensual);
    }
function calcularPotencialSolar(radiacionDiaria) {
    let capacidad = parseFloat(document.getElementById("capacidad").value);
    let demandaDiaria = parseFloat(document.getElementById("demandaDiaria").value);
    let tarifa = parseFloat(document.getElementById("tarifaElectricidad").value);

    let produccionDiaria = capacidad * radiacionDiaria;
    let produccionMensual = produccionDiaria * 30;
    let produccionAnual = produccionDiaria * 365;
    let ahorroMensual = produccionMensual * tarifa;
    let inversion = capacidad * 1000;
    let retornoInversion = inversion / (ahorroMensual * 12);

    let voltajeSistema = capacidad <= 3.6 ? 24 : 48;
    let energiaNecesaria = demandaDiaria * 1.2;
    let capacidadBateriasAh = (energiaNecesaria * 1000) / voltajeSistema;
    let cantidadBaterias = Math.ceil((capacidadBateriasAh / 1000) * (voltajeSistema === 24 ? 2 : 4));

    document.getElementById("ahorros").innerHTML = `
        <h2>Ahorros y Retorno de Inversión</h2>
        <p>Ahorro mensual estimado: $${ahorroMensual.toFixed(2)}</p>
        <p>Tiempo de retorno de inversión: ${retornoInversion.toFixed(1)} años</p>
    `;

    document.getElementById("especificaciones").innerHTML = `
        <h2>Especificaciones del Sistema</h2>
        <p>Capacidad del sistema: ${capacidad} kW</p>
        <p>Producción diaria estimada: ${produccionDiaria.toFixed(1)} kWh</p>
        <p>Producción mensual estimada: ${produccionMensual.toFixed(1)} kWh</p>
        <p>Producción anual estimada: ${produccionAnual.toFixed(1)} kWh</p>
        <p>Voltaje del sistema: ${voltajeSistema}V</p>
        <p>Baterías necesarias: ${cantidadBaterias} de 12V 100Ah</p>
    `;

    actualizarGrafico(produccionMensual);
}

  
    function mostrarGrafico(datos) {
        const ctx = document.getElementById("graficoSolar").getContext("2d");
        new Chart(ctx, {
            type: "bar",
            data: {
                labels: ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"],
                datasets: [{
                    label: "Generación mensual (kWh)",
                    data: datos,
                    backgroundColor: "rgba(75, 192, 192, 0.5)"
                }]
            }
        });
    }

    function cargarMapa(lat, lon) {
        const mapa = document.getElementById("mapa");
        mapa.innerHTML = `<iframe width="600" height="400" src="https://maps.google.com/maps?q=${lat},${lon}&z=10&output=embed"></iframe>`;
    }
});
