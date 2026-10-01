const fs = require("fs");
const path = require("path");

const {
    buildResponsibleRelationships
} = require("../../src/business/responsibleRelationships");

const {
    buildResponsibleRelationsAggregateView
} = require("../../src/business/responsibleRelationsAggregate");

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


function passenger(document, ingreso, egreso, servicios) {

    return {
        pax: { numeroDocumento: document },
        estadia: { ingreso, egreso },
        servicios
    };
}


function reservation(voucher, passengers, rooms) {

    return {
        voucher,
        pasajeros: passengers,
        cantidadPasajeros: passengers.length,
        habitaciones: rooms,
        clasificacion: {
            tipo: "INDIVIDUAL",
            consistente: true,
            advertencias: []
        }
    };
}


function containsInterpretiveField(value) {

    const forbiddenFields = new Set([
        "continuidad",
        "reingreso",
        "cambiohabitacion",
        "mismafamilia",
        "mismapersona",
        "estanciaacumulada",
        "superposicion",
        "titular",
        "grupofamiliar"
    ]);

    if (!value || typeof value !== "object") {
        return false;
    }

    return Object.entries(value).some(([key, nestedValue]) => {
        const normalizedKey = key.toLowerCase().replace(/[^a-z]/g, "");

        return forbiddenFields.has(normalizedKey) ||
            containsInterpretiveField(nestedValue);
    });
}


console.log("\n=== Agregado de relaciones por responsable ===\n");

const artificialReservations = [
    reservation("ART-A", [
        passenger("700", "01/10/2026", "03/10/2026", "SERVICIO A"),
        passenger("701", "02/10/2026", "04/10/2026", "SERVICIO B")
    ], [
        { alojamiento: "901", numero: "11" },
        { alojamiento: "901", numero: "12" }
    ]),
    reservation("ART-B", [
        passenger("700", "05/10/2026", "07/10/2026", "SERVICIO C"),
        passenger("702", "05/10/2026", "07/10/2026", "SERVICIO C")
    ], [
        { alojamiento: "902", numero: "11" }
    ])
];
const artificialRelations = buildResponsibleRelationships(
    artificialReservations
);
const artificialRelationsSnapshot = JSON.stringify(artificialRelations);
const artificialReservationsSnapshot = JSON.stringify(artificialReservations);
const artificialView = buildResponsibleRelationsAggregateView(
    artificialRelations,
    "700",
    artificialReservations
);

assert(
    artificialView.cantidadVouchers === 2 &&
    artificialView.vouchers.length === 2 &&
    artificialView.vouchers[0].voucher === "ART-A" &&
    artificialView.vouchers[0].reservaIndex === 0 &&
    artificialView.vouchers[1].voucher === "ART-B" &&
    artificialView.vouchers[1].reservaIndex === 1,
    "deberia conservar cada voucher y su indice original"
);
assert(
    artificialView.totalPaxRegistrados === 4 &&
    artificialView.documentosDistintos === 3,
    "deberia contar PAX registrados y documentos distintos por separado"
);
assert(
    artificialView.alojamientos.join(",") === "901,902" &&
    artificialView.vouchers[0].habitaciones.join(",") === "11,12" &&
    artificialView.vouchers.length === 2,
    "deberia conservar alojamientos y habitaciones sin dividir vouchers"
);
assert(
    artificialView.extremosFechas.ingresoMinimo === "01/10/2026" &&
    artificialView.extremosFechas.egresoMaximo === "07/10/2026",
    "deberia calcular extremos usando todas las fechas proyectadas"
);
assert(
    artificialView.vouchers[0].fechaIngreso.uniforme === false &&
    artificialView.vouchers[0].fechaIngreso.valores.join(",") ===
        "01/10/2026,02/10/2026" &&
    artificialView.vouchers[0].fechaEgreso.valores.join(",") ===
        "03/10/2026,04/10/2026" &&
    artificialView.vouchers[0].servicios.uniforme === false &&
    artificialView.vouchers[0].servicios.valores.join(",") ===
        "SERVICIO A,SERVICIO B" &&
    artificialView.vouchers[1].servicios.valor === "SERVICIO C",
    "deberia conservar divergencias por voucher sin consolidar valores distintos"
);
assert(
    JSON.stringify(artificialRelations) === artificialRelationsSnapshot &&
    JSON.stringify(artificialReservations) === artificialReservationsSnapshot,
    "la proyeccion no deberia mutar relaciones ni reservas originales"
);

