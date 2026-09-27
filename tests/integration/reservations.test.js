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
        url: "http://localhost/client/reservations.html"
    });

    dom.window.eval(bundleSource);
    dom.window.eval(controllerSource);
    assert.ok(dom.window.ReservationsCore, "browser bundle must expose the existing parser and business API");
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

function processDate(dom, date) {
    const { document } = dom.window;
    const select = document.querySelector("#arrival-date");

    if ([...select.options].some(option => option.value === date)) {
        select.value = date;
        select.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
    } else {
        select.value = "__custom_date__";
        select.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
        document.querySelector("#manual-arrival-date").value = date.split("/").reverse().join("-");
        document.querySelector("#manual-arrival-date").dispatchEvent(new dom.window.Event("change", { bubbles: true }));
    }

    document.querySelector("#process-button").click();
    assert.equal(document.querySelector("#results-section").hidden, false, "results should be visible after processing");
}

function readSummary(dom) {
    const text = selector => dom.window.document.querySelector(selector).textContent;
    return {
        passengers: Number(text("#passenger-count")),
        reservations: Number(text("#reservation-count")),
        rooms: Number(text("#room-count")),
        mapPassengers: Number(text("#map-passenger-count")),
        mapReservations: Number(text("#map-reservation-count")),
        pcPassengers: Number(text("#pc-passenger-count")),
        pcReservations: Number(text("#pc-reservation-count"))
    };
}

function tableRows(dom) {
    return [...dom.window.document.querySelectorAll("#reservation-rows tr")]
        .map(row => [...row.cells].map(cell => cell.textContent.trim()));
}

function textOf(dom, selector) {
    return dom.window.document.querySelector(selector).textContent;
}

function closeApp(dom) {
    dom.window.close();
}

test("1. individual MAP reservation counts both passengers and one voucher", async () => {
    const dom = createApp();
    const csv = makeCsv([
        makeRecord({ sequence: 1, voucher: "MAP-1", name: "SINTETICO-UNO" }),
        makeRecord({ sequence: 2, voucher: "MAP-1", name: "SINTETICO-DOS", room: "102" })
    ]);
    await uploadCsv(dom, csv);
    processDate(dom, "11/03/2026");

    assert.deepEqual(readSummary(dom), {
        passengers: 2, reservations: 1, rooms: 2,
        mapPassengers: 2, mapReservations: 1,
        pcPassengers: 0, pcReservations: 0
    });
    assert.equal(tableRows(dom)[0][1], "SINTETICO-UNO");
    closeApp(dom);
});

test("2. individual MAP reservation with two passengers in one room counts one physical room", async () => {
    const dom = createApp();
    const csv = makeCsv([
        makeRecord({ sequence: 1, voucher: "MAP-SAME-ROOM", name: "SINTETICO-UNO", room: "101" }),
        makeRecord({ sequence: 2, voucher: "MAP-SAME-ROOM", name: "SINTETICO-DOS", room: "101" })
    ]);

    await uploadCsv(dom, csv);
    processDate(dom, "11/03/2026");

    assert.deepEqual(readSummary(dom), {
        passengers: 2, reservations: 1, rooms: 1,
        mapPassengers: 2, mapReservations: 1,
        pcPassengers: 0, pcReservations: 0
    });
    assert.equal(tableRows(dom)[0][1], "SINTETICO-UNO");
    assert.equal(tableRows(dom)[0][3], "101");
    assert.equal(tableRows(dom)[0][4], "2");
    closeApp(dom);
});

test("3. full-board group uses the existing engine classification", async () => {
    const dom = createApp();
    const records = [1, 2, 3].map(sequence => makeRecord({
        sequence,
        voucher: "PC-1",
        service: "PENSIÓN COMPLETA",
        package: "PPJ MAR DEL PLATA",
        transport: "PPJ BUS SINTETICO"
    }));
    const csv = makeCsv(records);
    await uploadCsv(dom, csv);
    processDate(dom, "11/03/2026");

    assert.equal(readSummary(dom).pcPassengers, 3);
    assert.equal(readSummary(dom).pcReservations, 1);
    assert.match(tableRows(dom)[0][6], /CONTINGENTE/);
    assert.equal(tableRows(dom)[0][5], "PENSIÓN COMPLETA");
    closeApp(dom);
});

