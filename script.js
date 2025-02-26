let userLocation = { lat: null, lon: null };
let solarChart;
let map;
let marker;

let panelAreas = {
    "350": 1.62,
    "400": 1.8,
    "500": 2.2,
    "550": 2.5
};

document.addEventListener("DOMContentLoaded", function () {
    initMap();

    // Handle quote form submission
    document.getElementById("quoteForm").addEventListener("submit", function (event) {
        event.preventDefault(); // Prevent default form submission

        let contactInfo = document.getElementById("contactInfo").value;

        if (!contactInfo) {
            alert("Por favor, ingrese su teléfono o email para recibir la cotización.");
            return;
        }

        let formData = new FormData();
        formData.append("contactInfo", contactInfo);

        fetch("send_quote.php", {
            method: "POST",
            body: formData,
        })
        .then(response => response.text())
        .then(data => {
            if (data.trim() === "success") {
                alert("Solicitud enviada con éxito. Nos pondremos en contacto pronto.");
                document.getElementById("contactInfo").value = "";
            } else {
                alert("Error al enviar la solicitud. Intente de nuevo.");
            }
        })
        .catch(error => {
            alert("Error en la conexión. Verifique su conexión a Internet.");
            console.error("Error:", error);
        });
    });
});

function initMap() {
    map = L.map('map').setView([0, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
}

function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            userLocation.lat = position.coords.latitude;
            userLocation.lon = position.coords.longitude;
            document.getElementById("location").innerHTML = `Ubicación: ${userLocation.lat.toFixed(4)}, ${userLocation.lon.toFixed(4)}`;
            updateMap(userLocation.lat, userLocation.lon);
        }, error => {
            document.getElementById("location").innerHTML = "Acceso a la ubicación denegado.";
        });
    } else {
        document.getElementById("location").innerHTML = "Geolocalización no soportada.";
    }
}

function setCityLocation() {
    let citySelect = document.getElementById("city");
    let cityCoords = citySelect.value;
    if (cityCoords) {
        let [lat, lon] = cityCoords.split(",").map(Number);
        userLocation.lat = lat;
        userLocation.lon = lon;
        document.getElementById("location").innerHTML = `Ubicación: ${lat.toFixed(4)}, ${lon.toFixed(4)}`;
        updateMap(lat, lon);
    }
}

function updateMap(lat, lon) {
    map.setView([lat, lon], 12);
    if (marker) {
        marker.setLatLng([lat, lon]);
    } else {
        marker = L.marker([lat, lon]).addTo(map);
    }
}

function getSolarPotential() {
    if (!userLocation.lat || !userLocation.lon) {
        document.getElementById("location").innerHTML = "Por favor, habilite los servicios de ubicación o seleccione una ciudad.";
        return;
    }
    const systemCapacity = parseFloat(document.getElementById("capacity").value);
    const electricityRate = parseFloat(document.getElementById("electricityRate").value);
    const batteryBackup = document.getElementById("batteryBackup").value;
    const panelSize = parseInt(document.getElementById("panelSize").value);

    if (systemCapacity <= 0 || electricityRate <= 0) {
        document.getElementById("savings").innerHTML = "Ingrese valores válidos para la capacidad del sistema y el costo de electricidad.";
        return;
    }

    const apiKey = "wgXhSAQTTg1UHYaxZ5P4KneLK6IUgs3Cd9JsdWF8"; // Reemplazar con clave de API válida
    const apiUrl = `https://developer.nrel.gov/api/pvwatts/v8.json?api_key=${apiKey}&lat=${userLocation.lat}&lon=${userLocation.lon}&system_capacity=${systemCapacity}&module_type=0&losses=14&array_type=1&tilt=20&azimuth=180`;

    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            if (data.errors && data.errors.length > 0) {
                document.getElementById("savings").innerHTML = "Error en la API: " + data.errors.join(", ");
            } else {
                let monthlyGeneration = data.outputs.ac_monthly;
                let avgMonthlyGeneration = monthlyGeneration.reduce((a, b) => a + b, 0) / 12;
                updateChart(monthlyGeneration);
                calculateSavings(monthlyGeneration, electricityRate, avgMonthlyGeneration, systemCapacity, batteryBackup);
                calculateInstallationCost(systemCapacity, batteryBackup, panelSize);
            }
        })
        .catch(error => {
            document.getElementById("savings").innerHTML = "Error en la solicitud a la API.";
        });
}

function updateChart(monthlyGeneration) {
    let months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    if (solarChart) {
        solarChart.destroy();
    }
    let ctx = document.getElementById("solarChart").getContext("2d");
    solarChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: months,
            datasets: [{
                label: "Producción de Energía Mensual (kWh)",
                data: monthlyGeneration,
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

function calculateSavings(monthlyGeneration, electricityRate, avgMonthlyGeneration, systemCapacity, batteryBackup) {
    let annualGeneration = monthlyGeneration.reduce((a, b) => a + b, 0);
    let annualSavings = annualGeneration * electricityRate;
    let systemCost = batteryBackup === "yes" ? systemCapacity * 1400 : systemCapacity * 800;
    let roi = (annualSavings / systemCost) * 100;
    let paybackYears = systemCost / annualSavings;

    document.getElementById("savings").innerHTML = `
        <h3>Resumen Financiero</h3>
        <p>Producción de Energía Anual: ${annualGeneration.toFixed(2)} kWh</p>
        <p>Ahorro Anual: $${annualSavings.toFixed(2)}</p>
        <p>ROI: ${roi.toFixed(2)}%</p>
        <p>Periodo de Recuperación: ${paybackYears.toFixed(1)} años</p>
    `;
    document.getElementById("avgMonthlyGeneration").innerHTML = `
        <h3>Generación Promedio Mensual</h3>
        <p>${avgMonthlyGeneration.toFixed(2)} kWh</p>
    `;
}

function calculateInstallationCost(systemCapacity, batteryBackup, panelSize) {
    let installationCost = batteryBackup === "yes" ? systemCapacity * 1400 : systemCapacity * 800;
    let totalPanels = Math.ceil((systemCapacity * 1000) / panelSize);
    let totalArea = totalPanels * panelAreas[panelSize];

    document.getElementById("installationCost").innerHTML = `
        <h3>Costo de Instalación aprox sin IVA (requiere inspección)</h3>
        <p>${installationCost.toFixed(2)} USD</p>
        <p>Total de Paneles Requeridos: ${totalPanels}</p>
    `;
 document.getElementById("panelArea").innerHTML = `
        <h3>Área Estimada Requerida</h3>
        <p>${totalArea.toFixed(2)} m²</p>
    `;


}

function updateTitle(newTitle) {
    document.title = newTitle;
}
