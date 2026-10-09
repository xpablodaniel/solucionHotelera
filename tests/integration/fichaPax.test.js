const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { JSDOM } = require("jsdom");

const root = path.resolve(__dirname, "../..");
const htmlSource = fs.readFileSync(
    path.join(root, "client/fichaPax.html"),
    "utf8"
);
const bundleSource = fs.readFileSync(
    path.join(root, "client/js/ficha-pax-core.js"),
    "utf8"
);
const controllerSource = fs.readFileSync(
    path.join(root, "client/js/ficha-pax.js"),
    "utf8"
);
const homeSource = fs.readFileSync(
    path.join(root, "index.html"),
    "utf8"
);

const headers = [
    "Cód. Alojamiento", "Descripción", "Nro. habitación",
    "Tipo habitación", "Observación habitación", "Cantidad plazas",
    "Voucher", "Sede", "Fecha de ingreso", "Fecha de egreso",
    "Plazas ocupadas", "Tipo documento", "Nro. doc.",
    "Apellido y nombre", "Edad", "Entidad", "Servicios", "Paquete",
    "Transporte", "Fecha viaje", "Hora viaje", "Parada", "Email",
    "Estado", "Fecha de nacimiento", "Teléfono", "Celular", "Usuario"
];


function makeRecord(index, overrides = {}) {

    const values = Array(28).fill("");
    const fields = {
        accommodation: "900",
        hotel: "HOTEL 23 DE MAYO",
        room: "101",
        roomType: "DOBLE MATRIMONIAL",
        capacity: "2",
        voucher: "FICHA-001",
        office: "39 - CHIVILCOY",
        arrival: "11/03/2026",
        departure: "14/03/2026",
        occupied: "2",
        documentType: "DNI",
        document: `1000000${index}`,
        name: `PASAJERO ${index}`,
        age: String(30 + index),
        package: "",
        service: "MEDIA PENSION",
        email: `pax${index}@example.test`,
        birthDate: `01/01/19${80 + index}`,
        phone: `11123456${index}`,
        mobile: `11987654${index}`,
        ...overrides
    };

    values[0] = fields.accommodation;
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
    values[16] = fields.service;
    values[17] = fields.package;
    values[22] = fields.email;
    values[23] = "O";
    values[24] = fields.birthDate;
    values[25] = fields.phone;
    values[26] = fields.mobile;

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
        url: "http://localhost/client/fichaPax.html"
    });

    dom.window.HTMLElement.prototype.scrollIntoView = function () {};
    const pdfTrace = {
        fetchUrls: [],
        pages: [],
        openedLinks: []
    };
    dom.window.fetch = async url => {
        pdfTrace.fetchUrls.push(url);
        return {
            ok: true,
            arrayBuffer: () => Promise.resolve(
                new Uint8Array([1, 2, 3]).buffer
            )
        };
    };
    dom.window.PDFLib = {
        StandardFonts: {
            Helvetica: "Helvetica",
            HelveticaBold: "HelveticaBold"
        },
        PDFDocument: {
            load: async () => ({
                getPages: () => [{ getHeight: () => 841.918 }]
            }),
            create: async () => ({
                embedFont: async () => ({
                    widthOfTextAtSize: (text, size) => text.length * size * 0.5
                }),
                copyPages: async (_template, indexes) => indexes.map(() => {
                    const page = {
                        text: [],
                        getHeight: () => 841.918,
                        drawText(text, options) {
                            page.text.push({ text, options });
                        }
                    };
                    pdfTrace.pages.push(page);
                    return page;
                }),
                addPage() {},
                save: async () => new Uint8Array([37, 80, 68, 70])
            })
        }
    };
    let nextObjectUrl = 0;
    Object.defineProperty(dom.window.URL, "createObjectURL", {
        configurable: true,
        value: () => `blob:http://localhost/${++nextObjectUrl}`
    });
    Object.defineProperty(dom.window.URL, "revokeObjectURL", {
        configurable: true,
        value: () => {}
    });
    dom.window.HTMLAnchorElement.prototype.click = function () {
        pdfTrace.openedLinks.push({
            href: this.href,
            download: this.download
        });
    };
    dom.window.__pdfTrace = pdfTrace;
    dom.window.eval(bundleSource);
    dom.window.eval(controllerSource);

    assert.ok(dom.window.FichaPaxCore);
    return dom;
}


