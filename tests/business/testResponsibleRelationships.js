const {
    buildResponsibleRelationships
} = require("../../src/business/responsibleRelationships");


function assert(condition, message) {
    if (!condition) {
        throw new Error(`❌ TEST FALLIDO: ${message}`);
    }
}


function makeReservation({
    voucher,
    titularDni = null,
    passengers = [],
    habitaciones = []
}) {
    const paxList = Array.isArray(passengers) ? passengers : [];

    if (titularDni !== null) {
        paxList.unshift({
            pax: {
                numeroDocumento: titularDni,
                nombre: "TITULAR"
            }
        });
    }

    return {
        voucher,
        pasajeros: paxList,
        habitaciones: Array.isArray(habitaciones)
            ? habitaciones
            : []
    };
}


console.log("\n=== Tests de relaciones por responsable ===\n");

const reservas = [
    makeReservation({
        voucher: "A",
        titularDni: "12345678",
        habitaciones: [
            { alojamiento: "900", numero: "101" },
            { alojamiento: "900", numero: "102" }
        ]
    }),
    makeReservation({
        voucher: "B",
        titularDni: "12345678",
        habitaciones: [
            { alojamiento: "901", numero: "9" },
            { alojamiento: "901", numero: "10" }
        ]
    }),
    makeReservation({
        voucher: "C",
        titularDni: "11111111",
        passengers: [
            { pax: { numeroDocumento: "11111111", nombre: "TITULAR" } },
            { pax: { numeroDocumento: "12345678", nombre: "ACOMPAÑANTE" } }
        ],
        habitaciones: [
            { alojamiento: "900", numero: "201" }
        ]
    }),
    makeReservation({
        voucher: "D",
        titularDni: "22222222",
        passengers: [
            { pax: { numeroDocumento: "22222222", nombre: "TITULAR" } },
            { pax: { numeroDocumento: "12345678", nombre: "ACOMPAÑANTE" } }
        ],
        habitaciones: [
            { alojamiento: "901", numero: "11" }
        ]
    }),
    {
        voucher: "X",
        pasajeros: [],
        habitaciones: []
    },
    {
        voucher: "Y",
        pasajeros: [
            { pax: { nombre: "SIN DNI" } }
        ],
        habitaciones: []
    },
    makeReservation({
        voucher: "E",
        titularDni: "44444444",
        habitaciones: [
            { alojamiento: "900", numero: "101" }
        ]
    }),
    makeReservation({
        voucher: "F",
        titularDni: "44444444",
        habitaciones: [
            { alojamiento: "901", numero: "101" }
        ]
    }),
    {
        voucher: "Z",
        pasajeros: [
            { pax: { numeroDocumento: "55555555", nombre: "TITULAR SIN HABITACION" } }
        ],
        habitaciones: [
            { alojamiento: null, numero: "101" }
        ]
    },
    {
        voucher: "W",
        pasajeros: [
            { pax: { numeroDocumento: "77777777", nombre: "TITULAR" } }
        ],
        habitaciones: [
            { alojamiento: null, numero: "202" }
        ]
    }
];

const relacionados = buildResponsibleRelationships(reservas);

assert(
    Object.prototype.hasOwnProperty.call(relacionados.indexByResponsibleDni, "12345678"),
    "Debe crear el índice para el titular compartido"
);

assert(
    relacionados.indexByResponsibleDni["12345678"].cantidadVouchers === 2,
    "Debe conservar dos vouchers bajo el mismo responsable"
);

assert(
    relacionados.indexByResponsibleDni["12345678"].vouchers.some(v => v.voucher === "A" && v.reservaIndex === 0) &&
    relacionados.indexByResponsibleDni["12345678"].vouchers.some(v => v.voucher === "B" && v.reservaIndex === 1),
    "Cada voucher debe conservar el índice original dentro del array recibido"
);