test("4. DESAYUNO remains observed service and is not counted as MAP", async () => {
    const dom = createApp();
    const csv = makeCsv([1, 2].map(sequence => makeRecord({
        sequence, voucher: "BREAKFAST-1", service: "DESAYUNO"
    })));
    await uploadCsv(dom, csv);
    processDate(dom, "11/03/2026");

    assert.equal(readSummary(dom).mapPassengers, 0);
    assert.equal(readSummary(dom).pcPassengers, 0);
    assert.equal(tableRows(dom)[0][5], "DESAYUNO");
    closeApp(dom);
});

test("5. DESAYUNO U.PROPIAS remains unchanged and is not counted as MAP", async () => {
    const dom = createApp();
    const csv = makeCsv([makeRecord({ service: "DESAYUNO U.PROPIAS" })]);
    await uploadCsv(dom, csv);
    processDate(dom, "11/03/2026");

    assert.equal(readSummary(dom).mapPassengers, 0);
    assert.equal(tableRows(dom)[0][5], "DESAYUNO U.PROPIAS");
    closeApp(dom);
});

test("6. empty service displays operational breakfast without MAP/PC and warns about origin", async () => {
    const dom = createApp();
    const csv = makeCsv([1, 2].map(sequence => makeRecord({
        sequence, voucher: "EMPTY-SERVICE", service: ""
    })));
    await uploadCsv(dom, csv);
    processDate(dom, "11/03/2026");

    assert.equal(readSummary(dom).mapPassengers, 0);
    assert.equal(readSummary(dom).pcPassengers, 0);
    assert.equal(tableRows(dom)[0][5], "Desayuno · servicio no informado en origen");
    assert.match(textOf(dom, "#result-warnings"), /no tienen servicio informado/);
    closeApp(dom);
});

test("7. passenger without voucher stays visible and is not assigned an invented voucher", async () => {
    const dom = createApp();
    const csv = makeCsv([makeRecord({ voucher: "", name: "SIN-VOUCHER" })]);
    await uploadCsv(dom, csv);
    processDate(dom, "11/03/2026");

    assert.equal(readSummary(dom).passengers, 1);
    assert.equal(readSummary(dom).reservations, 0);
    assert.equal(tableRows(dom).length, 1);
    assert.equal(tableRows(dom)[0][0], "Sin voucher");
    assert.match(textOf(dom, "#result-warnings"), /no tienen voucher/);
    closeApp(dom);
});

test("8. different services within one voucher stay separate and trigger warnings", async () => {
    const dom = createApp();
    const csv = makeCsv([
        makeRecord({ sequence: 1, voucher: "MIX-SERVICE", service: "PENSION COMPLETA", package: "PPJ", transport: "BUS" }),
        makeRecord({ sequence: 2, voucher: "MIX-SERVICE", service: "DESAYUNO" })
    ]);
    await uploadCsv(dom, csv);
    processDate(dom, "11/03/2026");

    const row = tableRows(dom)[0];
    assert.match(row[5], /PENSION COMPLETA/);
    assert.match(row[5], /DESAYUNO/);
    assert.match(row[6], /CONTINGENTE/);
    assert.match(textOf(dom, "#result-warnings"), /servicios distintos/);
    assert.match(row[6], /clasificaciones diferentes/);
    closeApp(dom);
});

test("9. different hotels within one voucher remain visible and trigger a warning", async () => {
    const dom = createApp();
    const csv = makeCsv([
        makeRecord({ sequence: 1, voucher: "MIX-HOTEL", room: "227", hotel: "HOTEL 23 DE MAYO" }),
        makeRecord({ sequence: 2, voucher: "MIX-HOTEL", room: "227", hotel: "HOTEL 31 DE AGOSTO" })
    ]);
    await uploadCsv(dom, csv);
    processDate(dom, "11/03/2026");

    assert.match(tableRows(dom)[0][2], /HOTEL 23 DE MAYO/);
    assert.match(tableRows(dom)[0][2], /HOTEL 31 DE AGOSTO/);
    assert.match(textOf(dom, "#result-warnings"), /hoteles distintos/);
    closeApp(dom);
});

test("10. mixed-date voucher shows only selected-date passengers and keeps first CSV PAX as holder", async () => {
    const dom = createApp();
    const csv = makeCsv([
        makeRecord({ sequence: 1, voucher: "MIX-DATE", arrival: "11/03/2026", room: "101", name: "PRIMER-PAX-CSV" }),
        makeRecord({ sequence: 2, voucher: "MIX-DATE", arrival: "12/03/2026", room: "102", name: "SEGUNDO-PAX-CSV" })
    ]);
    await uploadCsv(dom, csv);
    processDate(dom, "12/03/2026");

    assert.equal(readSummary(dom).passengers, 1);
    assert.equal(readSummary(dom).reservations, 1);
    assert.equal(tableRows(dom)[0][1], "PRIMER-PAX-CSV");
    assert.equal(tableRows(dom)[0][3], "102");
    assert.equal(tableRows(dom)[0][4], "1");
    assert.match(textOf(dom, "#result-warnings"), /más de una fecha/);
    closeApp(dom);
});

