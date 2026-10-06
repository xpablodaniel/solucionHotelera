const {
    parseDateKey
} = require("../normalizer/dateKeys");


/**
 * Selecciona vouchers afectados por una fecha y pasajeros que ingresan ese día.
 *
 * Las reservas se conservan completas para las salidas agrupadas por voucher.
 * La lista de pasajeros para Rooming contiene solo quienes ingresan en la fecha.
 * Ambas listas conservan el orden de recorrido de las entradas originales.
 */
function selectOutputRecords(reservations, selectedDate) {
    if (!Array.isArray(reservations)) {
        throw new TypeError(
            "selectOutputRecords espera un array de reservas."
        );
    }

    const selectedDateKey = parseDateKey(selectedDate);
    if (selectedDateKey === null) {
        return {
            affectedReservations: [],
            roomingPassengers: []
        };
    }

    const affectedReservations = [];
    const roomingPassengers = [];

    for (const reservation of reservations) {
        const passengers = Array.isArray(reservation?.pasajeros)
            ? reservation.pasajeros
            : [];
        let reservationIsAffected = false;

        for (const passenger of passengers) {
            if (parseDateKey(passenger?.estadia?.ingreso) !== selectedDateKey) {
                continue;
            }

            reservationIsAffected = true;
            roomingPassengers.push(passenger);
        }

        if (reservationIsAffected) {
            affectedReservations.push(reservation);
        }
    }

    return {
        affectedReservations,
        roomingPassengers
    };
}


if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        selectOutputRecords
    };
}