const invalidDateReservations = [reservation("INVALID-DATE", [
    passenger("800", "31/02/2026", "02/10/2026", "SERVICIO")
], [{ alojamiento: "901", numero: "13" }])];
const invalidDateRelations = buildResponsibleRelationships(
    invalidDateReservations
);
const invalidDateView = buildResponsibleRelationsAggregateView(
    invalidDateRelations,
    "800",
    invalidDateReservations
);

assert(
    invalidDateView.extremosFechas.ingresoMinimo === null &&
    invalidDateView.extremosFechas.egresoMaximo === "02/10/2026",
    "una fecha invalida deberia dejar sin extremo solo su propio campo"
);

const csvPath = path.join(__dirname, "../../oct31_8.csv");
const realRecords = parseCSV(fs.readFileSync(csvPath, "utf8"));
const realReservations = processReservations(realRecords);
const realRelations = buildResponsibleRelationships(realReservations);
const realRelationsSnapshot = JSON.stringify(realRelations);
const realReservationsSnapshot = JSON.stringify(realReservations);

const realContractCases = [
    {
        dni: "14885869",
        cantidadVouchers: 2,
        totalPaxRegistrados: 4,
        documentosDistintos: 2,
        habitaciones: ["23"],
        ingresoMinimo: "05/10/2026",
        egresoMaximo: "08/10/2026"
    },
    {
        dni: "35656610",
        cantidadVouchers: 2,
        totalPaxRegistrados: 4,
        documentosDistintos: 2,
        habitaciones: ["14"],
        ingresoMinimo: "08/10/2026",
        egresoMaximo: "12/10/2026"
    },
    {
        dni: "24973836",
        cantidadVouchers: 1,
        totalPaxRegistrados: 14,
        documentosDistintos: 14,
        habitaciones: ["11", "15", "20", "21", "22"],
        ingresoMinimo: "09/10/2026",
        egresoMaximo: "11/10/2026"
    }
];
const realViews = new Map();

for (const expected of realContractCases) {
    const view = buildResponsibleRelationsAggregateView(
        realRelations,
        expected.dni,
        realReservations
    );
    const rooms = [...new Set(
        view.vouchers.flatMap(item => item.habitaciones)
    )];

    realViews.set(expected.dni, view);

    assert(
        view.responsableDni === expected.dni &&
        view.cantidadVouchers === expected.cantidadVouchers &&
        view.vouchers.length === expected.cantidadVouchers &&
        view.totalPaxRegistrados === expected.totalPaxRegistrados &&
        view.documentosDistintos === expected.documentosDistintos &&
        view.alojamientos.join(",") === "901" &&
        rooms.join(",") === expected.habitaciones.join(",") &&
        view.extremosFechas.ingresoMinimo === expected.ingresoMinimo &&
        view.extremosFechas.egresoMaximo === expected.egresoMaximo,
        `oct31_8.csv deberia cumplir el contrato para ${expected.dni}`
    );
    assert(
        Object.keys(view).sort().join(",") === [
            "alojamientos",
            "cantidadVouchers",
            "documentosDistintos",
            "extremosFechas",
            "responsableDni",
            "totalPaxRegistrados",
            "vouchers"
        ].sort().join(",") &&
        view.vouchers.every(item => Object.keys(item).sort().join(",") === [
            "alojamiento",
            "cantidadPasajeros",
            "clasificacion",
            "fechaEgreso",
            "fechaIngreso",
            "habitaciones",
            "reservaIndex",
            "servicios",
            "voucher"
        ].sort().join(",")) &&
        !containsInterpretiveField(view),
        `el agregado de ${expected.dni} no deberia introducir interpretaciones`
    );
}

const real14885869 = realViews.get("14885869");
assert(
    real14885869.vouchers.map(item => item.voucher).join(",") ===
        "30252951,30253015",
    "14885869 deberia conservar la identidad individual de sus vouchers"
);

const real35656610 = realViews.get("35656610");
assert(
    real35656610.vouchers.length === 2 &&
    real35656610.vouchers[0].servicios.valor === "DESAYUNO U.PROPIAS" &&
    real35656610.vouchers[1].servicios.valor === "MEDIA PENSION",
    "oct31_8.csv deberia conservar ambos servicios de 35656610 por voucher"
);

const real24973836 = realViews.get("24973836");
assert(
    real24973836.vouchers[0].voucher === "30255244" &&
    real24973836.vouchers[0].habitaciones.join(",") === "11,15,20,21,22",
    "oct31_8.csv deberia conservar el voucher multi-habitacion de 24973836"
);
assert(
    JSON.stringify(realRelations) === realRelationsSnapshot &&
    JSON.stringify(realReservations) === realReservationsSnapshot,
    "la validacion CSV no deberia mutar relaciones ni reservas originales"
);

console.log("OK agregado de relaciones, divergencias e inmutabilidad");