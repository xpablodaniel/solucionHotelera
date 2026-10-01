const fs = require("fs");
const path = require("path");

const {
    buildResponsibleRelationships
} = require("../../src/business/responsibleRelationships");

const {
    buildResponsibleRelationsView,
    projectResponsibleReservationDetail
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

const uniformReservations = [{
    voucher: "UNIFORM",
    pasajeros: [
        {
            estadia: { ingreso: "05/10/2026", egreso: "07/10/2026" },
            servicios: "SERVICIO UNIFORME"
        },
        {
            estadia: { ingreso: "05/10/2026", egreso: "07/10/2026" },
            servicios: "SERVICIO UNIFORME"
        }
    ],
    habitaciones: [
        {
            alojamiento: "901",
            numero: "23",
            capacidad: 2,
            ocupadasInformadas: 2
        },
        {
            alojamiento: "901",
            numero: "24",
            capacidad: 2,
            ocupadasInformadas: 2
        }
    ],
    cantidadPasajeros: 2,
    clasificacion: {
        tipo: "INDIVIDUAL",
        consistente: true,
        advertencias: []
    }
}];
const uniformReservationsSnapshot = JSON.stringify(uniformReservations);
const uniformDetail = projectResponsibleReservationDetail(
    uniformReservations,
    0,
    "DNI-RECIBIDO"
);

assert(
    uniformDetail.voucher === "UNIFORM" &&
    uniformDetail.responsableDni === "DNI-RECIBIDO" &&
    uniformDetail.fechaIngreso.uniforme === true &&
    uniformDetail.fechaIngreso.valores.length === 1 &&
    uniformDetail.servicios.uniforme === true,
    "deberia proyectar un voucher uniforme sin reinterpretar el DNI"
);
assert(
    uniformDetail.fechaIngreso.valor === "05/10/2026" &&
    uniformDetail.servicios.valor === "SERVICIO UNIFORME" &&
    uniformDetail.habitaciones.length === 2 &&
    uniformDetail.habitaciones[0].alojamiento === "901" &&
    uniformDetail.habitaciones[0].numero === "23" &&
    uniformDetail.habitaciones[0].capacidad === 2 &&
    uniformDetail.habitaciones[0].ocupadasInformadas === 2,
    "deberia conservar un voucher multi-habitacion sin consultar inventario"
);

const divergentReservations = [
    {
        voucher: "DIVERGENT",
        pasajeros: [
            {
                estadia: { ingreso: "01/10/2026", egreso: "03/10/2026" },
                servicios: "SERVICIO A"
            },
            {
                estadia: { ingreso: "02/10/2026", egreso: "04/10/2026" },
                servicios: "SERVICIO B"
            }
        ],
        habitaciones: [{
            alojamiento: "900",
            numero: "101",
            capacidad: 2,
            ocupadasInformadas: 2
        }],
        cantidadPasajeros: 2,
        clasificacion: {
            tipo: "NO_CLASIFICADA",
            consistente: false,
            advertencias: ["valores divergentes"]
        }
    }
];
const divergentDetail = projectResponsibleReservationDetail(
    divergentReservations,
    0,
    "DIVERGENT-DNI"
);

assert(
    divergentDetail.fechaIngreso.uniforme === false &&
    divergentDetail.fechaIngreso.valor === null &&
    divergentDetail.fechaIngreso.valores.join(",") ===
        "01/10/2026,02/10/2026" &&
    divergentDetail.fechaEgreso.uniforme === false &&
    divergentDetail.servicios.uniforme === false &&
    divergentDetail.servicios.valores.join(",") === "SERVICIO A,SERVICIO B",
    "deberia conservar fechas y servicios divergentes explicitamente"
);
assert(
    divergentDetail.habitaciones[0].alojamiento === "900" &&
    divergentDetail.habitaciones[0].capacidad === 2 &&
    divergentDetail.habitaciones[0].ocupadasInformadas === 2,
    "deberia conservar capacidad y ocupacion informadas"
);

const nullAccommodationDetail = projectResponsibleReservationDetail([
    {
        voucher: "NULL-ACCOMMODATION",
        pasajeros: [],
        habitaciones: [{
            alojamiento: null,
            numero: "201",
            capacidad: 2,
            ocupadasInformadas: 1
        }]
    }
], 0, "NULL-DNI");

assert(
    nullAccommodationDetail.alojamiento === null &&
    nullAccommodationDetail.habitaciones[0].alojamiento === null,
    "no deberia inventar alojamiento cuando el valor es null"
);

const projectionSnapshot = JSON.stringify(uniformDetail);
uniformDetail.habitaciones[0].numero = "MUTATED";
uniformDetail.fechaIngreso.valores.push("MUTATED");

assert(
    JSON.stringify(reservas) === reservasSnapshot &&
    JSON.stringify(uniformReservations) === uniformReservationsSnapshot &&
    JSON.stringify(uniformDetail) !== projectionSnapshot,
    "modificar la proyeccion no deberia modificar la reserva original"
);
assert(
    projectResponsibleReservationDetail(reservas, 999, "INVALID") === null,
    "un reservaIndex invalido deberia devolver null"
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