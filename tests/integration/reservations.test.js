const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { JSDOM } = require("jsdom");

const root = path.resolve(__dirname, "../..");
const htmlSource = fs.readFileSync(path.join(root, "client/reservations.html"), "utf8");
const bundleSource = fs.readFileSync(path.join(root, "client/js/reservations-core.js"), "utf8");
const controllerSource = fs.readFileSync(path.join(root, "client/js/reservations.js"), "utf8");

const headers = [
    "Cód. Alojamiento", "Descripción", "Nro. habitación", "Tipo habitación",
    "Observación habitación", "Cantidad plazas", "Voucher", "Sede",
    "Fecha de ingreso", "Fecha de egreso", "Plazas ocupadas", "Tipo documento",
    "Nro. doc.", "Apellido y nombre", "Edad", "Entidad", "Servicios", "Paquete",
    "Transporte", "Fecha viaje", "Hora viaje", "Parada", "Email", "Estado",
    "Fecha de nacimiento", "Teléfono", "Celular", "Usuario"
];

function makeRecord(overrides = {}) {
    const values = Array(28).fill("");
    const fields = {
        accommodationCode: "900",
        hotel: "HOTEL SINTETICO",
        room: "101",
        roomType: "DOBLE",
        roomObservation: "",
        capacity: "2",
        voucher: "SYN-1",
        arrival: "11/03/2026",
        departure: "14/03/2026",
        documentType: "DNI",
        document: "DOC-1",
        name: "PASAJERO SINTETICO",
        age: "40",
        office: "SEDE SINTETICA",
        service: "MEDIA PENSION",
        package: "PAQUETE SINTETICO",
        paymentStatus: "O",
        ...overrides
    };

    values[0] = fields.accommodationCode;
    values[1] = fields.hotel;
    values[2] = fields.room;
    values[3] = fields.roomType;
    values[4] = fields.roomObservation;
    values[5] = fields.capacity;
    values[6] = fields.voucher;
    values[7] = fields.office;
    values[8] = fields.arrival;
    values[9] = fields.departure;
    values[11] = fields.documentType;
    values[12] = fields.document;
    values[13] = fields.name;
    values[14] = fields.age;
    values[16] = fields.service;
    values[17] = fields.package;
    values[23] = fields.paymentStatus;
    return values;
}