assert(
    relacionados.indexByResponsibleDni["12345678"].vouchers.some(v => v.voucher === "A") &&
    relacionados.indexByResponsibleDni["12345678"].vouchers.some(v => v.voucher === "B"),
    "Debe incluir ambos vouchers del mismo responsable"
);

const acompañanteCoincidente = buildResponsibleRelationships([
    {
        voucher: "C-ACOMPAÑANTE",
        pasajeros: [
            { pax: { numeroDocumento: "11111111", nombre: "TITULAR" } },
            { pax: { numeroDocumento: "12345678", nombre: "ACOMPAÑANTE" } }
        ],
        habitaciones: [{ alojamiento: "900", numero: "201" }]
    },
    {
        voucher: "D-ACOMPAÑANTE",
        pasajeros: [
            { pax: { numeroDocumento: "22222222", nombre: "TITULAR" } },
            { pax: { numeroDocumento: "12345678", nombre: "ACOMPAÑANTE" } }
        ],
        habitaciones: [{ alojamiento: "901", numero: "11" }]
    }
]);

assert(
    !Object.prototype.hasOwnProperty.call(acompañanteCoincidente.indexByResponsibleDni, "12345678"),
    "Un DNI solo como acompañante no debe crear relación entre vouchers"
);

assert(
    Object.prototype.hasOwnProperty.call(acompañanteCoincidente.indexByResponsibleDni, "11111111") &&
    Object.prototype.hasOwnProperty.call(acompañanteCoincidente.indexByResponsibleDni, "22222222"),
    "Cada voucher conserva su titular documental como responsable, aunque comparta un acompañante"
);

assert(
    relacionados.orphanReservations.some(item => item.voucher === "X" && item.motivo === "sinTitularValido"),
    "Voucher sin pasajeros debe quedar en orphanReservations"
);

assert(
    relacionados.ignoredReservations.some(item => item.voucher === "Y" && item.motivo === "dniResponsableNoDisponible"),
    "Primer PAX sin DNI debe quedar en ignoredReservations"
);

assert(
    relacionados.indexByResponsibleDni["44444444"].cantidadVouchers === 2,
    "Un responsable con varios vouchers mantiene todos los vouchers en el mismo grupo"
);

assert(
    relacionados.indexByResponsibleDni["44444444"].vouchers.some(item => item.voucher === "E" && item.reservaIndex === 6) &&
    relacionados.indexByResponsibleDni["44444444"].vouchers.some(item => item.voucher === "F" && item.reservaIndex === 7),
    "Los índices deben reflejar exactamente la posición original del array"
);

assert(
    relacionados.indexByResponsibleDni["44444444"].vouchers.some(item => item.voucher === "E") &&
    relacionados.indexByResponsibleDni["44444444"].vouchers.some(item => item.voucher === "F"),
    "Debe conservar los vouchers del mismo responsable sin fusionarlos"
);

assert(
    relacionados.indexByResponsibleDni["44444444"].vouchers.some(item => item.voucher === "E" && item.alojamiento === "900") &&
    relacionados.indexByResponsibleDni["44444444"].vouchers.some(item => item.voucher === "F" && item.alojamiento === "901"),
    "Alojamiento 900 y 901 deben conservarse como identidades diferentes"
);

assert(
    relacionados.indexByResponsibleDni["55555555"].vouchers[0].alojamiento === null,
    "Cuando el alojamiento es nulo, debe conservarse exactamente null"
);

assert(
    relacionados.indexByResponsibleDni["77777777"].vouchers[0].alojamiento === null,
    "Cuando no hay alojamiento, no se inventa 900"
);

assert(
    !Object.prototype.hasOwnProperty.call(relacionados.indexByResponsibleDni, "12345678") ||
    relacionados.indexByResponsibleDni["12345678"].vouchers.length === 2,
    "No debe duplicar vouchers bajo el mismo índice"
);

console.log("OK relaciones por responsable");
