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
    
    // Removed calcularPotencialSolar definition from here
});

// Moved calcularPotencialSolar definition here
function calcularPotencialSolar() {
    if (!coordenadas) {
        alert("Por favor selecciona una ubicación.");
        return;
    }

    const url = `https://developer.nrel.gov/api/pvwatts/v8.json?api_key=${apiKey}&lat=${coordenadas.lat}&lon=${coordenadas.lon}&system_capacity=${document.getElementById("capacidad").value}`;

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
