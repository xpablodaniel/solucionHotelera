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

let reservations = [];

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