test("11. room assignment suffixes survive while physical room count is one", async () => {
    const dom = createApp();
    const csv = makeCsv([
        makeRecord({ sequence: 1, voucher: "ROOM-ASSIGN", room: "227 A" }),
        makeRecord({ sequence: 2, voucher: "ROOM-ASSIGN", room: "227 B" }),
        makeRecord({ sequence: 3, voucher: "ROOM-ASSIGN", room: "227" })
    ]);
    await uploadCsv(dom, csv);
    processDate(dom, "11/03/2026");

    assert.equal(readSummary(dom).rooms, 1);
    assert.equal(tableRows(dom)[0][3], "227 A, 227 B, 227");
    closeApp(dom);
});

test("12. same room number in two hotels counts as two physical rooms", async () => {
    const dom = createApp();
    const csv = makeCsv([
        makeRecord({ sequence: 1, voucher: "HOTEL-A", room: "227", hotel: "HOTEL 23 DE MAYO" }),
        makeRecord({ sequence: 2, voucher: "HOTEL-B", room: "227", hotel: "HOTEL 31 DE AGOSTO" })
    ]);
    await uploadCsv(dom, csv);
    processDate(dom, "11/03/2026");

    assert.equal(readSummary(dom).rooms, 2);
    closeApp(dom);
});

test("13. Hotel 31 de Agosto room values 5, 10, 27 and 28 remain ordinary CSV values", async () => {
    const dom = createApp();
    const csv = makeCsv([5, 10, 27, 28].map((room, index) => makeRecord({
        sequence: index + 1,
        voucher: `AGOSTO-${room}`,
        hotel: "HOTEL 31 DE AGOSTO",
        room: String(room),
        service: "DESAYUNO"
    })));
    await uploadCsv(dom, csv);
    processDate(dom, "11/03/2026");

    assert.equal(readSummary(dom).rooms, 4);
    assert.deepEqual(tableRows(dom).map(row => row[3]), ["5", "10", "27", "28"]);
    assert.equal(dom.window.document.querySelectorAll("#reservation-rows tr").length, 4);
    closeApp(dom);
});

test("14. manual date with no arrivals shows empty state without fake reservation rows", async () => {
    const dom = createApp();
    const csv = makeCsv([
        makeRecord({ sequence: 1, voucher: "DATE-A", arrival: "11/03/2026" }),
        makeRecord({ sequence: 2, voucher: "DATE-C", arrival: "13/03/2026" })
    ]);
    await uploadCsv(dom, csv);
    processDate(dom, "12/03/2026");

    assert.deepEqual(readSummary(dom), {
        passengers: 0, reservations: 0, rooms: 0,
        mapPassengers: 0, mapReservations: 0,
        pcPassengers: 0, pcReservations: 0
    });
    assert.equal(dom.window.document.querySelectorAll("#reservation-rows tr").length, 0);
    assert.equal(dom.window.document.querySelector("#no-arrivals-message").hidden, false);
    assert.match(textOf(dom, "#map-status"), /No hay ingresos MAP/);
    closeApp(dom);
});

test("15. selector detects three dates and each query shows only that date", async () => {
    const dom = createApp();
    const dates = ["11/03/2026", "12/03/2026", "13/03/2026"];
    const csv = makeCsv(dates.map((arrival, index) => makeRecord({
        sequence: index + 1, voucher: `DATE-${index + 1}`, arrival
    })));
    await uploadCsv(dom, csv);

    const options = [...dom.window.document.querySelectorAll("#arrival-date option")]
        .map(option => option.value)
        .filter(value => value && value !== "__custom_date__");
    assert.deepEqual(options, dates);

    for (const [index, date] of dates.entries()) {
        processDate(dom, date);
        assert.equal(readSummary(dom).passengers, 1);
        assert.equal(tableRows(dom)[0][0], `DATE-${index + 1}`);
    }
    closeApp(dom);
});

