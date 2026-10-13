const { parseCSV, parseCSVLine, parseDateKey } = window.ReservationsCore;

const csvInput = document.querySelector("#csv-input");
const dropArea = document.querySelector("#drop-area");
const fileStatus = document.querySelector("#file-status");
const fileWarnings = document.querySelector("#file-warnings");
const resultsSection = document.querySelector("#results-section");
const reservationRows = document.querySelector("#reservation-rows");
const roomCount = document.querySelector("#room-count");
const passengerCount = document.querySelector("#passenger-count");
const emptyMessage = document.querySelector("#empty-message");
const tableScroll = document.querySelector("#table-scroll");
const downloadButton = document.querySelector("#download-button");

const REPORT_COLUMNS = [
    { label: "Nro. habitación", value: record => record.habitacion?.original },
    { label: "Fecha de ingreso", value: record => record.estadia?.ingreso },
    { label: "Fecha de egreso", value: record => record.estadia?.egreso },
    { label: "Cantidad plazas", value: record => record.plazas?.cantidad },
    { label: "Tipo documento", value: record => record.pax?.tipoDocumento },
    { label: "Nro. doc.", value: record => record.pax?.numeroDocumento },
    { label: "Apellido y nombre", value: record => record.pax?.nombre },
    { label: "Edad", value: record => record.pax?.edad },
    { label: "Voucher", value: record => record.voucher },
    { label: "Servicio", value: record => record.servicios },
    { label: "Estado", value: record => record.estado },
    { label: "Paquete", value: record => record.paquete },
    { label: "Sede", value: record => record.sede },
    { label: "Observación habitación", value: record => record.observacionHabitacion }
];

let parsedRecords = [];
let sortedRecords = [];
let loadSequence = 0;

function resetFileState() {
    parsedRecords = [];
    sortedRecords = [];
    resultsSection.hidden = true;
    reservationRows.replaceChildren();
    fileWarnings.hidden = true;
    fileWarnings.replaceChildren();
    downloadButton.disabled = true;
}

function inspectCsv(csvText) {
    const lines = csvText
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(Boolean);
    const headerCount = lines.length ? parseCSVLine(lines[0]).length : 0;
    const invalidRowCount = lines.slice(1)
        .filter(line => parseCSVLine(line).length !== 28)
        .length;

    return { headerCount, invalidRowCount };
}

function showMessages(messages) {
    fileWarnings.replaceChildren();
    fileWarnings.hidden = messages.length === 0;

    for (const message of messages) {
        const paragraph = document.createElement("p");
        paragraph.textContent = message;
        fileWarnings.append(paragraph);
    }
}

function compareRooms(recordA, recordB) {
    const roomA = recordA.habitacion?.numero;
    const roomB = recordB.habitacion?.numero;

    if (!roomA && !roomB) return 0;
    if (!roomA) return 1;
    if (!roomB) return -1;

    const numberA = Number.parseInt(String(roomA).replace(/\D/g, ""), 10);
    const numberB = Number.parseInt(String(roomB).replace(/\D/g, ""), 10);
    if (Number.isFinite(numberA) && Number.isFinite(numberB) && numberA !== numberB) {
        return numberA - numberB;
    }

    return String(recordA.habitacion.original)
        .localeCompare(String(recordB.habitacion.original), "es", { numeric: true });
}

function formatCellValue(value) {
    return value === null || value === undefined || value === ""
        ? "Sin dato"
        : String(value);
}

function renderRows() {
    reservationRows.replaceChildren();
    for (const record of sortedRecords) {
        const row = document.createElement("tr");
        for (const column of REPORT_COLUMNS) {
            const cell = document.createElement("td");
            cell.textContent = formatCellValue(column.value(record));
            row.append(cell);
        }
        reservationRows.append(row);
    }
}

function renderSummary() {
    const rooms = new Set(parsedRecords
        .filter(record => record.habitacion?.numero)
        .map(record => JSON.stringify([
            record.alojamiento || null,
            String(record.habitacion.numero)
        ])));

    roomCount.textContent = String(rooms.size);
    passengerCount.textContent = String(parsedRecords.length);
}

function renderResults() {
    sortedRecords = [...parsedRecords].sort(compareRooms);
    renderSummary();
    renderRows();

    const hasRecords = sortedRecords.length > 0;
    emptyMessage.hidden = hasRecords;
    tableScroll.hidden = !hasRecords;
    downloadButton.disabled = false;
    resultsSection.hidden = false;
}

