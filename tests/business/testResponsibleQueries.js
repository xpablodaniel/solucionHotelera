const fs = require("fs");
const path = require("path");

const {
    buildResponsibleRelationships
} = require("../../src/business/responsibleRelationships");

const {
    findRelatedReservationsByDni
} = require("../../src/business/responsibleQueries");

const {
    parseCSV
} = require("../../src/parser/csvParser");

const {
    processReservations
} = require("../../src/business/processReservations");


function assert(condition, message) {

    if (!condition) {
        throw new Error(`TEST FALLIDO: ${message}`);
    }
}


function makeReservation(voucher, dni, habitaciones) {

    return {
        voucher,
        pasajeros: [{ pax: { numeroDocumento: dni } }],
        habitaciones
    };
}


console.log("\n=== Consultas independientes de relaciones ===\n");

const reservas = [
    makeReservation("A", "12345678", [
        { alojamiento: "900", numero: "101" }
    ]),
    makeReservation("B", "12345678", [
        { alojamiento: "901", numero: "9" },
        { alojamiento: "901", numero: "10" }
    ]),
    makeReservation("C", "22222222", [
        { alojamiento: null, numero: "201" }
    ]),
    {
        voucher: "D",
        pasajeros: [
            { pax: { numeroDocumento: "99999999" } },
            { pax: { numeroDocumento: "12345678" } }
        ],
        habitaciones: [{ alojamiento: "901", numero: "11" }]
    },
    {
        voucher: "E",
        pasajeros: [
            { pax: { numeroDocumento: "88888888" } },
            { pax: { numeroDocumento: "77777777" } }
        ],
        habitaciones: [{ alojamiento: "901", numero: "12" }]
    }
];

const relations = buildResponsibleRelationships(reservas);
const oneVoucher = findRelatedReservationsByDni(relations, "22222222");
const severalVouchers = findRelatedReservationsByDni(relations, "12345678");
const missing = findRelatedReservationsByDni(relations, "00000000");
const companionOnly = findRelatedReservationsByDni(relations, "77777777");

assert(
    oneVoucher.vouchers.length === 1 &&
    oneVoucher.vouchers[0].voucher === "C" &&
    oneVoucher.vouchers[0].reservaIndex === 2,
    "deberia consultar un responsable con un voucher"
);
assert(
    severalVouchers.cantidadVouchers === 2 &&
    severalVouchers.vouchers.map(item => item.voucher).join(",") === "A,B",
    "deberia consultar todos los vouchers del responsable"
);
assert(
    severalVouchers.vouchers[0].alojamiento === "900" &&
    severalVouchers.vouchers[0].habitaciones.join(",") === "101" &&
    severalVouchers.vouchers[1].alojamiento === "901" &&
    severalVouchers.vouchers[1].habitaciones.join(",") === "9,10",
    "deberia conservar alojamiento y habitaciones de cada voucher"
);
assert(
    missing.responsableDni === "00000000" &&
    missing.vouchers.length === 0 &&
    missing.cantidadVouchers === 0,
    "un DNI inexistente deberia devolver un resultado vacio determinista"
);
assert(
    companionOnly.vouchers.length === 0,
    "un DNI que solo aparece como acompañante no deberia ser consultable"
);
assert(
    findRelatedReservationsByDni(relations, "22222222").vouchers[0].alojamiento === null,
    "deberia conservar alojamiento null"
);

const relationsSnapshot = JSON.stringify(relations);
findRelatedReservationsByDni(relations, "12345678");
assert(
    JSON.stringify(relations) === relationsSnapshot,
    "la consulta no deberia modificar las relaciones"
);

const csvPath = path.join(__dirname, "../../oct31_8.csv");
const realRecords = parseCSV(fs.readFileSync(csvPath, "utf8"));
const realReservations = processReservations(realRecords);
const realRelations = buildResponsibleRelationships(realReservations);
const realQuery = findRelatedReservationsByDni(realRelations, "14885869");
const realCompanionQuery = findRelatedReservationsByDni(realRelations, "14340128");

assert(
    realQuery.vouchers.map(item => item.voucher).sort().join(",") ===
        "30252951,30253015",
    "la consulta real deberia devolver los dos vouchers relacionados"
);
assert(
    realQuery.vouchers.every(item =>
        realReservations[item.reservaIndex].voucher === item.voucher
    ),
    "la consulta real deberia conservar reservaIndex"
);
assert(
    realCompanionQuery.vouchers.length === 0,
    "la consulta real no deberia promover un DNI acompañante"
);

console.log("OK consultas independientes sin modificar relaciones");