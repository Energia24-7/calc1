// script.js

document.addEventListener("DOMContentLoaded", function() {
    obtenerUbicacion();
});

function obtenerUbicacion() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(posicion => {
            let latitud = posicion.coords.latitude;
            let longitud = posicion.coords.longitude;
            document.getElementById("ubicacion").innerHTML = `Latitud: ${latitud}, Longitud: ${longitud}`;
            obtenerRadiacionSolar(latitud, longitud);
        }, () => {
            document.getElementById("ubicacion").innerHTML = "Ubicación no disponible";
        });
    } else {
        document.getElementById("ubicacion").innerHTML = "Geolocalización no soportada";
    }
}

function obtenerRadiacionSolar(lat, lon) {
    let apiKey = "wgXhSAQTTg1UHYaxZ5P4KneLK6IUgs3Cd9JsdWF8";
    let url = `https://developer.nrel.gov/api/pvwatts/v6.json?api_key=${apiKey}&lat=${lat}&lon=${lon}&system_capacity=1&module_type=1&losses=14&array_type=1&tilt=20&azimuth=180`;
    
    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.outputs && data.outputs.solrad_monthly) {
                let radiacionDiaria = data.outputs.solrad_monthly.reduce((a, b) => a + b, 0) / 12;
                document.getElementById("radiacion").innerHTML = `Radiación Solar Promedio: ${radiacionDiaria.toFixed(2)} kWh/m²/día`;
                calcularPotencialSolar(radiacionDiaria);
            }
        })
        .catch(error => console.error("Error obteniendo datos de PVWatts: ", error));
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

function actualizarGrafico(produccionMensual) {
    let ctx = document.getElementById("graficoSolar").getContext("2d");
    let grafico = new Chart(ctx, {
        type: "bar",
        data: {
            labels: ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"],
            datasets: [{
                label: "Producción Mensual (kWh)",
                data: Array(12).fill(produccionMensual),
                backgroundColor: "rgba(54, 162, 235, 0.6)"
            }]
        }
    });
}