test("16. invalid 27- and 29-column rows are reported while valid rows survive", async () => {
    const shortRow = makeRecord({ sequence: 10 });
    const longRow = makeRecord({ sequence: 11 });
    shortRow.pop();
    longRow.push("EXTRA");
    const csv = makeCsv([
        makeRecord({ sequence: 1, voucher: "VALID-ROW" }),
        shortRow,
        longRow
    ]);
    const dom = createApp();
    await uploadCsv(dom, csv);

    assert.match(textOf(dom, "#file-warnings"), /2 fila\(s\).*distinta de 28/);
    assert.match(textOf(dom, "#file-status"), /1 pasajeros válidos/);
    processDate(dom, "11/03/2026");
    assert.equal(tableRows(dom).length, 1);
    assert.equal(tableRows(dom)[0][0], "VALID-ROW");
    closeApp(dom);
});

test("17. empty CSV and CSV without valid data rows produce clear messages", async () => {
    for (const csv of ["", makeCsv([makeRecord()]).split("\r\n")[0] + "\r\n" + makeRecord().slice(0, 27).join(",")]) {
        const dom = createApp();
        await uploadCsv(dom, csv);
        assert.equal(dom.window.document.querySelector("#date-empty-message").hidden, false);
        assert.match(textOf(dom, "#file-warnings"), /no encontró filas válidas/);
        processDate(dom, "11/03/2026");
        assert.equal(dom.window.document.querySelectorAll("#reservation-rows tr").length, 0);
        assert.equal(dom.window.document.querySelector("#no-arrivals-message").hidden, false);
        closeApp(dom);
    }
});

test("18. missing hotel is not inferred and is warned", async () => {
    const dom = createApp();
    const csv = makeCsv([makeRecord({ hotel: "" })]);
    await uploadCsv(dom, csv);
    processDate(dom, "11/03/2026");

    assert.equal(tableRows(dom)[0][2], "Sin dato");
    assert.equal(readSummary(dom).rooms, 0);
    assert.match(textOf(dom, "#result-warnings"), /sin hotel informado/);
    closeApp(dom);
});

test("19. missing room is not inferred and is warned", async () => {
    const dom = createApp();
    const csv = makeCsv([makeRecord({ room: "" })]);
    await uploadCsv(dom, csv);
    processDate(dom, "11/03/2026");

    assert.equal(tableRows(dom)[0][3], "Sin dato");
    assert.equal(readSummary(dom).rooms, 0);
    assert.match(textOf(dom, "#result-warnings"), /sin habitación informada/);
    closeApp(dom);
});