async function uploadCsv(dom, csv, name = "reservas.csv") {

    const input = dom.window.document.querySelector("#csv-input");
    Object.defineProperty(input, "files", {
        configurable: true,
        value: [{
            name,
            text: () => Promise.resolve(csv)
        }]
    });
    input.dispatchEvent(new dom.window.Event("change", { bubbles: true }));

    await new Promise(resolve => setTimeout(resolve, 0));
}


function search(dom, query) {

    const input = dom.window.document.querySelector("#search-input");
    input.value = query;
    input.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
}


test("home page links to the independent Ficha PAX module", () => {

    const dom = new JSDOM(homeSource);
    const link = dom.window.document.querySelector(
        'a[href="client/fichaPax.html"]'
    );

    assert.ok(link);
    assert.equal(link.querySelector("h2").textContent, "Ficha PAX");
});


test("loads a valid CSV and finds a voucher through a non-titular passenger", async () => {

    const dom = createApp();

    try {
        await uploadCsv(dom, makeCsv([
            makeRecord(1, { name: "TITULAR" }),
            makeRecord(2, { name: "ACOMPANANTE BUSCADO" })
        ]));

        assert.equal(
            dom.window.document.querySelector("#search-section").hidden,
            false
        );
        assert.match(
            dom.window.document.querySelector("#search-status").textContent,
            /Escribe un voucher/
        );

        search(dom, "acompanante buscado");

        assert.match(
            dom.window.document.querySelector("#search-status").textContent,
            /1 voucher/
        );
        assert.equal(
            dom.window.document.querySelectorAll(".ficha-result").length,
            1
        );
    } finally {
        dom.window.close();
    }
});


test("previews all pages with repeated holder and voucher details", async () => {

    const dom = createApp();
    const passengers = Array.from({ length: 8 }, (_, index) =>
        makeRecord(index + 1, {
            name: index === 0 ? "TITULAR PRIMERO" : `ACOMPANANTE ${index}`,
            age: index === 1 ? "99" : String(30 + index)
        })
    );

    try {
        await uploadCsv(dom, makeCsv(passengers));
        search(dom, "FICHA-001");
        dom.window.document.querySelector(".ficha-result button").click();

        const pages = [...dom.window.document.querySelectorAll(".ficha-page")];
        assert.equal(pages.length, 3);
        assert.ok(pages.every(page => page.textContent.includes("TITULAR PRIMERO")));
        assert.ok(pages.every(page => page.textContent.includes("FICHA-001")));
        assert.deepEqual(
            pages.map(page => page.querySelectorAll(".ficha-companion").length),
            [3, 3, 1]
        );
        assert.ok(pages[0].textContent.includes("39 - CHIVILCOY"));
        assert.ok(pages[0].textContent.includes("HOTEL 23 DE MAYO"));
        assert.ok(pages[0].textContent.includes("11/03/2026"));
        assert.ok(pages[0].textContent.includes("MEDIA PENSION"));
        assert.equal(
            dom.window.document.querySelector("#preview-section").hidden,
            false
        );
    } finally {
        dom.window.close();
    }
});

