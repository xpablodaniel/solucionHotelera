const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { JSDOM } = require("jsdom");

const root = path.resolve(__dirname, "../..");
const htmlSource = fs.readFileSync(
    path.join(root, "client/groupMealVouchers.html"),
    "utf8"
);
const bundleSource = fs.readFileSync(
    path.join(root, "client/js/group-meal-vouchers-core.js"),
    "utf8"
);
const controllerSource = fs.readFileSync(
    path.join(root, "client/js/group-meal-vouchers.js"),
    "utf8"
);

const headers = [
    "Cód. Alojamiento", "Descripción", "Nro. habitación", "Tipo habitación",
    "Observación habitación", "Cantidad plazas", "Voucher", "Sede",
    "Fecha de ingreso", "Fecha de egreso", "Plazas ocupadas", "Tipo documento",
    "Nro. doc.", "Apellido y nombre", "Edad", "Entidad", "Servicios", "Paquete",
    "Transporte", "Fecha viaje", "Hora viaje", "Parada", "Email", "Estado",
    "Fecha de nacimiento", "Teléfono", "Celular", "Usuario"
];

function makeRecord(overrides = {}) {
    const sequence = overrides.sequence ?? 1;
    const values = Array(28).fill("");
    const fields = {
        accommodationCode: "900",
        hotel: "HOTEL 23 DE MAYO",
        room: "101",
        roomType: "DOBLE MATRIMONIAL",
        capacity: "2",
        voucher: `SYN-${sequence}`,
        office: "SECCIONAL SINTETICA",
        arrival: "11/03/2026",
        departure: "14/03/2026",
        occupied: "1",
        documentType: "DNI",
        document: `TEST-DOC-${sequence}`,
        name: `PASAJERO-SINTETICO-${sequence}`,
        age: "40",
        entity: "SUTEBA",
        service: "MEDIA PENSION",
        package: "MDP TEMPORADA BAJA",
        transport: "Sin Transporte",
        paymentStatus: "O",
        ...overrides
    };

    values[0] = fields.accommodationCode;
    values[1] = fields.hotel;
    values[2] = fields.room;
    values[3] = fields.roomType;
    values[5] = fields.capacity;
    values[6] = fields.voucher;
    values[7] = fields.office;
    values[8] = fields.arrival;
    values[9] = fields.departure;
    values[10] = fields.occupied;
    values[11] = fields.documentType;
    values[12] = fields.document;
    values[13] = fields.name;
    values[14] = fields.age;
    values[15] = fields.entity;
    values[16] = fields.service;
    values[17] = fields.package;
    values[18] = fields.transport;
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
        url: "http://localhost/client/groupMealVouchers.html"
    });
    const windowSetTimeout = dom.window.setTimeout.bind(dom.window);
    Object.defineProperty(dom.window, "setTimeout", {
        configurable: true,
        value: (callback, delay, ...args) => delay === 60000
            ? 0
            : windowSetTimeout(callback, delay, ...args)
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
    dom.window.__createdBlobs = createdBlobs;
    dom.window.__openedLinks = openedLinks;
    dom.window.HTMLAnchorElement.prototype.click = function () {
        openedLinks.push({
            href: this.href,
            download: this.download,
            target: this.target,
            rel: this.rel
        });
    };
    dom.window.eval(bundleSource);
    dom.window.eval(controllerSource);
    assert.ok(dom.window.GroupMealVouchersCore);
    return dom;
}

async function uploadCsv(dom, csv) {
    const input = dom.window.document.querySelector("#csv-input");
    Object.defineProperty(input, "files", {
        configurable: true,
        value: [{
            name: "synthetic.csv",
            size: Buffer.byteLength(csv),
            text: () => Promise.resolve(csv)
        }]
    });
    input.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
    for (let attempt = 0; attempt < 50; attempt++) {
        if (dom.window.document.querySelector("#file-status").textContent.startsWith("Archivo cargado:")) {
            return;
        }
        await new Promise(resolve => setTimeout(resolve, 0));
    }
    assert.fail(dom.window.document.querySelector("#file-status").textContent);
}

function selectDate(dom, value = "11/03/2026") {
    const { document } = dom.window;
    const select = document.querySelector("#arrival-date");
    select.value = value;
    select.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
    document.querySelector("#process-button").click();
    assert.equal(document.querySelector("#results-section").hidden, false);
}

async function readBlobText(dom, blob) {
    return blob.text();
}

test("group vouchers preserve MAP/PC print output and date filtering", async () => {
    const dom = createApp();
    const csv = makeCsv([
        makeRecord({
            sequence: 1,
            voucher: "OUTPUT-MAP",
            name: "MAP-PRIMER-PAX",
            service: "MEDIA PENSION"
        }),
        makeRecord({
            sequence: 2,
            voucher: "OUTPUT-MAP",
            name: "MAP-SEGUNDO-PAX",
            service: "MEDIA PENSION",
            room: "102"
        }),
        makeRecord({
            sequence: 3,
            voucher: "OUTPUT-PC",
            service: "PENSION COMPLETA",
            name: "PC-PAX",
            package: "PPJ"
        }),
        makeRecord({
            sequence: 4,
            voucher: "OUTPUT-BREAKFAST",
            service: "DESAYUNO",
            name: "NO-DEBE-SALIR"
        })
    ]);

    await uploadCsv(dom, csv);
    selectDate(dom);
    dom.window.document.querySelector("#voucher-map-button").click();

    assert.equal(dom.window.__openedLinks.length, 1);
    const mapLink = dom.window.__openedLinks[0];
    assert.equal(mapLink.target, "_blank");
    assert.equal(mapLink.rel, "noopener");
    const mapHtml = await readBlobText(
        dom,
        dom.window.__createdBlobs.get(mapLink.href)
    );
    assert.match(mapHtml, /Voucher de Comidas/);
    assert.match(mapHtml, /MAP-PRIMER-PAX/);
    assert.doesNotMatch(mapHtml, /MAP-SEGUNDO-PAX|PC-PAX|NO-DEBE-SALIR/);
    assert.match(mapHtml, /Cant\. Pax:<\/strong> 2/);
    assert.match(mapHtml, /<base href="http:\/\/localhost\/client\/groupMealVouchers\.html">/);
    assert.equal(
        dom.window.document.querySelector("#output-status").textContent.trim(),
        "Vista imprimible de Voucher MAP abierta: 1 voucher."
    );

    dom.window.document.querySelector("#voucher-pc-button").click();
    assert.equal(dom.window.__openedLinks.length, 2);
    const pcHtml = await readBlobText(
        dom,
        dom.window.__createdBlobs.get(dom.window.__openedLinks[1].href)
    );
    assert.match(pcHtml, /Voucher de Comidas PPJ/);
    assert.match(pcHtml, /PC-PAX/);
    assert.doesNotMatch(pcHtml, /MAP-PRIMER-PAX|NO-DEBE-SALIR/);
    assert.equal(
        dom.window.document.querySelector("#output-status").textContent.trim(),
        "Vista imprimible de Voucher PC abierta: 1 voucher."
    );
    dom.window.close();
});

test("group voucher page reports empty outputs and vouchers requiring review", async () => {
    const dom = createApp();
    const csv = makeCsv([
        makeRecord({
            sequence: 1,
            voucher: "REVIEW-MAP",
            arrival: "11/03/2026",
            departure: "14/03/2026",
            name: "REVIEW-PRIMER-PAX"
        }),
        makeRecord({
            sequence: 2,
            voucher: "REVIEW-MAP",
            arrival: "12/03/2026",
            departure: "14/03/2026",
            name: "REVIEW-SEGUNDO-PAX"
        }),
        makeRecord({
            sequence: 3,
            voucher: "ONLY-PC",
            service: "PENSION COMPLETA",
            package: "PPJ"
        })
    ]);

    await uploadCsv(dom, csv);
    selectDate(dom);
    dom.window.document.querySelector("#voucher-map-button").click();
    assert.equal(dom.window.__openedLinks.length, 0);
    assert.match(
        dom.window.document.querySelector("#output-status").textContent,
        /No hay vouchers MAP para generar en esta fecha/
    );
    assert.match(
        [...dom.window.document.querySelectorAll("#output-status p")]
            .map(paragraph => paragraph.textContent)
            .join(" "),
        /1 voucher requiere revisión: Voucher REVIEW-MAP: períodos de ingreso\/egreso diferentes entre pasajeros\./
    );

    dom.window.document.querySelector("#voucher-pc-button").click();
    assert.equal(dom.window.__openedLinks.length, 1);
    assert.match(
        dom.window.document.querySelector("#output-status").textContent,
        /Vista imprimible de Voucher PC abierta: 1 voucher/
    );
    dom.window.close();
});

test("home navigation puts group vouchers at 02 and Balneario at 05", () => {
    const home = fs.readFileSync(path.join(root, "index.html"), "utf8");
    const groupLink = home.indexOf('href="client/groupMealVouchers.html"');
    const reservationsLink = home.indexOf('href="client/reservations.html"');
    const fichaLink = home.indexOf('href="client/fichaPax.html"');
    const balnearioLink = home.indexOf('href="client/balnearioVoucher.html"');

    assert.ok(groupLink >= 0 && groupLink < reservationsLink);
    assert.ok(reservationsLink < fichaLink && fichaLink < balnearioLink);
    assert.match(home.slice(groupLink, reservationsLink), /02 \/ COMIDAS GRUPALES/);
    assert.match(home.slice(balnearioLink), /05 \/ BALNEARIO/);
});
