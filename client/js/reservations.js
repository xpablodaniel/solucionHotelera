const {
    parseCSV,
    parseCSVLine,
    processReservations,
    classifyRecord,
    classifyReservation,
    buildResponsibleRelationships,
    findRelatedReservationsByDni,
    buildResponsibleRelationsView,
    buildResponsibleRelationsAggregateView,
    buildNonRelatableView,
    findPotentialPassengerDuplicates,
    buildRoomingCsvForDate,
    parseDateKey
} = window.ReservationsCore;

const csvInput = document.querySelector("#csv-input");
const fileStatus = document.querySelector("#file-status");
const fileWarnings = document.querySelector("#file-warnings");
const dateSection = document.querySelector("#date-section");
const arrivalDate = document.querySelector("#arrival-date");
const processButton = document.querySelector("#process-button");
const resultsSection = document.querySelector("#results-section");
const reservationRows = document.querySelector("#reservation-rows");
const dateEmptyMessage = document.querySelector("#date-empty-message");
const resultWarnings = document.querySelector("#result-warnings");
const manualDateLabel = document.querySelector("#manual-date-label");
const manualArrivalDate = document.querySelector("#manual-arrival-date");
const noArrivalsMessage = document.querySelector("#no-arrivals-message");
const tableScroll = document.querySelector(".table-scroll");
const relatedSection = document.querySelector("#related-reservations-section");
const relatedDniInput = document.querySelector("#related-dni-input");
const relatedDniButton = document.querySelector("#related-dni-button");
const relatedErrors = document.querySelector("#related-errors");
const relatedEmptyMessage = document.querySelector("#related-empty-message");
const relatedResults = document.querySelector("#related-results");
const relatedSummary = document.querySelector("#related-summary");
const relatedReservationRows = document.querySelector("#related-reservation-rows");
const relatedDetailList = document.querySelector("#related-detail-list");
const responsibleAggregateSection = document.querySelector("#responsible-aggregate-section");
const responsibleAggregateRows = document.querySelector("#responsible-aggregate-rows");
const nonRelatableSection = document.querySelector("#non-relatable-section");
const nonRelatableSummary = document.querySelector("#non-relatable-summary");
const nonRelatableResults = document.querySelector("#non-relatable-results");
const nonRelatableRows = document.querySelector("#non-relatable-rows");
const nonRelatableEmptyMessage = document.querySelector("#non-relatable-empty-message");
const passengerDuplicatesSection = document.querySelector("#passenger-duplicates-section");
const passengerDuplicatesSummary = document.querySelector("#passenger-duplicates-summary");
const passengerDuplicatesResults = document.querySelector("#passenger-duplicates-results");
const passengerDuplicatesRows = document.querySelector("#passenger-duplicates-rows");
const passengerDuplicatesEmptyMessage = document.querySelector("#passenger-duplicates-empty-message");
const actionsDateLabel = document.querySelector("#actions-date-label");
const outputStatus = document.querySelector("#output-status");
const roomingMapButton = document.querySelector("#rooming-map-button");
const roomingPcButton = document.querySelector("#rooming-pc-button");

const CUSTOM_DATE_OPTION = "__custom_date__";

let parsedRecords = [];
let processedReservations = [];
let responsibleRelationships = null;
let csvWarnings = [];

function resetRelatedResults() {
    relatedSection.hidden = true;
    relatedErrors.hidden = true;
    relatedErrors.replaceChildren();
    relatedEmptyMessage.hidden = true;
    relatedResults.hidden = true;
    relatedSummary.textContent = "";
    relatedReservationRows.replaceChildren();
    relatedDetailList.replaceChildren();
}

function resetResponsibleAggregate() {
    responsibleAggregateSection.hidden = true;
    responsibleAggregateRows.replaceChildren();

    for (const selector of [
        "#aggregate-responsible-dni",
        "#aggregate-voucher-count",
        "#aggregate-pax-count",
        "#aggregate-document-count",
        "#aggregate-accommodations",
        "#aggregate-min-arrival",
        "#aggregate-max-departure"
    ]) {
        document.querySelector(selector).textContent = "";
    }
}

