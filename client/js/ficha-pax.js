const {
    parseCSV,
    parseCSVLine,
    processReservations,
    buildFichaPaxPages,
    searchFichaPax
} = window.FichaPaxCore;

const fileInput = document.querySelector("#csv-input");
const dropZone = document.querySelector("#drop-zone");
const fileStatus = document.querySelector("#file-status");
const fileWarnings = document.querySelector("#file-warnings");
const searchSection = document.querySelector("#search-section");
const searchInput = document.querySelector("#search-input");
const searchStatus = document.querySelector("#search-status");
const searchResults = document.querySelector("#search-results");
const previewSection = document.querySelector("#preview-section");
const fichaPages = document.querySelector("#ficha-pages");
const downloadPdfButton = document.querySelector("#download-pdf");
const pdfStatus = document.querySelector("#pdf-status");
const mmToPt = 72 / 25.4;
const templateUrl = "../assets/templates/1fichaPax.pdf";

let reservations = [];
let selectedReservation = null;

function clearChildren(element) {
    element.replaceChildren();
}


function addField(container, label, value) {

    const item = document.createElement("div");
    const term = document.createElement("dt");
    const description = document.createElement("dd");

    term.textContent = label;
    description.textContent = value || "—";
    item.append(term, description);
    container.append(item);
}


function formatRooms(rooms) {

    return rooms
        .map(room => room.numero)
        .filter(Boolean)
        .join(", ");
}


function renderPage(page, index, total) {

    const article = document.createElement("article");
    article.className = "ficha-page";
    article.setAttribute("aria-label", `Página ${index + 1} de ${total}`);

    const header = document.createElement("header");
    header.className = "ficha-page-header";

    const eyebrow = document.createElement("p");
    eyebrow.textContent = `Ficha PAX · Página ${index + 1} de ${total}`;

    const title = document.createElement("h3");
    title.textContent = page.titular?.pax?.nombre || "Ficha de pasajero";

    const voucher = document.createElement("span");
    voucher.textContent = `Voucher: ${page.voucher || "Sin dato"}`;
    header.append(eyebrow, title, voucher);

    const fields = document.createElement("dl");
    fields.className = "ficha-fields";
    addField(fields, "Nombre", page.titular?.pax?.nombre);
    addField(
        fields,
        "Documento",
        [page.titular?.pax?.tipoDocumento, page.titular?.pax?.numeroDocumento]
            .filter(Boolean)
            .join(" ")
    );
    addField(fields, "Teléfono", page.titular?.contacto?.celular || page.titular?.contacto?.telefono);
    addField(fields, "Email", page.titular?.contacto?.email);
    addField(fields, "Sede", page.titular?.sede);
    addField(fields, "Fecha de nacimiento", page.titular?.pax?.fechaNacimiento);
    addField(fields, "Hotel", page.titular?.hotel);
    addField(fields, "Habitación/es", formatRooms(page.habitaciones));
    addField(fields, "Fecha de ingreso", page.estadia.ingreso);
    addField(fields, "Fecha de egreso", page.estadia.egreso);
    addField(fields, "Servicios", page.servicios);

    const companionSection = document.createElement("section");
    companionSection.className = "ficha-companions";
    const companionHeading = document.createElement("h4");
    companionHeading.textContent = "Acompañantes";
    companionSection.append(companionHeading);

    if (page.acompanantes.length === 0) {
        const emptyMessage = document.createElement("p");
        emptyMessage.className = "ficha-empty";
        emptyMessage.textContent = "No hay acompañantes en esta página.";
        companionSection.append(emptyMessage);
    } else {
        for (const passenger of page.acompanantes) {
            const row = document.createElement("div");
            row.className = "ficha-companion";

            const name = document.createElement("span");
            name.textContent = passenger?.pax?.nombre || "Sin nombre";

            const documentNumber = document.createElement("span");
            documentNumber.textContent = [
                passenger?.pax?.tipoDocumento,
                passenger?.pax?.numeroDocumento
            ].filter(Boolean).join(" ") || "Sin documento";

            row.append(name, documentNumber);
            companionSection.append(row);
        }
    }

    article.append(header, fields, companionSection);
    return article;
}


