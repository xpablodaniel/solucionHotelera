const demoResultsByDate = {
    "2026-09-27": {
        label: "27/09/2026",
        summary: {
            passengers: 7,
            reservations: 4,
            rooms: 5,
            mapPassengers: 3,
            mapReservations: 2,
            pcPassengers: 3,
            pcReservations: 1,
            unclassifiedPassengers: 1,
            unclassifiedReservations: 1
        },
        rows: [
            ["DEMO-27001", "SOSA, MARTA", "23 de Mayo", "104", "2", "MAP · Desayuno", "Individual"],
            ["DEMO-27002", "PÉREZ, LUIS", "23 de Mayo", "238, 239", "3", "PC · Desayuno, almuerzo y cena", "Contingente"],
            ["DEMO-27003", "DÍAZ, ANA", "31 de Agosto", "107", "1", "Sin determinar", "No clasificada"],
            ["DEMO-27004", "LÓPEZ, RICARDO", "31 de Agosto", "112", "1", "MAP · Desayuno", "Individual"]
        ]
    },
    "2026-09-28": {
        label: "28/09/2026",
        summary: {
            passengers: 2,
            reservations: 1,
            rooms: 1,
            mapPassengers: 0,
            mapReservations: 0,
            pcPassengers: 2,
            pcReservations: 1,
            unclassifiedPassengers: 0,
            unclassifiedReservations: 0
        },
        rows: [
            ["DEMO-28001", "FERNÁNDEZ, ELENA", "23 de Mayo", "221", "2", "PC · Desayuno, almuerzo y cena", "Contingente"]
        ]
    }
};

const tableHeaders = [
    "Voucher",
    "Titular",
    "Hotel",
    "Habitación/es",
    "PAX",
    "Régimen",
    "Clasificación"
];

const csvInput = document.querySelector("#csv-input");
const fileStatus = document.querySelector("#file-status");
const dateSection = document.querySelector("#date-section");
const arrivalDate = document.querySelector("#arrival-date");
const processButton = document.querySelector("#process-button");
const resultsSection = document.querySelector("#results-section");
const reservationRows = document.querySelector("#reservation-rows");

function resetResults() {
    resultsSection.hidden = true;
    reservationRows.replaceChildren();
    document.querySelector("#action-status").textContent =
        "Acciones ilustrativas; todavía no generan archivos.";
}

function handleFileSelection() {
    const file = csvInput.files[0];

    resetResults();
    dateSection.hidden = true;
    arrivalDate.value = "";
    processButton.disabled = true;

    if (!file) {
        fileStatus.textContent = "Ningún archivo seleccionado";
        return;
    }

    if (!file.name.toLowerCase().endsWith(".csv")) {
        fileStatus.textContent = "Selecciona un archivo con extensión .csv.";
        return;
    }

    const sizeInKilobytes = Math.max(1, Math.round(file.size / 1024));
    fileStatus.textContent =
        `Archivo seleccionado: ${file.name} · ${sizeInKilobytes} KB. Fechas de demostración disponibles.`;
    dateSection.hidden = false;
}

function appendCell(row, value, isHeader = false) {
    const cell = document.createElement(isHeader ? "th" : "td");
    cell.textContent = value;

    if (isHeader) {
        cell.scope = "col";
    }

    row.append(cell);
}

function renderSummary(summary) {
    const values = {
        "#passenger-count": summary.passengers,
        "#reservation-count": summary.reservations,
        "#room-count": summary.rooms,
        "#map-passenger-count": summary.mapPassengers,
        "#map-reservation-count": summary.mapReservations,
        "#pc-passenger-count": summary.pcPassengers,
        "#pc-reservation-count": summary.pcReservations
    };

    for (const [selector, value] of Object.entries(values)) {
        document.querySelector(selector).textContent = String(value);
    }

    const mapStatus = document.querySelector("#map-status");
    mapStatus.textContent = summary.mapReservations > 0
        ? `Hay ${summary.mapPassengers} pasajeros en ${summary.mapReservations} reservas MAP para esta fecha.`
        : "No hay ingresos MAP para la fecha seleccionada.";

    const classificationStatus = document.querySelector("#classification-status");
    classificationStatus.textContent = summary.unclassifiedReservations > 0
        ? `${summary.unclassifiedReservations} reserva(s) y ${summary.unclassifiedPassengers} pasajero(s) sin clasificación; se incluyen en el listado.`
        : "No hay reservas sin clasificación para esta fecha.";
}

function renderReservations(rows) {
    reservationRows.replaceChildren();

    for (const values of rows) {
        const row = document.createElement("tr");
        values.forEach(value => appendCell(row, value));
        reservationRows.append(row);
    }
}

function processDemoReservations() {
    const demoResult = demoResultsByDate[arrivalDate.value];

    if (!demoResult) {
        return;
    }

    document.querySelector("#selected-date-label").textContent = demoResult.label;
    renderSummary(demoResult.summary);
    renderReservations(demoResult.rows);
    resultsSection.hidden = false;
}

csvInput.addEventListener("change", handleFileSelection);

arrivalDate.addEventListener("change", () => {
    resetResults();
    processButton.disabled = !demoResultsByDate[arrivalDate.value];
});

processButton.addEventListener("click", processDemoReservations);

document.querySelectorAll("[data-action]").forEach(button => {
    button.addEventListener("click", () => {
        document.querySelector("#action-status").textContent =
            `Acción de demostración: ${button.dataset.action} todavía no genera archivos.`;
    });
});