function resetNonRelatable() {
    nonRelatableSection.hidden = true;
    nonRelatableSummary.textContent = "";
    nonRelatableResults.hidden = true;
    nonRelatableRows.replaceChildren();
    nonRelatableEmptyMessage.hidden = true;
}

function resetPassengerDuplicates() {
    passengerDuplicatesSection.hidden = true;
    passengerDuplicatesSummary.textContent = "";
    passengerDuplicatesResults.hidden = true;
    passengerDuplicatesRows.replaceChildren();
    passengerDuplicatesEmptyMessage.hidden = true;
}

function resetResults() {
    resultsSection.hidden = true;
    reservationRows.replaceChildren();
    noArrivalsMessage.hidden = true;
    tableScroll.hidden = false;
    actionsDateLabel.textContent = "";
    outputStatus.hidden = true;
    outputStatus.replaceChildren();
}

function compareDates(dateA, dateB) {
    const parseDate = value => {
        const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
        if (!match) return null;

        const [, day, month, year] = match;
        const parsed = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
        if (
            parsed.getUTCDate() !== Number(day) ||
            parsed.getUTCMonth() !== Number(month) - 1 ||
            parsed.getUTCFullYear() !== Number(year)
        ) {
            return null;
        }

        return parsed.getTime();
    };

    const valueA = parseDate(dateA);
    const valueB = parseDate(dateB);
    if (valueA !== null && valueB !== null) return valueA - valueB;
    if (valueA !== null) return -1;
    if (valueB !== null) return 1;
    return dateA.localeCompare(dateB, "es", { numeric: true });
}