function showPreview(reservation) {

    clearChildren(fichaPages);

    const pages = buildFichaPaxPages(reservation);
    selectedReservation = pages.length > 0 ? reservation : null;
    const isContingent = reservation.clasificacion?.tipo === "CONTINGENTE";
    downloadPdfButton.disabled = isContingent;
    pdfStatus.textContent = isContingent
        ? "No se genera ficha PAX para reservas de contingentes."
        : "";
    pdfStatus.classList.remove("error");
    pages.forEach((page, index) => {
        fichaPages.append(renderPage(page, index, pages.length));
    });

    previewSection.hidden = pages.length === 0;
    if (pages.length > 0) {
        previewSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
}


function renderSearchResults(matches, query) {

    clearChildren(searchResults);
    previewSection.hidden = true;
    clearChildren(fichaPages);
    selectedReservation = null;

    if (!query.trim()) {
        searchStatus.textContent = "Escribe un voucher, DNI o nombre para buscar.";
        return;
    }

    if (matches.length === 0) {
        searchStatus.textContent = "No se encontraron vouchers para esa búsqueda.";
        return;
    }

    searchStatus.textContent = `${matches.length} voucher(s) encontrado(s).`;

    for (const reservation of matches) {
        const card = document.createElement("article");
        card.className = "ficha-result";

        const details = document.createElement("div");
        const title = document.createElement("h3");
        title.textContent = reservation.pasajeros[0]?.pax?.nombre || "Sin titular identificado";

        const voucher = document.createElement("p");
        voucher.textContent = `Voucher: ${reservation.voucher || "Sin dato"}`;

        const summary = document.createElement("p");
        summary.textContent = `${reservation.cantidadPasajeros} pasajero(s) · ${reservation.habitaciones.length} habitación(es)`;
        details.append(title, voucher, summary);

        const button = document.createElement("button");
        button.className = "button button-primary";
        button.type = "button";
        button.textContent = "Ver ficha";
        button.addEventListener("click", () => showPreview(reservation));

        card.append(details, button);
        searchResults.append(card);
    }
}

function cleanPdfValue(value) {

    const text = String(value ?? "").trim();
    const placeholderValues = new Set([
        "0",
        "no informado",
        "noinformado",
        "sin email",
        "sin mail",
        "n/a",
        "na",
        "-"
    ]);

    return placeholderValues.has(text.toLocaleLowerCase()) ? "" : text;
}


function fitTextSize(font, text, baseSize, maxWidthMm) {

    const maxWidth = maxWidthMm * mmToPt;
    let size = baseSize;

    while (size > 6 && font.widthOfTextAtSize(text, size) > maxWidth) {
        size -= 0.5;
    }

    return size;
}


function drawPdfText(page, font, value, xMm, yTopMm, options = {}) {

    const text = cleanPdfValue(value);
    if (!text) {
        return;
    }

    const size = fitTextSize(
        font,
        text,
        options.size || 10,
        options.maxWidthMm || 100
    );
    page.drawText(text, {
        x: xMm * mmToPt,
        y: page.getHeight() - yTopMm * mmToPt,
        size,
        font
    });
}


function getPassengerText(passenger, property) {

    return cleanPdfValue(passenger?.pax?.[property]);
}


function drawFichaPage(page, ficha, regularFont, boldFont) {

    const titular = ficha.titular;
    const nombre = getPassengerText(titular, "nombre").toLocaleUpperCase();
    const tipoDocumento = getPassengerText(titular, "tipoDocumento");
    const numeroDocumento = getPassengerText(titular, "numeroDocumento");
    const documento = [tipoDocumento, numeroDocumento].filter(Boolean).join(": ");
    const telefonoRaw = cleanPdfValue(
        titular?.contacto?.celular || titular?.contacto?.telefono
    );
    const telefono = telefonoRaw.replace(/[^\d]/g, "").length >= 6
        ? telefonoRaw
        : "";
    const emailRaw = cleanPdfValue(titular?.contacto?.email);
    const email = emailRaw.includes("@") && emailRaw.length > 5
        ? emailRaw
        : "";
    const sede = cleanPdfValue(titular?.sede)
        .replace(/^\s*\d+\s*[-–—]\s*/, "");
    const habitaciones = ficha.habitaciones
        .map(room => cleanPdfValue(room.numero))
        .filter(Boolean)
        .join(", ");

    drawPdfText(page, regularFont, nombre, 70, 57, {
        maxWidthMm: 120
    });
    drawPdfText(page, regularFont, documento, 80, 65, {
        maxWidthMm: 110
    });
    drawPdfText(page, regularFont, telefono, 80, 72, {
        maxWidthMm: 45
    });
    drawPdfText(page, regularFont, email, 130, 72, {
        maxWidthMm: 65
    });
    drawPdfText(page, regularFont, sede, 45, 95, {
        maxWidthMm: 140
    });
    drawPdfText(
        page,
        regularFont,
        getPassengerText(titular, "fechaNacimiento"),
        162,
        65,
        { maxWidthMm: 35 }
    );

    ficha.acompanantes.slice(0, 3).forEach((passenger, index) => {
        const yTopMm = 115 + index * 7;
        const companionName = getPassengerText(passenger, "nombre")
            .toLocaleUpperCase();
        const companionDocument = [
            getPassengerText(passenger, "tipoDocumento"),
            getPassengerText(passenger, "numeroDocumento")
        ].filter(Boolean).join(": ");

        drawPdfText(page, regularFont, companionName, 45, yTopMm, {
            size: 9,
            maxWidthMm: 57
        });
        drawPdfText(page, regularFont, companionDocument, 105, yTopMm, {
            size: 9,
            maxWidthMm: 85
        });
    });

    drawPdfText(page, regularFont, habitaciones, 110, 187, {
        maxWidthMm: 85
    });
    drawPdfText(page, regularFont, ficha.estadia.ingreso, 75, 173, {
        maxWidthMm: 45
    });
    drawPdfText(page, regularFont, ficha.estadia.egreso, 142, 173, {
        maxWidthMm: 45
    });

    const servicios = cleanPdfValue(ficha.servicios).toLocaleUpperCase();
    const serviceX = servicios.includes("DESAYUNO") && !servicios.includes("MEDIA")
        ? 75
        : servicios.includes("MEDIA")
            ? 113
            : servicios.includes("COMPLETA") || servicios.includes("PENSION")
                ? 140
                : null;
    if (serviceX !== null) {
        drawPdfText(page, regularFont, "X", serviceX, 198);
    }

    drawPdfText(page, boldFont, ficha.voucher, 80, 40, {
        size: 11,
        maxWidthMm: 100
    });
}


async function createFichaPdf(reservation) {

    if (reservation.clasificacion?.tipo === "CONTINGENTE") {
        throw new Error("No se genera ficha PAX para reservas de contingentes.");
    }

    const pdfLibrary = window.PDFLib;
    if (!pdfLibrary?.PDFDocument) {
        throw new Error("No se pudo cargar la librería para generar PDF.");
    }

    const response = await fetch(templateUrl);
    if (!response.ok) {
        throw new Error("No se pudo cargar la plantilla PDF oficial.");
    }

    const templateBytes = await response.arrayBuffer();
    const templateDocument = await pdfLibrary.PDFDocument.load(templateBytes);
    const templatePages = templateDocument.getPages();
    if (templatePages.length !== 1) {
        throw new Error("La plantilla oficial debe tener exactamente una página.");
    }

    const fichaPagesData = buildFichaPaxPages(reservation);
    if (fichaPagesData.length === 0) {
        throw new Error("La reserva no tiene pasajeros para generar la ficha.");
    }

    const outputDocument = await pdfLibrary.PDFDocument.create();
    const regularFont = await outputDocument.embedFont(
        pdfLibrary.StandardFonts.Helvetica
    );
    const boldFont = await outputDocument.embedFont(
        pdfLibrary.StandardFonts.HelveticaBold
    );

    for (const ficha of fichaPagesData) {
        const [page] = await outputDocument.copyPages(templateDocument, [0]);
        drawFichaPage(page, ficha, regularFont, boldFont);
        outputDocument.addPage(page);
    }

    return outputDocument.save();
}


function makePdfFilename(voucher) {

    const safeVoucher = cleanPdfValue(voucher)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9_-]/gi, "_")
        .replace(/_+/g, "_")
        .replace(/^_|_$/g, "")
        .slice(0, 80) || "reserva";

    return `ficha_pax_${safeVoucher}.pdf`;
}


