const assert = require("node:assert/strict");
const test = require("node:test");

const {
    parseCSV
} = require("../../src/parser/csvParser");

const {
    processReservations
} = require("../../src/business/processReservations");

const {
    buildResponsibleRelationships
} = require("../../src/business/responsibleRelationships");

const headers = [
    "Cód. Alojamiento", "Descripción", "Nro. habitación",
    "Tipo habitación", "Observación habitación", "Cantidad plazas",
    "Voucher", "Sede", "Fecha de ingreso", "Fecha de egreso",
    "Plazas ocupadas", "Tipo documento", "Nro. doc.",
    "Apellido y nombre", "Edad", "Entidad", "Servicios", "Paquete",
    "Transporte", "Fecha viaje", "Hora viaje", "Parada", "Email",
    "Estado", "Fecha de nacimiento", "Teléfono", "Celular", "Usuario"
];

const rows = [
    headers,
    ...[1, 2].map(index => {
        const row = Array(28).fill("");
        row[0] = "901";
        row[1] = "HOTEL 31 DE AGOSTO";
        row[2] = "12";
        row[3] = "DOBLE";
        row[5] = "2";
        row[6] = "SYN-H31-ROOM-12";
        row[7] = "SEDE SINTETICA";
        row[8] = "11/03/2026";
        row[9] = "13/03/2026";
        row[10] = "3";
        row[11] = "DNI";
        row[12] = `TEST-DOC-${index}`;
        row[13] = `PASAJERO SINTETICO ${index}`;
        row[14] = "40";
        row[16] = "MEDIA PENSION";
        row[18] = "Sin Transporte";
        row[23] = "O";
        return row;
    })
];

const csv = rows
    .map(row => row.map(value => `"${value}"`).join(","))
    .join("\r\n");

test("parses synthetic Hotel 31 de Agosto room and passenger records", () => {
    const records = parseCSV(csv);
    const reservations = processReservations(records);

    assert.equal(records.length, 2);
    assert.ok(records.every(record =>
        record.alojamiento === "901" &&
        record.hotel === "HOTEL 31 DE AGOSTO" &&
        record.habitacion.numero === "12"
    ));
    assert.equal(reservations.length, 1);
    assert.equal(reservations[0].voucher, "SYN-H31-ROOM-12");
    assert.equal(reservations[0].cantidadPasajeros, 2);
    assert.deepEqual(
        reservations[0].habitaciones.map(room => room.numero),
        ["12"]
    );

    const snapshot = JSON.stringify(reservations);
    const relationships = buildResponsibleRelationships(reservations);

    assert.equal(JSON.stringify(reservations), snapshot);
    assert.deepEqual(
        Object.keys(relationships.indexByResponsibleDni),
        ["TEST-DOC-1"]
    );
});