function resetFileState() {
    parsedRecords = [];
    processedReservations = [];
    responsibleRelationships = null;
    csvWarnings = [];
    resetResults();
    resetRelatedResults();
    resetResponsibleAggregate();
    resetNonRelatable();
    resetPassengerDuplicates();
    dateSection.hidden = true;
    arrivalDate.replaceChildren(new Option("Selecciona una fecha", ""));
    arrivalDate.add(new Option("Otra fecha…", CUSTOM_DATE_OPTION));
    processButton.disabled = true;
    dateEmptyMessage.hidden = true;
    manualDateLabel.hidden = true;
    manualArrivalDate.hidden = true;
    manualArrivalDate.value = "";
    fileWarnings.hidden = true;
    fileWarnings.replaceChildren();
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

function showMessages(container, messages) {
    container.replaceChildren();
    container.hidden = messages.length === 0;

    for (const message of messages) {
        const paragraph = document.createElement("p");
        paragraph.textContent = message;
        container.append(paragraph);
    }
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
        const { headerCount, invalidRowCount } = inspectCsv(csvText);
        parsedRecords = parseCSV(csvText);
        processedReservations = processReservations(parsedRecords);
        responsibleRelationships = buildResponsibleRelationships(processedReservations);

        const allArrivalDates = parsedRecords
            .map(record => record.estadia.ingreso)
            .filter(value => typeof value === "string" && value.trim() !== "");
        const validDates = [...new Set(allArrivalDates
            .filter(date => parseDateKey(date) !== null))]
            .sort(compareDates);
        const invalidDateRows = parsedRecords.filter(record => {
            const value = record.estadia?.ingreso;
            return typeof value === "string" && value.trim() !== "" && parseDateKey(value) === null;
        }).length;
        const recordsWithoutVoucher = parsedRecords.filter(record => !record.voucher).length;
        const recordsWithoutDate = parsedRecords.filter(record => !record.estadia.ingreso).length;
        const recordsWithoutService = parsedRecords.filter(record => !record.servicios).length;

        if (headerCount !== 28) {
            csvWarnings.push(`La cabecera tiene ${headerCount} columnas; se esperaban 28.`);
        }
        if (invalidRowCount > 0) {
            csvWarnings.push(`${formatCount(invalidRowCount, "fila tiene", "filas tienen")} una cantidad de columnas distinta de 28 y el parser no las incluyó.`);
        }
        if (invalidDateRows > 0) {
            csvWarnings.push(`${formatCount(invalidDateRows, "pasajero tiene", "pasajeros tienen")} una fecha de ingreso no válida y queda fuera del selector.`);
        }
        if (recordsWithoutVoucher > 0) {
            csvWarnings.push(`${formatCount(recordsWithoutVoucher, "pasajero no tiene", "pasajeros no tienen")} voucher y no pueden agruparse como reserva.`);
        }
        if (recordsWithoutDate > 0) {
            csvWarnings.push(`${formatCount(recordsWithoutDate, "pasajero no tiene", "pasajeros no tienen")} fecha de ingreso y no aparecen en una consulta por fecha.`);
        }
        if (recordsWithoutService > 0) {
            csvWarnings.push(`${formatCount(recordsWithoutService, "pasajero no tiene", "pasajeros no tienen")} servicio informado; se conservan sin régimen.`);
        }
        if (parsedRecords.length === 0) {
            csvWarnings.push("El parser no encontró filas válidas de 28 columnas.");
        }

        arrivalDate.replaceChildren(new Option("Selecciona una fecha", ""));
        for (const date of validDates) arrivalDate.add(new Option(date, date));
        arrivalDate.add(new Option("Otra fecha…", CUSTOM_DATE_OPTION));
        dateEmptyMessage.hidden = validDates.length > 0;
        dateSection.hidden = false;

        const sizeInKilobytes = Math.max(1, Math.round(file.size / 1024));
        fileStatus.textContent = `Archivo cargado: ${file.name} · ${sizeInKilobytes} KB · ${formatCount(parsedRecords.length, "pasajero válido", "pasajeros válidos")} · ${formatCount(processedReservations.length, "reserva agrupada", "reservas agrupadas")}.`;
        showMessages(fileWarnings, csvWarnings);
        renderNonRelatable(buildNonRelatableView(responsibleRelationships));
        renderPassengerDuplicates(
            findPotentialPassengerDuplicates(processedReservations)
        );
    } catch (error) {
        resetFileState();
        fileStatus.textContent = `No se pudo procesar el CSV: ${error.message}`;
    }
}