test("downloads official-template PDFs for every preview page", async () => {

    const dom = createApp();
    const passengers = Array.from({ length: 8 }, (_, index) =>
        makeRecord(index + 1, {
            name: index === 0 ? "TITULAR PRIMERO" : `ACOMPANANTE ${index}`,
            service: "MEDIA PENSION"
        })
    );

    try {
        await uploadCsv(dom, makeCsv(passengers));
        search(dom, "FICHA-001");
        dom.window.document.querySelector(".ficha-result button").click();

        dom.window.document.querySelector("#download-pdf").click();
        for (let attempt = 0; attempt < 50; attempt++) {
            const status = dom.window.document.querySelector("#pdf-status").textContent;
            if (status.startsWith("Ficha PDF generada:")) {
                break;
            }
            await new Promise(resolve => setTimeout(resolve, 0));
        }

        const trace = dom.window.__pdfTrace;
        assert.deepEqual(
            trace.fetchUrls,
            ["../assets/templates/1fichaPax.pdf"]
        );
        assert.equal(trace.pages.length, 3);
        assert.deepEqual(
            trace.pages.map(page => page.text
                .filter(item => item.text.startsWith("ACOMPANANTE "))
                .length),
            [3, 3, 1]
        );
        assert.ok(trace.pages.every(page =>
            page.text.some(item => item.text === "TITULAR PRIMERO") &&
            page.text.some(item => item.text === "FICHA-001")
        ));
        assert.ok(trace.pages[0].text.some(item =>
            item.text === "X" && Math.round(item.options.x) === Math.round(113 * 72 / 25.4)
        ));
        assert.deepEqual(trace.openedLinks.map(link => link.download), [
            "ficha_pax_FICHA-001.pdf"
        ]);
        assert.match(
            dom.window.document.querySelector("#pdf-status").textContent,
            /Ficha PDF generada/
        );
    } finally {
        dom.window.close();
    }
});

test("reports a missing official PDF template without starting a download", async () => {

    const dom = createApp();

    try {
        await uploadCsv(dom, makeCsv([makeRecord(1)]));
        search(dom, "FICHA-001");
        dom.window.document.querySelector(".ficha-result button").click();
        dom.window.fetch = async () => ({
            ok: false,
            arrayBuffer: () => Promise.resolve(new ArrayBuffer(0))
        });

        dom.window.document.querySelector("#download-pdf").click();
        for (let attempt = 0; attempt < 50; attempt++) {
            const status = dom.window.document.querySelector("#pdf-status").textContent;
            if (status.startsWith("No se pudo generar")) {
                break;
            }
            await new Promise(resolve => setTimeout(resolve, 0));
        }

        assert.match(
            dom.window.document.querySelector("#pdf-status").textContent,
            /No se pudo cargar la plantilla PDF oficial/
        );
        assert.deepEqual(dom.window.__pdfTrace.openedLinks, []);
    } finally {
        dom.window.close();
    }
});

test("does not offer PDF generation for contingent reservations", async () => {

    const dom = createApp();

    try {
        await uploadCsv(dom, makeCsv([
            makeRecord(1, {
                service: "PENSION COMPLETA",
                package: "PPJ"
            })
        ]));
        search(dom, "FICHA-001");
        dom.window.document.querySelector(".ficha-result button").click();

        const downloadButton = dom.window.document.querySelector("#download-pdf");
        assert.equal(downloadButton.disabled, true);
        assert.match(
            dom.window.document.querySelector("#pdf-status").textContent,
            /No se genera ficha PAX para reservas de contingentes/
        );
        assert.deepEqual(dom.window.__pdfTrace.fetchUrls, []);
    } finally {
        dom.window.close();
    }
});


test("renders CSV values as text instead of interpreting markup", async () => {

    const dom = createApp();

    try {
        await uploadCsv(dom, makeCsv([
            makeRecord(1, { name: "<img src=x onerror=alert(1)>" })
        ]));
        search(dom, "FICHA-001");
        dom.window.document.querySelector(".ficha-result button").click();

        assert.equal(
            dom.window.document.querySelector(".ficha-page img"),
            null
        );
        assert.ok(
            dom.window.document.querySelector(".ficha-page").textContent
                .includes("<img src=x onerror=alert(1)>")
        );
    } finally {
        dom.window.close();
    }
});


test("reports invalid extensions and malformed CSV headers explicitly", async () => {

    const dom = createApp();

    try {
        await uploadCsv(dom, makeCsv([makeRecord(1)]), "reservas.txt");
        assert.match(
            dom.window.document.querySelector("#file-status").textContent,
            /extensión \.csv/
        );

        await uploadCsv(dom, "voucher,nombre", "reservas.csv");
        assert.match(
            dom.window.document.querySelector("#file-status").textContent,
            /encabezado tiene 2 columnas/
        );
        assert.equal(
            dom.window.document.querySelector("#search-section").hidden,
            true
        );
    } finally {
        dom.window.close();
    }
});
