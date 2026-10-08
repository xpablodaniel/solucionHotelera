const {
    parseCSV,
    parseCSVLine,
    processReservations,
    parseDateKey,
    buildVoucherHtmlForDate
} = window.GroupMealVouchersCore;

const csvInput = document.querySelector("#csv-input");
const fileStatus = document.querySelector("#file-status");
const fileWarnings = document.querySelector("#file-warnings");
const dateSection = document.querySelector("#date-section");
const arrivalDate = document.querySelector("#arrival-date");
const manualDateLabel = document.querySelector("#manual-date-label");
const manualArrivalDate = document.querySelector("#manual-arrival-date");
const dateEmptyMessage = document.querySelector("#date-empty-message");
const processButton = document.querySelector("#process-button");
const resultsSection = document.querySelector("#results-section");
const selectedDateLabel = document.querySelector("#selected-date-label");
const voucherMapButton = document.querySelector("#voucher-map-button");
const voucherPcButton = document.querySelector("#voucher-pc-button");
const outputStatus = document.querySelector("#output-status");

const CUSTOM_DATE_OPTION = "__custom_date__";

let reservations = [];


function formatCount(count, singular, plural) {
    return `${count} ${count === 1 ? singular : plural}`;
}


function compareDates(dateA, dateB) {

    const dateAKey = parseDateKey(dateA);
    const dateBKey = parseDateKey(dateB);

    if (dateAKey !== null && dateBKey !== null) {
        return dateAKey - dateBKey;
    }
    if (dateAKey !== null) return -1;
    if (dateBKey !== null) return 1;
    return dateA.localeCompare(dateB, "es", { numeric: true });
}


function showMessages(container, messages) {

    container.replaceChildren();
    container.hidden = messages.length === 0;

    for (const message of messages) {
        const paragraph = document.createElement("p");
        paragraph.textContent = message;
        container.append(paragraph);
    }
}


function resetResults() {

    resultsSection.hidden = true;
    selectedDateLabel.textContent = "";
    outputStatus.replaceChildren();
    outputStatus.hidden = true;
}


function resetFileState() {

    reservations = [];
    resetResults();
    dateSection.hidden = true;
    arrivalDate.replaceChildren(new Option("Selecciona una fecha", ""));
    arrivalDate.add(new Option("Otra fecha…", CUSTOM_DATE_OPTION));
    processButton.disabled = true;
    dateEmptyMessage.hidden = true;
    manualDateLabel.hidden = true;
    manualArrivalDate.hidden = true;
    manualArrivalDate.value = "";
    showMessages(fileWarnings, []);
}


function inspectCsv(csvText) {

    const lines = csvText
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(Boolean);
    const headerCount = lines.length
        ? parseCSVLine(lines[0]).length
        : 0;
    const invalidRowCount = lines.slice(1)
        .filter(line => parseCSVLine(line).length !== 28)
        .length;

    return { lines, headerCount, invalidRowCount };
}


