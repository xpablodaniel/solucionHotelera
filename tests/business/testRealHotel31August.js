const fs = require("fs");
const path = require("path");

const {
    parseCSV
} = require("../../src/parser/csvParser");

const {
    processReservations
} = require("../../src/business/processReservations");

const {
    buildResponsibleRelationships
} = require("../../src/business/responsibleRelationships");


function assert(condition, message) {

    if (!condition) {
        throw new Error(`TEST FALLIDO: ${message}`);
    }
}


function reservationFor(reservas, voucher) {

    return reservas.find(reserva => reserva.voucher === voucher);
}


function roomNumbers(reserva) {

    return reserva.habitaciones
        .map(habitacion => habitacion.numero)
        .sort((a, b) => Number(a) - Number(b));
}


console.log("\n=== Regresion CSV real: Hotel 31 de Agosto ===\n");

const csvPath = path.join(__dirname, "../../oct31_8.csv");
const csv = fs.readFileSync(csvPath, "utf8");
const records = parseCSV(csv);
const reservas = processReservations(records);

assert(records.length === 86, "deberia conservar 86 pasajeros");
assert(reservas.length === 36, "deberia conservar 36 vouchers");
assert(
    records.every(record => record.alojamiento === "901"),
    "todos los registros deberian conservar alojamiento 901"
);
assert(
    records.every(record => record.hotel === "HOTEL 31 DE AGOSTO"),
    "todos los registros deberian conservar la descripcion real del hotel"
);

assert(
    new Set(records.map(record => record.habitacion.numero)).size === 20 &&
    records.every(record => {
        const numero = Number(record.habitacion.numero);
        return numero >= 7 && numero <= 26;
    }),
    "deberia conservar las habitaciones 7 a 26"
);

const expectedRoomsByVoucher = {
    "28001677": ["13", "19"],
    "30255244": ["11", "15", "20", "21", "22"],
    "88000192": ["24", "25"]
};

for (const [voucher, expectedRooms] of Object.entries(expectedRoomsByVoucher)) {

    const reserva = reservationFor(reservas, voucher);

    assert(
        reserva &&
        JSON.stringify(roomNumbers(reserva)) === JSON.stringify(expectedRooms),
        `el voucher ${voucher} deberia conservar sus habitaciones reales`
    );
}

const voucher161001383Records = records.filter(
    record => record.voucher === "161001383"
);
const voucher161001383 = reservationFor(reservas, "161001383");

assert(
    voucher161001383Records.length === 2 &&
    voucher161001383Records.every(record =>
        record.habitacion.numero === "12" &&
        record.plazas.cantidad === 2 &&
        record.plazas.ocupadas === 3
    ),
    "el parser deberia conservar la inconsistencia original de plazas del voucher 161001383"
);
assert(
    voucher161001383 &&
    roomNumbers(voucher161001383).join(",") === "12" &&
    voucher161001383.cantidadPasajeros === 2,
    "el procesamiento deberia conservar habitacion 12 y sus dos pasajeros"
);

const reservasBeforeRelationships = JSON.parse(JSON.stringify(reservas));
const relationships = buildResponsibleRelationships(reservas);

assert(
    JSON.stringify(reservas) === JSON.stringify(reservasBeforeRelationships),
    "buildResponsibleRelationships no deberia modificar las reservas originales"
);

for (const relationship of Object.values(
    relationships.indexByResponsibleDni
)) {

    for (const voucherEntry of relationship.vouchers) {

        const reserva = reservas[voucherEntry.reservaIndex];
        const expectedRooms = roomNumbers(reserva);
        const expectedAccommodation = reserva.habitaciones.length > 0
            ? reserva.habitaciones[0].alojamiento ?? null
            : null;

        assert(
            reserva && reserva.voucher === voucherEntry.voucher,
            "reservaIndex deberia apuntar al voucher original"
        );
        assert(
            voucherEntry.alojamiento === expectedAccommodation &&
            voucherEntry.habitaciones.join(",") === expectedRooms.join(",") &&
            reserva.habitaciones.every(habitacion =>
                (habitacion.alojamiento ?? null) === voucherEntry.alojamiento
            ),
            "cada relacion deberia conservar exclusivamente el alojamiento y habitaciones de su voucher"
        );
    }
}

const expectedResponsibleRelationships = {
    "14885869": ["30252951", "30253015"],
    "35656610": ["9005042", "9005043"]
};

for (const [dni, expectedVouchers] of Object.entries(
    expectedResponsibleRelationships
)) {

    const relationship = relationships.indexByResponsibleDni[dni];

    assert(
        relationship &&
        relationship.vouchers.map(item => item.voucher).sort().join(",") ===
            expectedVouchers.sort().join(","),
        "solo los DNI repetidos en el primer pasajero deberian relacionar vouchers"
    );
}

for (const dni of ["14340128", "16920579"]) {

    assert(
        !Object.prototype.hasOwnProperty.call(
            relationships.indexByResponsibleDni,
            dni
        ),
        "un DNI repetido solo en acompañantes no deberia crear una relacion"
    );
}

console.log("OK regresion CSV real sin imprimir datos personales");