downloadPdfButton.addEventListener("click", async () => {

    const reservation = selectedReservation;
    if (!reservation) {
        pdfStatus.textContent = "Selecciona un voucher antes de generar la ficha.";
        pdfStatus.classList.add("error");
        return;
    }

    downloadPdfButton.disabled = true;
    pdfStatus.classList.remove("error");
    pdfStatus.textContent = "Generando ficha PDF...";

    try {
        const pdfBytes = await createFichaPdf(reservation);
        const filename = makePdfFilename(reservation.voucher);
        const blob = new Blob([pdfBytes], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        link.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
        pdfStatus.textContent = `Ficha PDF generada: ${filename}`;
    } catch (error) {
        pdfStatus.textContent =
            `No se pudo generar la ficha PDF: ${error.message}`;
        pdfStatus.classList.add("error");
    } finally {
        downloadPdfButton.disabled =
            !selectedReservation ||
            selectedReservation.clasificacion?.tipo === "CONTINGENTE";
    }
});


function showFileWarnings(messages) {

    clearChildren(fileWarnings);
    fileWarnings.hidden = messages.length === 0;

    for (const message of messages) {
        const paragraph = document.createElement("p");
        paragraph.textContent = message;
        fileWarnings.append(paragraph);
    }
}


function resetFileState() {

    reservations = [];
    selectedReservation = null;
    searchInput.value = "";
    searchSection.hidden = true;
    searchStatus.textContent = "";
    clearChildren(searchResults);
    clearChildren(fichaPages);
    previewSection.hidden = true;
    showFileWarnings([]);
}


async function handleFile(file) {

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
        const lines = csvText
            .split(/\r?\n/)
            .map(line => line.trim())
            .filter(Boolean);
        const headerCount = lines.length > 0
            ? parseCSVLine(lines[0]).length
            : 0;

        if (headerCount !== 28) {
            throw new Error(
                `El encabezado tiene ${headerCount} columnas; se esperaban 28.`
            );
        }

        const invalidRows = lines.slice(1)
            .filter(line => parseCSVLine(line).length !== 28)
            .length;
        const records = parseCSV(csvText);

        if (records.length === 0) {
            throw new Error("El archivo no contiene filas de reservas válidas.");
        }

        reservations = processReservations(records)
            .filter(reservation => reservation.voucher);

        if (reservations.length === 0) {
            throw new Error("No hay pasajeros asociados a vouchers en el archivo.");
        }

        fileStatus.textContent =
            `Archivo cargado: ${file.name} · ${reservations.length} voucher(s).`;
        showFileWarnings(invalidRows > 0
            ? [`Se omitieron ${invalidRows} fila(s) con una cantidad de columnas distinta de 28.`]
            : []);
        searchSection.hidden = false;
        searchStatus.textContent =
            "Escribe un voucher, DNI o nombre para buscar.";
        searchInput.focus();
    } catch (error) {
        fileStatus.textContent = `No se pudo procesar el archivo: ${error.message}`;
    }
}


for (const eventName of ["dragenter", "dragover"]) {
    dropZone.addEventListener(eventName, event => {
        event.preventDefault();
        dropZone.classList.add("is-dragging");
    });
}

for (const eventName of ["dragleave", "drop"]) {
    dropZone.addEventListener(eventName, event => {
        event.preventDefault();
        dropZone.classList.remove("is-dragging");
    });
}

dropZone.addEventListener("drop", event => {
    const [file] = event.dataTransfer?.files || [];
    if (file) {
        handleFile(file);
    }
});

fileInput.addEventListener("change", () => {
    handleFile(fileInput.files[0]);
});

searchInput.addEventListener("input", () => {
    const query = searchInput.value;
    const matches = searchFichaPax(reservations, query);
    renderSearchResults(matches, query);
});