async function handleFileSelection() {

    const file = csvInput.files[0];
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
        const { lines, headerCount, invalidRowCount } = inspectCsv(csvText);
        const parsedRecords = parseCSV(csvText);
        reservations = processReservations(parsedRecords);
        const dateValues = parsedRecords
            .map(record => record.estadia.ingreso)
            .filter(value => typeof value === "string" && value.trim() !== "");
        const validDates = [...new Set(dateValues
            .filter(date => parseDateKey(date) !== null))]
            .sort(compareDates);
        const invalidDateRows = parsedRecords.filter(record => {
            const value = record.estadia?.ingreso;
            return typeof value === "string" &&
                value.trim() !== "" &&
                parseDateKey(value) === null;
        }).length;
        const messages = [];

        if (headerCount !== 28) {
            messages.push(`La cabecera tiene ${headerCount} columnas; se esperaban 28.`);
        }
        if (invalidRowCount > 0) {
            messages.push(
                `${formatCount(invalidRowCount, "fila tiene", "filas tienen")} ` +
                "una cantidad de columnas distinta de 28 y el parser no las incluyó."
            );
        }
        if (invalidDateRows > 0) {
            messages.push(
                `${formatCount(invalidDateRows, "pasajero tiene", "pasajeros tienen")} ` +
                "una fecha de ingreso no válida y queda fuera del selector."
            );
        }
        const recordsWithoutVoucher = parsedRecords.filter(record => !record.voucher).length;
        if (recordsWithoutVoucher > 0) {
            messages.push(
                `${formatCount(recordsWithoutVoucher, "pasajero no tiene", "pasajeros no tienen")} ` +
                "voucher y no pueden agruparse como reserva."
            );
        }
        if (parsedRecords.length === 0) {
            messages.push("El parser no encontró filas válidas de 28 columnas.");
        }

        arrivalDate.replaceChildren(new Option("Selecciona una fecha", ""));
        for (const date of validDates) {
            arrivalDate.add(new Option(date, date));
        }
        arrivalDate.add(new Option("Otra fecha…", CUSTOM_DATE_OPTION));
        dateEmptyMessage.hidden = validDates.length > 0;
        dateSection.hidden = false;
        fileStatus.textContent =
            `Archivo cargado: ${file.name} · ` +
            `${formatCount(parsedRecords.length, "pasajero válido", "pasajeros válidos")} · ` +
            `${formatCount(reservations.length, "reserva agrupada", "reservas agrupadas")}.`;
        showMessages(fileWarnings, messages);
    } catch (error) {
        resetFileState();
        fileStatus.textContent = `No se pudo procesar el CSV: ${error.message}`;
    }
}


function formatDateInput(value) {

    const [year, month, day] = value.split("-");
    return `${day}/${month}/${year}`;
}


function getSelectedDate() {

    if (arrivalDate.value === CUSTOM_DATE_OPTION) {
        return manualArrivalDate.value
            ? formatDateInput(manualArrivalDate.value)
            : "";
    }

    return arrivalDate.value;
}


function processSelectedDate() {

    const date = getSelectedDate();

    if (!date) return;

    resetResults();
    selectedDateLabel.textContent = date;
    resultsSection.hidden = false;
}


function getReviewMessage(review) {

    const reason = review.reason === "DIVERGENT_STAY_PERIODS"
        ? "períodos de ingreso/egreso diferentes entre pasajeros"
        : "fechas ausentes o inválidas";

    return `Voucher ${review.voucher || "sin número"}: ${reason}.`;
}


function openPrintableDocument(html) {

    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
}


function generateVoucher(mode) {

    try {
        const result = buildVoucherHtmlForDate(
            reservations,
            getSelectedDate(),
            mode,
            window.location.href
        );
        const messages = [];

        if (result.html) {
            openPrintableDocument(result.html);
            messages.push(
                `Vista imprimible de Voucher ${mode} abierta: ` +
                `${formatCount(result.reportes.length, "voucher", "vouchers")}.`
            );
        } else {
            messages.push(`No hay vouchers ${mode} para generar en esta fecha.`);
        }

        if (result.reviewRequired.length > 0) {
            messages.push(
                `${formatCount(result.reviewRequired.length, "voucher requiere revisión", "vouchers requieren revisión")}:`
            );
            messages.push(...result.reviewRequired.map(getReviewMessage));
        }

        showMessages(outputStatus, messages);
    } catch (error) {
        showMessages(
            outputStatus,
            [`No se pudo generar Voucher ${mode}: ${error.message}`]
        );
    }
}


csvInput.addEventListener("change", handleFileSelection);

arrivalDate.addEventListener("change", () => {
    resetResults();
    const customDateSelected = arrivalDate.value === CUSTOM_DATE_OPTION;
    manualDateLabel.hidden = !customDateSelected;
    manualArrivalDate.hidden = !customDateSelected;
    processButton.disabled = customDateSelected
        ? !manualArrivalDate.value
        : !arrivalDate.value;
});

manualArrivalDate.addEventListener("change", () => {
    resetResults();
    processButton.disabled = !manualArrivalDate.value;
});

processButton.addEventListener("click", processSelectedDate);
voucherMapButton.addEventListener("click", () => generateVoucher("MAP"));
voucherPcButton.addEventListener("click", () => generateVoucher("PC"));