function escapeCsvValue(value) {
    const text = value === null || value === undefined ? "" : String(value);
    return /[;"\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function buildCsv() {
    const header = REPORT_COLUMNS.map(column => escapeCsvValue(column.label)).join(";");
    const rows = sortedRecords.map(record =>
        REPORT_COLUMNS
            .map(column => escapeCsvValue(column.value(record)))
            .join(";")
    );

    return [header, ...rows].join("\r\n");
}

function downloadCsv() {
    const blob = new Blob(["\ufeff", buildCsv()], {
        type: "text/csv;charset=utf-8"
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "reservas_ingresan.csv";
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
}

function inspectRecords() {
    const messages = [];
    const invalidDateRows = parsedRecords.filter(record => {
        const arrival = record.estadia?.ingreso;
        const departure = record.estadia?.egreso;
        return (arrival && parseDateKey(arrival) === null) ||
            (departure && parseDateKey(departure) === null);
    }).length;
    const recordsWithoutVoucher = parsedRecords.filter(record => !record.voucher).length;
    const recordsWithoutDate = parsedRecords.filter(record =>
        !record.estadia?.ingreso || !record.estadia?.egreso
    ).length;
    const recordsWithoutService = parsedRecords.filter(record => !record.servicios).length;

    if (invalidDateRows > 0) {
        messages.push(`${invalidDateRows} pasajero(s) tienen una fecha de ingreso o egreso no válida.`);
    }
    if (recordsWithoutVoucher > 0) {
        messages.push(`${recordsWithoutVoucher} pasajero(s) no tienen voucher.`);
    }
    if (recordsWithoutDate > 0) {
        messages.push(`${recordsWithoutDate} pasajero(s) no tienen fecha de ingreso o egreso informada.`);
    }
    if (recordsWithoutService > 0) {
        messages.push(`${recordsWithoutService} pasajero(s) no tienen servicio informado.`);
    }
    return messages;
}

async function processFile(file) {
    const currentLoad = ++loadSequence;
    resetFileState();

    if (!file) {
        fileStatus.textContent = "Ningún archivo seleccionado";
        return;
    }
    if (!file.name.toLowerCase().endsWith(".csv")) {
        fileStatus.textContent = "Selecciona un archivo con extensión .csv.";
        return;
    }

    fileStatus.textContent = `Leyendo ${file.name}…`;

    try {
        const csvText = await file.text();
        if (currentLoad !== loadSequence) return;

        const { headerCount, invalidRowCount } = inspectCsv(csvText);
        parsedRecords = parseCSV(csvText);

        const messages = inspectRecords();
        if (headerCount !== 28) {
            messages.unshift(`La cabecera tiene ${headerCount} columnas; se esperaban 28.`);
        }
        if (invalidRowCount > 0) {
            messages.push(`${invalidRowCount} fila(s) tienen una cantidad de columnas distinta de 28 y fueron omitidas.`);
        }
        if (parsedRecords.length === 0) {
            messages.push("El parser no encontró filas válidas de 28 columnas.");
        }

        showMessages(messages);
        renderResults();
        const sizeInKilobytes = Math.max(1, Math.round(file.size / 1024));
        fileStatus.textContent = `Archivo cargado: ${file.name} · ${sizeInKilobytes} KB · ${parsedRecords.length} pasajero(s).`;
    } catch (error) {
        if (currentLoad !== loadSequence) return;
        resetFileState();
        fileStatus.textContent = `No se pudo procesar el CSV: ${error.message}`;
    }
}

function preventDefaults(event) {
    event.preventDefault();
    event.stopPropagation();
}

for (const eventName of ["dragenter", "dragover", "dragleave", "drop"]) {
    dropArea.addEventListener(eventName, preventDefaults);
}

for (const eventName of ["dragenter", "dragover"]) {
    dropArea.addEventListener(eventName, () => dropArea.classList.add("is-dragging"));
}

for (const eventName of ["dragleave", "drop"]) {
    dropArea.addEventListener(eventName, () => dropArea.classList.remove("is-dragging"));
}

dropArea.addEventListener("drop", event => {
    processFile(event.dataTransfer.files[0]);
});

csvInput.addEventListener("change", () => processFile(csvInput.files[0]));
downloadButton.addEventListener("click", downloadCsv);
downloadButton.disabled = true;
