const {
    buildResponsibleRelationships
} = require("../../src/business/responsibleRelationships");

const {
    buildResponsibleRelationsAggregateView
} = require("../../src/business/responsibleRelationsAggregate");

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

const syntheticReservations = [
    reservation("SYN-A-1", [
        passenger("710", "05/10/2026", "07/10/2026", "DESAYUNO U.PROPIAS"),
        passenger("711", "05/10/2026", "07/10/2026", "DESAYUNO U.PROPIAS")
    ], [{ alojamiento: "901", numero: "23" }]),
    reservation("SYN-A-2", [
        passenger("710", "06/10/2026", "08/10/2026", "MEDIA PENSION"),
        passenger("711", "06/10/2026", "08/10/2026", "MEDIA PENSION")
    ], [{ alojamiento: "901", numero: "23" }]),
    reservation("SYN-B-1", [
        passenger("820", "08/10/2026", "10/10/2026", "SERVICIO B"),
        passenger("821", "08/10/2026", "10/10/2026", "SERVICIO B")
    ], [{ alojamiento: "901", numero: "14" }]),
    reservation("SYN-B-2", [
        passenger("820", "10/10/2026", "12/10/2026", "SERVICIO C"),
        passenger("821", "10/10/2026", "12/10/2026", "SERVICIO C")
    ], [{ alojamiento: "901", numero: "14" }]),
    reservation("SYN-C-1", Array.from({ length: 14 }, (_, index) =>
        passenger(
            `93${String(index).padStart(6, "0")}`,
            "09/10/2026",
            "11/10/2026",
            "SERVICIO D"
        )
    ), ["11", "15", "20", "21", "22"].map(numero => ({
        alojamiento: "901",
        numero
    })))
];
const syntheticRelations = buildResponsibleRelationships(
    syntheticReservations
);
const syntheticRelationsSnapshot = JSON.stringify(syntheticRelations);
const syntheticReservationsSnapshot = JSON.stringify(syntheticReservations);

const syntheticContractCases = [
    {
        dni: "710",
        cantidadVouchers: 2,
        totalPaxRegistrados: 4,
        documentosDistintos: 2,
        habitaciones: ["23"],
        ingresoMinimo: "05/10/2026",
        egresoMaximo: "08/10/2026"
    },
    {
        dni: "820",
        cantidadVouchers: 2,
        totalPaxRegistrados: 4,
        documentosDistintos: 2,
        habitaciones: ["14"],
        ingresoMinimo: "08/10/2026",
        egresoMaximo: "12/10/2026"
    },
    {
        dni: "93000000",
        cantidadVouchers: 1,
        totalPaxRegistrados: 14,
        documentosDistintos: 14,
        habitaciones: ["11", "15", "20", "21", "22"],
        ingresoMinimo: "09/10/2026",
        egresoMaximo: "11/10/2026"
    }
];
const syntheticViews = new Map();

for (const expected of syntheticContractCases) {
    const view = buildResponsibleRelationsAggregateView(
        syntheticRelations,
        expected.dni,
        syntheticReservations
    );
    const rooms = [...new Set(
        view.vouchers.flatMap(item => item.habitaciones)
    )];

    syntheticViews.set(expected.dni, view);

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
        `los datos sinteticos deberian cumplir el contrato para ${expected.dni}`
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
        `el agregado sintetico de ${expected.dni} no deberia introducir interpretaciones`
    );
}

const synthetic710 = syntheticViews.get("710");
assert(
    synthetic710.vouchers.map(item => item.voucher).join(",") ===
        "SYN-A-1,SYN-A-2",
    "el responsable sintetico deberia conservar la identidad de sus vouchers"
);

const synthetic820 = syntheticViews.get("820");
assert(
    synthetic820.vouchers.length === 2 &&
    synthetic820.vouchers[0].servicios.valor === "SERVICIO B" &&
    synthetic820.vouchers[1].servicios.valor === "SERVICIO C",
    "los datos sinteticos deberian conservar servicios distintos por voucher"
);

const synthetic93000000 = syntheticViews.get("93000000");
assert(
    synthetic93000000.vouchers[0].voucher === "SYN-C-1" &&
    synthetic93000000.vouchers[0].habitaciones.join(",") === "11,15,20,21,22",
    "los datos sinteticos deberian conservar las habitaciones del voucher"
);
assert(
    JSON.stringify(syntheticRelations) === syntheticRelationsSnapshot &&
    JSON.stringify(syntheticReservations) === syntheticReservationsSnapshot,
    "la validacion no deberia mutar relaciones ni reservas sinteticas"
);

console.log("OK agregado de relaciones, divergencias e inmutabilidad");