function normalizeService(value) {
    return String(value || "")
        .trim()
        .toUpperCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

function formatCount(count, singular, plural) {
    return `${count} ${count === 1 ? singular : plural}`;
}

function getMealRegime(service) {
    const normalized = normalizeService(service);
    if (normalized === "PENSION COMPLETA") return "PC";
    if (normalized === "MEDIA PENSION") return "MAP";
    return null;
}

function getDistinctValues(values) {
    return [...new Set(values.filter(Boolean))];
}

function getServiceLabel(passengers) {
    const services = getDistinctValues(passengers.map(passenger => passenger.servicios));
    if (passengers.some(passenger => !passenger.servicios)) {
        services.push("Desayuno · servicio no informado en origen");
    }
    return services.join(" · ") || "Sin servicio informado";
}

function formatDateInput(value) {
    const [year, month, day] = value.split("-");
    return `${day}/${month}/${year}`;
}

function getSelectedDate() {
    if (arrivalDate.value === CUSTOM_DATE_OPTION) {
        return manualArrivalDate.value ? formatDateInput(manualArrivalDate.value) : "";
    }
    return arrivalDate.value;
}

function summarizeArrivals(reservations, incoming, date) {
    const mapPassengers = incoming.filter(record => getMealRegime(record.servicios) === "MAP");
    const pcPassengers = incoming.filter(record => getMealRegime(record.servicios) === "PC");
    const mapVouchers = new Set(reservations
        .filter(reservation => reservation.pasajeros.some(passenger =>
            passenger.estadia.ingreso === date && getMealRegime(passenger.servicios) === "MAP"))
        .map(reservation => reservation.voucher));
    const pcVouchers = new Set(reservations
        .filter(reservation => reservation.pasajeros.some(passenger =>
            passenger.estadia.ingreso === date && getMealRegime(passenger.servicios) === "PC"))
        .map(reservation => reservation.voucher));
    const rooms = new Set(incoming
        .filter(record => record.habitacion?.numero)
        .map(record => JSON.stringify([
            record.alojamiento || null,
            String(record.habitacion.numero)
        ])));
    const classificationCounts = {
        INDIVIDUAL: 0,
        CONTINGENTE: 0,
        NO_CLASIFICADA: 0
    };

    for (const reservation of reservations) {
        const type = reservation.clasificacion.tipo;
        if (classificationCounts[type] !== undefined) classificationCounts[type]++;
    }

    return {
        passengers: incoming.length,
        reservations: reservations.length,
        rooms: rooms.size,
        mapPassengers: mapPassengers.length,
        mapReservations: mapVouchers.size,
        pcPassengers: pcPassengers.length,
        pcReservations: pcVouchers.size,
        classificationCounts
    };
}

function renderSummary(summary) {
    document.querySelector("#passenger-count").textContent = String(summary.passengers);
    document.querySelector("#reservation-count").textContent = String(summary.reservations);
    document.querySelector("#room-count").textContent = String(summary.rooms);
    document.querySelector("#map-passenger-count").textContent = String(summary.mapPassengers);
    document.querySelector("#map-reservation-count").textContent = String(summary.mapReservations);
    document.querySelector("#pc-passenger-count").textContent = String(summary.pcPassengers);
    document.querySelector("#pc-reservation-count").textContent = String(summary.pcReservations);

    document.querySelector("#map-status").textContent = summary.mapReservations > 0
        ? `Hay ingresos MAP: ${formatCount(summary.mapPassengers, "pasajero", "pasajeros")} en ${formatCount(summary.mapReservations, "reserva", "reservas")}.`
        : "No hay ingresos MAP para la fecha seleccionada.";

    const counts = summary.classificationCounts;
    document.querySelector("#classification-status").textContent =
        `Clasificación del motor: ${formatCount(counts.INDIVIDUAL, "individual", "individuales")} · ${formatCount(counts.CONTINGENTE, "contingente", "contingentes")} · ${formatCount(counts.NO_CLASIFICADA, "no clasificada", "no clasificadas")}.`;
}

function appendCell(row, value) {
    const cell = document.createElement("td");
    cell.textContent = value;
    row.append(cell);
    return cell;
}

function addDetails(cell, label, entries) {
    if (entries.length === 0) return;

    const details = document.createElement("details");
    const summary = document.createElement("summary");
    summary.textContent = label;
    details.append(summary);
    const list = document.createElement("ul");
    for (const entry of entries) {
        const item = document.createElement("li");
        item.textContent = entry;
        list.append(item);
    }
    details.append(list);
    cell.append(details);
}

function formatRoomLabel(alojamiento, numero, asignaciones = []) {
    const roomLabel = alojamiento
        ? `Aloj. ${alojamiento} — Hab. ${numero}`
        : `Hab. ${numero}`;
    const assignmentLabel = asignaciones.length
        ? ` (${asignaciones.join("/")})`
        : "";

    return `${roomLabel}${assignmentLabel}`;
}

function getRoomLabels(reservation, date) {
    const habitaciones = Array.isArray(reservation.habitaciones)
        ? reservation.habitaciones
        : [];
    const labelsByIdentity = new Map();

    for (const habitacion of habitaciones) {
        if (!habitacion || !habitacion.numero) continue;

        const pasajeros = Array.isArray(habitacion.pasajeros)
            ? habitacion.pasajeros.filter(passenger =>
                passenger.estadia.ingreso === date)
            : [];

        if (pasajeros.length === 0) continue;

        const alojamiento = habitacion.alojamiento ?? null;
        const numero = String(habitacion.numero);
        const identity = JSON.stringify([alojamiento, numero]);
        const asignaciones = getDistinctValues(
            pasajeros.map(passenger => passenger.habitacion?.asignacion)
        );

        if (!labelsByIdentity.has(identity)) {
            labelsByIdentity.set(
                identity,
                formatRoomLabel(alojamiento, numero, asignaciones)
            );
        }
    }

    return Array.from(labelsByIdentity.values());
}

function renderReservationRow(reservation, date) {
    const arrivals = reservation.pasajeros.filter(passenger => passenger.estadia.ingreso === date);
    const firstPassenger = reservation.pasajeros[0];
    const row = document.createElement("tr");
    const hotels = getDistinctValues(arrivals.map(passenger => passenger.hotel));

    appendCell(row, reservation.voucher || "Sin voucher");
    appendCell(row, firstPassenger?.pax?.nombre || "Sin dato");
    appendCell(row, hotels.join(", ") || "Sin dato");
    appendCell(row, getRoomLabels(reservation, date).join(", ") || "Sin dato");
    appendCell(row, String(arrivals.length));
    appendCell(row, getServiceLabel(arrivals));
    const classificationCell = appendCell(row, reservation.clasificacion.tipo);
    const signals = getDistinctValues(reservation.pasajeros.flatMap(passenger => classifyRecord(passenger).razones));
    addDetails(classificationCell, "Señales", signals);
    addDetails(classificationCell, "Advertencias", reservation.clasificacion.advertencias);
    return row;
}

function renderUnassignedRow(passenger) {
    const row = document.createElement("tr");
    appendCell(row, "Sin voucher");
    appendCell(row, passenger.pax.nombre || "Sin dato");
    appendCell(row, passenger.hotel || "Sin dato");
    const room = passenger.habitacion;
    const roomLabel = room?.numero
        ? formatRoomLabel(
            passenger.alojamiento ?? null,
            room.numero,
            room.asignacion ? [room.asignacion] : []
        )
        : null;
    appendCell(row, roomLabel || "Sin dato");
    appendCell(row, "1");
    appendCell(row, getServiceLabel([passenger]));
    const classificationCell = appendCell(row, classifyReservation([passenger]).tipo);
    const signals = getDistinctValues(classifyRecord(passenger).razones);
    addDetails(classificationCell, "Señales", signals);
    addDetails(classificationCell, "Advertencias", ["No agrupada: falta el número de voucher."]);
    return row;
}

function processReservationsForDate() {
    const date = getSelectedDate();
    if (!date) return;

    const incoming = parsedRecords.filter(record => record.estadia.ingreso === date);
    const incomingVouchers = new Set(incoming.map(record => record.voucher).filter(Boolean));
    const matchingReservations = processedReservations.filter(reservation => incomingVouchers.has(reservation.voucher));
    const unassignedPassengers = incoming.filter(record => !record.voucher);
    const summary = summarizeArrivals(matchingReservations, incoming, date);
    const messages = [...csvWarnings];
    const missingHotel = incoming.filter(record => !record.hotel).length;
    const missingRoom = incoming.filter(record => !record.habitacion.numero).length;
    if (missingHotel > 0) messages.push(`${formatCount(missingHotel, "pasajero sin hotel informado", "pasajeros sin hotel informado")}.`);
    if (missingRoom > 0) messages.push(`${formatCount(missingRoom, "pasajero sin habitación informada", "pasajeros sin habitación informada")}.`);

    for (const reservation of matchingReservations) {
        const dates = getDistinctValues(reservation.pasajeros.map(passenger => passenger.estadia.ingreso));
        if (dates.length > 1) {
            messages.push(`El voucher ${reservation.voucher} contiene más de una fecha de ingreso; se cuentan solo los pasajeros que ingresan el ${date}.`);
        }
        if (getDistinctValues(reservation.pasajeros.map(passenger => passenger.servicios)).length > 1) {
            messages.push(`El voucher ${reservation.voucher} contiene servicios distintos entre pasajeros; se conservan sin unificar.`);
        }
        if (getDistinctValues(reservation.pasajeros.map(passenger => passenger.hotel)).length > 1) {
            messages.push(`El voucher ${reservation.voucher} contiene hoteles distintos entre pasajeros; se conservan sin unificar.`);
        }
    }
    showMessages(resultWarnings, getDistinctValues(messages));

    document.querySelector("#selected-date-label").textContent = date;
    actionsDateLabel.textContent = date;
    renderSummary(summary);
    reservationRows.replaceChildren();
    for (const reservation of matchingReservations) {
        reservationRows.append(renderReservationRow(reservation, date));
    }
    for (const passenger of unassignedPassengers) {
        reservationRows.append(renderUnassignedRow(passenger));
    }
    if (matchingReservations.length === 0 && unassignedPassengers.length === 0) {
        noArrivalsMessage.hidden = false;
        tableScroll.hidden = true;
    }

    resultsSection.hidden = false;
    relatedSection.hidden = false;
}

function showOutputMessages(messages) {
    outputStatus.replaceChildren();
    outputStatus.hidden = messages.length === 0;

    for (const message of messages) {
        const paragraph = document.createElement("p");
        paragraph.textContent = message;
        outputStatus.append(paragraph);
    }
}

function downloadCsv(csv, filename) {
    const blob = new Blob(["\ufeff", csv], {
        type: "text/csv;charset=utf-8"
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
}

function getFilenameDate(date) {
    const match = date.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    return match ? `${match[3]}-${match[2]}-${match[1]}` : "fecha";
}

function handleRoomingGeneration(mode) {
    try {
        const date = getSelectedDate();
        const result = buildRoomingCsvForDate(
            processedReservations,
            date,
            mode
        );

        if (!result.csv) {
            showOutputMessages([
                `No hay pasajeros Rooming ${mode} que ingresen en esta fecha.`
            ]);
            return;
        }

        const filename = `rooming_${mode.toLowerCase()}_${getFilenameDate(date)}.csv`;
        downloadCsv(result.csv, filename);
        showOutputMessages([
            `CSV descargado: ${filename} · ${formatCount(result.estadisticas.pasajeros, "pasajero", "pasajeros")} · ${formatCount(result.estadisticas.habitaciones, "habitación", "habitaciones")}.`
        ]);
    } catch (error) {
        showOutputMessages([`No se pudo generar Rooming ${mode}: ${error.message}`]);
    }
}

function renderNonRelatable(view) {
    resetNonRelatable();

    nonRelatableSection.hidden = false;

    if (view.cantidad === 0) {
        nonRelatableEmptyMessage.hidden = false;
        return;
    }

    nonRelatableSummary.textContent = view.cantidad === 1
        ? "1 reserva requiere revisión"
        : `${view.cantidad} reservas requieren revisión`;

    for (const fila of view.filas) {
        const row = document.createElement("tr");
        appendCell(row, fila.voucher);
        appendCell(row, fila.etiqueta);
        nonRelatableRows.append(row);
    }

    nonRelatableResults.hidden = false;
}

function renderPassengerDuplicates(duplicates) {
    resetPassengerDuplicates();
    passengerDuplicatesSection.hidden = false;

    if (duplicates.length === 0) {
        passengerDuplicatesEmptyMessage.hidden = false;
        return;
    }

    passengerDuplicatesSummary.textContent = formatCount(
        duplicates.length,
        "coincidencia candidata",
        "coincidencias candidatas"
    );

    for (const duplicate of duplicates) {
        const row = document.createElement("tr");
        appendCell(row, duplicate.voucher || "Sin voucher");
        appendCell(row, `PAX ${duplicate.firstPassengerIndex + 1}`);
        appendCell(row, `PAX ${duplicate.duplicatePassengerIndex + 1}`);
        passengerDuplicatesRows.append(row);
    }

    passengerDuplicatesResults.hidden = false;
}

function renderRelatedReservations(dni) {
    relatedErrors.hidden = true;
    relatedErrors.replaceChildren();
    relatedEmptyMessage.hidden = true;
    relatedResults.hidden = true;
    relatedReservationRows.replaceChildren();
    relatedDetailList.replaceChildren();

    const relationship = findRelatedReservationsByDni(
        responsibleRelationships,
        dni
    );

    relatedSection.hidden = false;

    if (relationship.vouchers.length === 0) {
        relatedEmptyMessage.hidden = false;
        return;
    }

    const view = buildResponsibleRelationsView(
        responsibleRelationships,
        dni,
        processedReservations,
        { includeDetail: true }
    );

    relatedSummary.textContent =
        `Responsable candidato: ${view.responsableDni} · ` +
        `${formatCount(view.cantidadVouchers, "voucher relacionado", "vouchers relacionados")}`;

    for (const voucher of view.vouchers) {
        const row = document.createElement("tr");
        const voucherCell = document.createElement("td");
        const accommodationCell = document.createElement("td");
        const roomsCell = document.createElement("td");

        voucherCell.textContent = voucher.voucher || "—";
        accommodationCell.textContent = voucher.alojamiento || "—";
        roomsCell.textContent = voucher.habitaciones.join(", ") || "—";

        row.append(voucherCell, accommodationCell, roomsCell);
        relatedReservationRows.append(row);

        if (voucher.detalle) {
            relatedDetailList.append(renderRelatedReservationDetail(voucher.detalle));
        }
    }

    relatedResults.hidden = false;
}

function appendAggregateField(cell, field) {
    if (!field) {
        cell.textContent = "Sin dato";
        return;
    }

    if (field.uniforme) {
        cell.textContent = field.valor || "Sin dato";
        return;
    }

    const label = document.createElement("span");
    const values = document.createElement("ul");
    label.className = "aggregate-divergence-label";
    label.textContent = "Valores diferentes";

    for (const value of field.valores) {
        const item = document.createElement("li");
        item.textContent = value || "Sin dato";
        values.append(item);
    }

    cell.append(label, values);
}

function renderResponsibleAggregate(dni) {
    resetResponsibleAggregate();

    const view = buildResponsibleRelationsAggregateView(
        responsibleRelationships,
        dni,
        processedReservations
    );

    if (view.vouchers.length === 0) return;

    document.querySelector("#aggregate-responsible-dni").textContent = view.responsableDni || "Sin dato";
    document.querySelector("#aggregate-voucher-count").textContent = String(view.cantidadVouchers);
    document.querySelector("#aggregate-pax-count").textContent = String(view.totalPaxRegistrados);
    document.querySelector("#aggregate-document-count").textContent = String(view.documentosDistintos);
    document.querySelector("#aggregate-accommodations").textContent = view.alojamientos.join(", ") || "Sin dato";
    document.querySelector("#aggregate-min-arrival").textContent = view.extremosFechas.ingresoMinimo || "Sin dato";
    document.querySelector("#aggregate-max-departure").textContent = view.extremosFechas.egresoMaximo || "Sin dato";

    for (const voucher of view.vouchers) {
        const row = document.createElement("tr");
        const voucherCell = document.createElement("td");

        voucherCell.textContent = voucher.voucher || "Sin dato";
        row.append(voucherCell);
        appendCell(row, voucher.alojamiento || "Sin dato");
        appendCell(row, voucher.habitaciones.join(", ") || "Sin dato");
        appendAggregateField(appendCell(row, ""), voucher.fechaIngreso);
        appendAggregateField(appendCell(row, ""), voucher.fechaEgreso);
        appendCell(row, String(voucher.cantidadPasajeros));
        appendCell(row, voucher.clasificacion?.tipo || "Sin dato");
        appendAggregateField(appendCell(row, ""), voucher.servicios);
        responsibleAggregateRows.append(row);
    }

    responsibleAggregateSection.hidden = false;
}

function appendDetailField(container, label, value) {
    const term = document.createElement("dt");
    const description = document.createElement("dd");

    term.textContent = label;
    description.textContent = value;
    container.append(term, description);
}

function appendConsolidatedField(container, label, field) {
    const term = document.createElement("dt");
    const description = document.createElement("dd");

    term.textContent = label;

    if (field.uniforme) {
        description.textContent = field.valor || "—";
    }
    else {
        const title = document.createElement("span");
        const values = document.createElement("ul");

        title.textContent = "Valores diferentes";
        for (const value of field.valores) {
            const item = document.createElement("li");
            item.textContent = value || "—";
            values.append(item);
        }

        description.append(title, values);
    }

    container.append(term, description);
}

function renderRelatedReservationDetail(detail) {
    const article = document.createElement("article");
    const heading = document.createElement("h3");
    const identity = document.createElement("dl");
    const roomsHeading = document.createElement("h4");
    const roomsTable = document.createElement("table");
    const roomsHead = document.createElement("thead");
    const roomsBody = document.createElement("tbody");
    const roomsHeaderRow = document.createElement("tr");

    article.className = "related-detail";
    heading.textContent = `Voucher ${detail.voucher || "—"}`;
    identity.className = "related-detail-fields";
    appendDetailField(identity, "Responsable candidato", detail.responsableDni || "—");
    appendDetailField(identity, "Alojamiento", detail.alojamiento || "—");
    appendDetailField(identity, "Pasajeros", String(detail.cantidadPasajeros));
    appendDetailField(identity, "Clasificación", detail.clasificacion?.tipo || "—");
    appendConsolidatedField(identity, "Ingreso", detail.fechaIngreso);
    appendConsolidatedField(identity, "Egreso", detail.fechaEgreso);
    appendConsolidatedField(identity, "Servicios", detail.servicios);

    roomsHeading.textContent = "Habitaciones";
    roomsTable.className = "related-detail-rooms";
    roomsTable.append(roomsHead, roomsBody);
    for (const label of ["Habitación", "Capacidad / ocupación"]) {
        const cell = document.createElement("th");
        cell.scope = "col";
        cell.textContent = label;
        roomsHeaderRow.append(cell);
    }
    roomsHead.append(roomsHeaderRow);

    for (const room of detail.habitaciones) {
        const row = document.createElement("tr");
        const numberCell = document.createElement("td");
        const capacityCell = document.createElement("td");
        numberCell.textContent = room.numero || "—";
        capacityCell.textContent = `${room.capacidad ?? "—"} / ${room.ocupadasInformadas ?? "—"}`;
        row.append(numberCell, capacityCell);
        roomsBody.append(row);
    }

    article.append(heading, identity, roomsHeading, roomsTable);
    return article;
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
processButton.addEventListener("click", processReservationsForDate);
roomingMapButton.addEventListener("click", () => handleRoomingGeneration("MAP"));
roomingPcButton.addEventListener("click", () => handleRoomingGeneration("PC"));
function handleRelatedDniQuery() {
    const dni = relatedDniInput.value.trim();

    if (!dni) {
        resetRelatedResults();
        resetResponsibleAggregate();
        relatedSection.hidden = false;
        relatedErrors.hidden = false;
        const message = document.createElement("p");
        message.textContent = "Ingresa un DNI candidato para consultar.";
        relatedErrors.append(message);
        return;
    }

    if (!responsibleRelationships) return;

    renderRelatedReservations(dni);
    renderResponsibleAggregate(dni);
}

relatedDniButton.addEventListener("click", handleRelatedDniQuery);