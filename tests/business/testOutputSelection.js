const {
    selectOutputRecords
} = require("../../src/business/outputSelection");


function assert(condition, message) {
    if (!condition) {
        throw new Error(`TEST FALLIDO: ${message}`);
    }
}


function passenger(name, arrival) {
    return {
        pax: { nombre: name },
        estadia: { ingreso: arrival }
    };
}


const singlePassenger = passenger("SOLO", "10/10/2026");
const singleReservation = {
    voucher: "SINGLE",
    pasajeros: [singlePassenger]
};
const singleSelection = selectOutputRecords(
    [singleReservation],
    "10/10/2026"
);
assert(
    singleSelection.affectedReservations.length === 1 &&
        singleSelection.affectedReservations[0] === singleReservation &&
        singleSelection.roomingPassengers.length === 1 &&
        singleSelection.roomingPassengers[0] === singlePassenger,
    "Un voucher con un pasajero que ingresa debe aparecer completo en ambas selecciones"
);

const emptySelection = selectOutputRecords([], "10/10/2026");
assert(
    emptySelection.affectedReservations.length === 0 &&
        emptySelection.roomingPassengers.length === 0,
    "Una entrada vacía debe producir ambas selecciones vacías"
);


const juan = passenger("JUAN", "10/10/2026");
const maria = passenger("MARIA", "15/10/2026");
const voucher100 = {
    voucher: "100",
    pasajeros: [juan, maria]
};
const passengerFromVoucher200 = passenger("ANA", "10/10/2026");
const voucher200 = {
    voucher: "200",
    pasajeros: [passengerFromVoucher200]
};
const voucher300 = {
    voucher: "300",
    pasajeros: [passenger("LUIS", "11/10/2026")]
};
const reservations = [voucher100, voucher200, voucher300];
const originalSnapshot = JSON.stringify(reservations);

const selected = selectOutputRecords(reservations, "10/10/2026");

assert(
    selected.affectedReservations.length === 2 &&
        selected.affectedReservations[0] === voucher100 &&
        selected.affectedReservations[1] === voucher200,
    "Debe incluir los vouchers afectados completos, sin fusionarlos y en orden"
);
assert(
    selected.affectedReservations[0].pasajeros.length === 2 &&
        selected.affectedReservations[0].pasajeros[1] === maria,
    "Un voucher afectado debe conservar también pasajeros que ingresan otro día"
);
assert(
    selected.roomingPassengers.length === 2 &&
        selected.roomingPassengers[0] === juan &&
        selected.roomingPassengers[1] === passengerFromVoucher200,
    "Rooming debe contener solo pasajeros que ingresan ese día y conservar el orden"
);
assert(
    JSON.stringify(reservations) === originalSnapshot,
    "La selección no debe modificar processedReservations"
);

const isoDateSelection = selectOutputRecords(reservations, "2026-10-10");
assert(
    isoDateSelection.affectedReservations.length === 2 &&
        isoDateSelection.roomingPassengers.length === 2,
    "La fecha ISO debe seleccionar el mismo día que dd/mm/aaaa"
);

for (const invalidDate of ["", "31/02/2026", "2026-13-01", "not-a-date"]) {
    const invalidSelection = selectOutputRecords(reservations, invalidDate);
    assert(
        invalidSelection.affectedReservations.length === 0 &&
            invalidSelection.roomingPassengers.length === 0,
        `Una fecha inválida (${invalidDate}) debe producir una selección vacía`
    );
}

const notFoundSelection = selectOutputRecords(reservations, "12/10/2026");
assert(
    notFoundSelection.affectedReservations.length === 0 &&
        notFoundSelection.roomingPassengers.length === 0,
    "Una fecha válida sin ingresos debe producir una selección vacía"
);

let invalidInputThrew = false;
try {
    selectOutputRecords(null, "10/10/2026");
} catch (error) {
    invalidInputThrew = error instanceof TypeError;
}
assert(invalidInputThrew, "La entrada que no es un array debe lanzar TypeError");

console.log("OK selección pura de salidas");