function csvEscape(value) {
    const text = String(value ?? "");
    return /[",\r\n]/.test(text)
        ? `"${text.replace(/"/g, '""')}"`
        : text;
}

function makeCsv(records) {
    return [headers, ...records]
        .map(record => record.map(csvEscape).join(","))
        .join("\r\n");
}

function createApp() {
    const dom = new JSDOM(htmlSource, {
        runScripts: "outside-only",
        url: "http://localhost/client/reservations.html"
    });

    const createdBlobs = new Map();
    const openedLinks = [];
    let nextObjectUrl = 0;
    Object.defineProperty(dom.window.URL, "createObjectURL", {
        configurable: true,
        value: blob => {
            const objectUrl = `blob:http://localhost/${++nextObjectUrl}`;
            createdBlobs.set(objectUrl, blob);
            return objectUrl;
        }
    });
    Object.defineProperty(dom.window.URL, "revokeObjectURL", {
        configurable: true,
        value: () => {}
    });
    Object.defineProperty(dom.window, "setTimeout", {
        configurable: true,
        value: callback => {
            callback();
            return 0;
        }
    });
    dom.window.__createdBlobs = createdBlobs;
    dom.window.__openedLinks = openedLinks;
    dom.window.HTMLAnchorElement.prototype.click = function () {
        openedLinks.push({ href: this.href, download: this.download });
    };

    dom.window.eval(bundleSource);
    dom.window.eval(controllerSource);
    assert.ok(dom.window.ReservationsCore);
    return dom;
}

async function waitUntil(predicate, message) {
    for (let attempt = 0; attempt < 50; attempt++) {
        if (predicate()) return;
        await new Promise(resolve => setTimeout(resolve, 0));
    }
    assert.fail(message);
}

async function uploadCsv(dom, csv, name = "synthetic.csv") {
    const input = dom.window.document.querySelector("#csv-input");
    const file = {
        name,
        size: Buffer.byteLength(csv),
        text: () => Promise.resolve(csv)
    };

    Object.defineProperty(input, "files", {
        configurable: true,
        value: [file]
    });
    input.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
    await waitUntil(
        () => dom.window.document.querySelector("#file-status").textContent.startsWith("Archivo cargado:") ||
            dom.window.document.querySelector("#file-status").textContent.startsWith("No se pudo procesar"),
        "CSV upload did not reach a terminal state"
    );
}

function tableRows(dom) {
    return [...dom.window.document.querySelectorAll("#reservation-rows tr")]
        .map(row => [...row.cells].map(cell => cell.textContent.trim()));
}

function readBlobText(dom, blob) {
    return new Promise((resolve, reject) => {
        const reader = new dom.window.FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsText(blob);
    });
}

function readBlobBytes(dom, blob) {
    return new Promise((resolve, reject) => {
        const reader = new dom.window.FileReader();
        reader.onload = () => resolve(new Uint8Array(reader.result));
        reader.onerror = () => reject(reader.error);
        reader.readAsArrayBuffer(blob);
    });
}

test("CSV upload automatically lists every passenger in room order with the historical fields", async () => {
    const dom = createApp();
    const csv = makeCsv([
        makeRecord({
            voucher: "SYN-MULTI",
            document: "DOC-1",
            name: "TITULAR SINTETICO",
            room: "205",
            arrival: "11/03/2026",
            departure: "14/03/2026"
        }),
        makeRecord({
            voucher: "SYN-MULTI",
            document: "DOC-2",
            name: "ACOMPANANTE SINTETICO",
            room: "101B",
            arrival: "12/03/2026",
            departure: "15/03/2026",
            roomObservation: "Ventanilla"
        }),
        makeRecord({
            voucher: "SYN-OTHER",
            document: "DOC-3",
            name: "OTRO TITULAR",
            room: "101A",
            arrival: "20/03/2026",
            departure: "22/03/2026",
            service: "PENSION COMPLETA"
        }),
        makeRecord({
            voucher: "",
            document: "DOC-4",
            name: "SIN VOUCHER",
            room: "307"
        })
    ]);

    await uploadCsv(dom, csv);
    const { document } = dom.window;
    const rows = tableRows(dom);

    assert.equal(document.querySelector("#results-section").hidden, false);
    assert.match(document.querySelector("#file-status").textContent, /4 pasajero\(s\)/);
    assert.equal(document.querySelector("#passenger-count").textContent, "4");
    assert.equal(document.querySelector("#room-count").textContent, "3");
    assert.equal(rows.length, 4);
    assert.deepEqual(rows.map(row => row[0]), ["101A", "101B", "205", "307"]);
    assert.equal(rows[0][6], "OTRO TITULAR");
    assert.equal(rows[1][6], "ACOMPANANTE SINTETICO");
    assert.equal(rows[1][13], "Ventanilla");
    assert.equal(rows[2][6], "TITULAR SINTETICO");
    assert.equal(rows[3][6], "SIN VOUCHER");
    assert.equal(document.querySelectorAll("#reservation-rows tr:first-child td").length, 14);
    assert.deepEqual(
        [...document.querySelectorAll(".table-scroll thead th")].map(cell => cell.textContent),
        [
            "Nro. habitación", "Fecha de ingreso", "Fecha de egreso",
            "Cantidad plazas", "Tipo documento", "Nro. doc.",
            "Apellido y nombre", "Edad", "Voucher", "Servicio",
            "Estado", "Paquete", "Sede", "Observación habitación"
        ]
    );

    dom.window.close();
});

test("reservations screen follows the simple historical upload, list, and export flow", () => {
    const dom = createApp();
    const { document } = dom.window;

    for (const selector of [
        "#arrival-date",
        "#process-button",
        "#rooming-map-button",
        "#rooming-pc-button",
        "#print-button",
        "#related-dni-input",
        "#passenger-duplicates-section",
        "#non-relatable-section",
        "#classification-status"
    ]) {
        assert.equal(document.querySelector(selector), null, `${selector} should not be in the screen`);
    }

    assert.ok(document.querySelector("#drop-area"));
    assert.ok(document.querySelector("#download-button"));
    const headersInHtml = [...document.querySelectorAll("thead th")].map(cell => cell.textContent);
    assert.ok(!headersInHtml.includes("Hotel"));
    assert.ok(!headersInHtml.includes("Clasificación"));
    assert.ok(!headersInHtml.includes("Señales"));
    dom.window.close();
});

test("CSV can also be loaded by dropping it on the historical upload area", async () => {
    const dom = createApp();
    const csv = makeCsv([
        makeRecord({ room: "12", name: "PASAJERO POR ARRASTRE" })
    ]);
    const drop = new dom.window.Event("drop", { bubbles: true, cancelable: true });
    Object.defineProperty(drop, "dataTransfer", {
        value: {
            files: [{
                name: "arrastrado.csv",
                size: Buffer.byteLength(csv),
                text: () => Promise.resolve(csv)
            }]
        }
    });
    dom.window.document.querySelector("#drop-area").dispatchEvent(drop);
    await waitUntil(
        () => dom.window.document.querySelector("#results-section").hidden === false,
        "Dropped CSV did not produce a result"
    );

    assert.equal(tableRows(dom).length, 1);
    assert.equal(tableRows(dom)[0][6], "PASAJERO POR ARRASTRE");
    dom.window.close();
});

test("CSV export uses historical columns, room sorting, LibreOffice delimiter, and escaped values", async () => {
    const dom = createApp();
    await uploadCsv(dom, makeCsv([
        makeRecord({
            room: "20",
            name: 'TITULAR "TEST"',
            roomObservation: "ventana; revisar",
            service: "SERVICIO; ESPECIAL"
        }),
        makeRecord({ room: "3", voucher: "SYN-3", name: "PRIMERO POR HABITACION" })
    ]));

    dom.window.document.querySelector("#download-button").click();
    assert.equal(dom.window.__openedLinks.length, 1);
    assert.equal(dom.window.__openedLinks[0].download, "reservas_ingresan.csv");
    const blob = dom.window.__createdBlobs.get(dom.window.__openedLinks[0].href);
    const bytes = await readBlobBytes(dom, blob);
    const csv = await readBlobText(dom, blob);

    assert.deepEqual([...bytes.slice(0, 3)], [0xef, 0xbb, 0xbf]);
    assert.match(csv, /^Nro\. habitación;Fecha de ingreso;Fecha de egreso;Cantidad plazas/);
    assert.ok(csv.indexOf("PRIMERO POR HABITACION") < csv.indexOf('"TITULAR ""TEST"""'));
    assert.ok(csv.includes('"ventana; revisar"'));
    assert.ok(csv.includes('"TITULAR ""TEST"""'));
    assert.ok(csv.includes('"SERVICIO; ESPECIAL"'));
    dom.window.close();
});

test("CSV warnings remain visible while valid records are displayed", async () => {
    const dom = createApp();
    const validRecord = makeRecord({ voucher: "SYN-VALID", name: "VALIDO" });
    const malformedRecord = makeRecord({ voucher: "SYN-BAD" }).slice(0, 27);
    await uploadCsv(dom, makeCsv([validRecord, malformedRecord]));

    assert.match(dom.window.document.querySelector("#file-warnings").textContent, /cantidad de columnas distinta de 28/);
    assert.equal(tableRows(dom).length, 1);
    assert.equal(tableRows(dom)[0][6], "VALIDO");
    dom.window.close();
});

test("empty CSV displays an empty result instead of leaving the processing flow unfinished", async () => {
    const dom = createApp();
    await uploadCsv(dom, makeCsv([]));

    assert.equal(dom.window.document.querySelector("#results-section").hidden, false);
    assert.equal(dom.window.document.querySelector("#empty-message").hidden, false);
    assert.equal(tableRows(dom).length, 0);
    assert.match(dom.window.document.querySelector("#file-warnings").textContent, /no encontró filas válidas/);
    dom.window.close();
});

test("non-CSV selection reports an error and resets the displayed results", async () => {
    const dom = createApp();
    await uploadCsv(dom, makeCsv([makeRecord()]));
    const input = dom.window.document.querySelector("#csv-input");
    Object.defineProperty(input, "files", {
        configurable: true,
        value: [{ name: "reservas.txt", size: 0, text: () => Promise.resolve("") }]
    });
    input.dispatchEvent(new dom.window.Event("change", { bubbles: true }));

    assert.equal(dom.window.document.querySelector("#file-status").textContent, "Selecciona un archivo con extensión .csv.");
    assert.equal(dom.window.document.querySelector("#results-section").hidden, true);
    dom.window.close();
});