function seededRandom(seed) {
    let state = seed >>> 0;
    return () => {
        state += 0x6D2B79F5;
        let value = state;
        value = Math.imul(value ^ (value >>> 15), value | 1);
        value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
        return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
}

function makeStressCsv() {
    const random = seededRandom(0x5EED2026);
    const dates = ["11/03/2026", "12/03/2026", "13/03/2026"];
    const services = [
        "MEDIA PENSION", "MEDIA PENSION", "MEDIA PENSION", "MEDIA PENSION",
        "PENSIÓN COMPLETA", "PENSIÓN COMPLETA", "PENSIÓN COMPLETA", "PENSIÓN COMPLETA",
        "DESAYUNO", "DESAYUNO", "DESAYUNO",
        "DESAYUNO U.PROPIAS", "DESAYUNO U.PROPIAS", "DESAYUNO U.PROPIAS",
        "", "", "", "SERVICIO ESPECIAL", "SERVICIO ESPECIAL", "SERVICIO ESPECIAL"
    ];
    const records = [];

    for (let index = 0; index < 20; index++) {
        const isAugustHotel = random() < 0.5;
        const hotel = isAugustHotel ? "HOTEL 31 DE AGOSTO" : "HOTEL 23 DE MAYO";
        const room = String((isAugustHotel ? 5 : 101) + index);
        let transport = "Sin Transporte";
        let packageName = "MDP TEMPORADA BAJA";
        if (index >= 4 && index <= 7) {
            transport = "PPJ BUS SINTETICO";
            packageName = "PPJ MAR DEL PLATA";
        }
        if ([15, 18, 19].includes(index)) {
            transport = "";
            packageName = "";
        }

        for (let paxIndex = 0; paxIndex < 2; paxIndex++) {
            let service = services[index];
            if (index === 13 && paxIndex === 1) service = "DESAYUNO";
            records.push(makeRecord({
                sequence: index * 2 + paxIndex + 1,
                voucher: `STRESS-${String(index + 1).padStart(2, "0")}`,
                arrival: dates[index % dates.length],
                hotel,
                room,
                service,
                transport,
                package: packageName
            }));
        }
    }

    records.push(makeRecord({
        sequence: 41,
        voucher: "",
        arrival: dates[1],
        hotel: "HOTEL 23 DE MAYO",
        room: "130",
        service: "DESAYUNO"
    }));
    records.push(makeRecord({
        sequence: 42,
        voucher: "",
        arrival: dates[2],
        hotel: "HOTEL 31 DE AGOSTO",
        room: "28",
        service: ""
    }));

    return { csv: makeCsv(records), dates };
}

test("20. seeded 42-PAX mixed CSV has reproducible and manually auditable totals", async () => {
    const dom = createApp();
    const { csv, dates } = makeStressCsv();
    const originalCsv = csv;
    await uploadCsv(dom, csv, "stress-seeded.csv");

    const expectedByDate = {
        "11/03/2026": { passengers: 14, reservations: 7, rooms: 7, mapPassengers: 4, mapReservations: 2, pcPassengers: 2, pcReservations: 1 },
        "12/03/2026": { passengers: 15, reservations: 7, rooms: 8, mapPassengers: 2, mapReservations: 1, pcPassengers: 4, pcReservations: 2 },
        "13/03/2026": { passengers: 13, reservations: 6, rooms: 7, mapPassengers: 2, mapReservations: 1, pcPassengers: 2, pcReservations: 1 }
    };

    const allClassifications = {
        INDIVIDUAL: 0,
        CONTINGENTE: 0,
        NO_CLASIFICADA: 0
    };

    for (const date of dates) {
        processDate(dom, date);
        assert.deepEqual(readSummary(dom), expectedByDate[date], date);
        const status = textOf(dom, "#classification-status");
        const counts = status.match(/(\d+) individuales · (\d+) contingentes · (\d+) no clasificadas/);
        assert.ok(counts, status);
        allClassifications.INDIVIDUAL += Number(counts[1]);
        allClassifications.CONTINGENTE += Number(counts[2]);
        allClassifications.NO_CLASIFICADA += Number(counts[3]);
    }

    processDate(dom, "11/03/2026");
    const firstRow = tableRows(dom).find(row => row[0] === "STRESS-01");
    assert.ok(firstRow, "first stress voucher should appear on its generated arrival date");
    assert.equal(firstRow[1], "PASAJERO-SINTETICO-1");

    processDate(dom, "12/03/2026");
    assert.equal(csv, originalCsv, "source CSV string must remain unchanged");
    assert.equal(tableRows(dom).length, 8, "7 voucher rows + 1 unassigned passenger row");
    assert.match(textOf(dom, "#file-warnings"), /no tienen servicio informado/);
    assert.match(textOf(dom, "#result-warnings"), /servicios distintos/);

    const allDates = Object.values(expectedByDate).reduce((total, day) => ({
        passengers: total.passengers + day.passengers,
        reservations: total.reservations + day.reservations,
        rooms: total.rooms + day.rooms,
        mapPassengers: total.mapPassengers + day.mapPassengers,
        mapReservations: total.mapReservations + day.mapReservations,
        pcPassengers: total.pcPassengers + day.pcPassengers,
        pcReservations: total.pcReservations + day.pcReservations
    }), { passengers: 0, reservations: 0, rooms: 0, mapPassengers: 0, mapReservations: 0, pcPassengers: 0, pcReservations: 0 });
    assert.deepEqual(allDates, {
        passengers: 42, reservations: 20, rooms: 22,
        mapPassengers: 8, mapReservations: 4,
        pcPassengers: 8, pcReservations: 4
    });
    assert.deepEqual(allClassifications, {
        INDIVIDUAL: 13,
        CONTINGENTE: 4,
        NO_CLASIFICADA: 3
    });
    closeApp(dom);
});

test("21. integration calls the unchanged engine and does not mutate parsed records", () => {
    const dom = createApp();
    const csv = makeCsv([
        makeRecord({ sequence: 1, voucher: "IMMUTABLE", transport: "PPJ BUS", package: "PPJ", service: "PENSIÓN COMPLETA" }),
        makeRecord({ sequence: 2, voucher: "IMMUTABLE", transport: "PPJ BUS", package: "PPJ", service: "PENSIÓN COMPLETA" })
    ]);
    const records = dom.window.ReservationsCore.parseCSV(csv);
    const snapshot = JSON.stringify(records);
    const actual = dom.window.ReservationsCore.processReservations(records);
    const expectedClassification = dom.window.ReservationsCore.classifyReservation(records).tipo;

    assert.equal(JSON.stringify(records), snapshot);
    assert.equal(actual[0].clasificacion.tipo, expectedClassification);
    assert.equal(actual[0].pasajeros[0].pax.nombre, "PASAJERO-SINTETICO-1");
    closeApp(dom);
});