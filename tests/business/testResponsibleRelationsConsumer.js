const fs = require("fs");
const path = require("path");

const {
    buildResponsibleRelationships
} = require("../../src/business/responsibleRelationships");

const {
    buildResponsibleRelationsView
} = require("../../src/business/responsibleRelationsConsumer");

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


function reservation(voucher, dni, alojamiento, numero) {

    return {
        voucher,
        pasajeros: [{ pax: { numeroDocumento: dni } }],
        habitaciones: [{ alojamiento, numero }]
    };
}


console.log("\n=== Consumidor de relaciones por responsable ===\n");

const reservas = [
    reservation("A", "12345678", "900", "101"),
    {
        ...reservation("B", "12345678", "901", "9"),
        habitaciones: [
            { alojamiento: "901", numero: "9" },
            { alojamiento: "901", numero: "10" }
        ]
    },
    reservation("C", "22222222", null, "201"),
    {
        voucher: "D",
        pasajeros: [
            { pax: { numeroDocumento: "88888888" } },
            { pax: { numeroDocumento: "12345678" } }
        ],
        habitaciones: [{ alojamiento: "901", numero: "11" }]
    },
    {
        voucher: "E",
        pasajeros: [
            { pax: { numeroDocumento: "77777777" } },
            { pax: { numeroDocumento: "66666666" } }
        ],
        habitaciones: [{ alojamiento: "901", numero: "12" }]
    }
];

const relations = buildResponsibleRelationships(reservas);
const relationsSnapshot = JSON.stringify(relations);
const reservasSnapshot = JSON.stringify(reservas);

const oneVoucher = buildResponsibleRelationsView(
    relations,
    "22222222",
    reservas,
    { includeDetail: true }
);
const twoVouchers = buildResponsibleRelationsView(
    relations,
    "12345678",
    reservas,
    { includeDetail: true }
);
const minimalView = buildResponsibleRelationsView(relations, "12345678");
const missing = buildResponsibleRelationsView(relations, "00000000", reservas);
const companionOnly = buildResponsibleRelationsView(relations, "66666666", reservas);

assert(
    oneVoucher.responsableDni === "22222222" &&
    oneVoucher.cantidadVouchers === 1 &&
    oneVoucher.vouchers[0].voucher === "C",
    "deberia producir la vista de un responsable con un voucher"
);
assert(
    twoVouchers.responsableDni === "12345678" &&
    twoVouchers.cantidadVouchers === 2 &&
    twoVouchers.vouchers.map(item => item.voucher).join(",") === "A,B",
    "deberia producir la vista de un responsable con dos vouchers"
);
assert(
    twoVouchers.vouchers[0].alojamiento === "900" &&
    twoVouchers.vouchers[0].habitaciones.join(",") === "101" &&
    twoVouchers.vouchers[1].alojamiento === "901" &&
    twoVouchers.vouchers[1].habitaciones.join(",") === "9,10",
    "deberia conservar vouchers de alojamientos diferentes"
);
assert(
    twoVouchers.vouchers[0].reservaIndex === 0 &&
    twoVouchers.vouchers[1].reservaIndex === 1,
    "deberia conservar el indice original de cada voucher"
);
assert(
    twoVouchers.vouchers[0].detalle.voucher === reservas[0].voucher &&
    twoVouchers.vouchers[1].detalle.voucher === reservas[1].voucher &&
    !Object.prototype.hasOwnProperty.call(
        twoVouchers.vouchers[0].detalle,
        "pasajeros"
    ),
    "deberia recuperar una proyeccion de detalle mediante reservaIndex"
);
assert(
    !Object.prototype.hasOwnProperty.call(minimalView.vouchers[0], "detalle"),
    "el detalle no deberia incluirse por defecto"
);
assert(
    missing.responsableDni === "00000000" &&
    missing.cantidadVouchers === 0 &&
    missing.vouchers.length === 0,
    "un DNI inexistente deberia producir una vista vacia"
);
assert(
    companionOnly.vouchers.length === 0,
    "un DNI solo acompañante no deberia producir una vista relacional"
);
assert(
    buildResponsibleRelationsView(relations, "22222222").vouchers[0].alojamiento === null,
    "deberia conservar alojamiento null"
);

const invalidRelations = {
    indexByResponsibleDni: {
        INVALID: {
            responsableDni: "INVALID",
            cantidadVouchers: 1,
            vouchers: [{
                voucher: "INVALID-VOUCHER",
                alojamiento: "901",
                habitaciones: ["99"],
                reservaIndex: 999
            }]
        }
    }
};
const invalidDetailView = buildResponsibleRelationsView(
    invalidRelations,
    "INVALID",
    reservas,
    { includeDetail: true }
);

assert(
    invalidDetailView.vouchers[0].detalle === null,
    "un reservaIndex invalido deberia producir detalle null"
);

twoVouchers.vouchers[0].detalle.habitaciones[0].numero = "MUTATED";
twoVouchers.vouchers[0].detalle.habitaciones[0].asignaciones.push("MUTATED");

assert(
    reservas[0].habitaciones[0].numero === "101" &&
    !reservas[0].habitaciones[0].asignaciones,
    "mutar el snapshot no deberia modificar la reserva original"
);
assert(
    JSON.stringify(relations) === relationsSnapshot &&
    JSON.stringify(reservas) === reservasSnapshot,
    "el consumidor no deberia mutar relaciones ni reservas"
);

const csvPath = path.join(__dirname, "../../oct31_8.csv");
const realRecords = parseCSV(fs.readFileSync(csvPath, "utf8"));
const realReservations = processReservations(realRecords);
const realRelations = buildResponsibleRelationships(realReservations);
const realView = buildResponsibleRelationsView(
    realRelations,
    "14885869",
    realReservations,
    { includeDetail: true }
);
const realCompanionView = buildResponsibleRelationsView(
    realRelations,
    "14340128",
    realReservations
);

assert(
    realView.cantidadVouchers === 2 &&
    realView.vouchers.map(item => item.voucher).sort().join(",") ===
        "30252951,30253015" &&
    realView.vouchers.every(item =>
        item.detalle.voucher === realReservations[item.reservaIndex].voucher
    ),
    "la regresion real deberia producir la vista y detalles esperados"
);
assert(
    realCompanionView.vouchers.length === 0,
    "la regresion real no deberia promover un DNI acompañante"
);

console.log("OK consumidor de relaciones sin mutaciones");