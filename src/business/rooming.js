/**
 * Construccion del Rooming.
 *
 * Este modulo organiza habitaciones ya procesadas. No asigna habitaciones,
 * redistribuye pasajeros ni decide disposicion de camas.
 */


function buildRooming(reservas) {

    if (!Array.isArray(reservas)) {
        throw new TypeError(
            "buildRooming espera un array de reservas."
        );
    }

    const habitaciones = [];

    for (const reserva of reservas) {

        if (!Array.isArray(reserva.habitaciones)) {
            continue;
        }

        for (const habitacion of reserva.habitaciones) {

            habitaciones.push({
                voucher: reserva.voucher,

                clasificacion: reserva.clasificacion
                    ? reserva.clasificacion.tipo
                    : null,

                numero: habitacion.numero,

                inventario: habitacion.inventario
                    ? { ...habitacion.inventario }
                    : null,

                capacidad: habitacion.inventario
                    ? habitacion.inventario.capacidad
                    : null,

                pasajeros: Array.isArray(habitacion.pasajeros)
                    ? [...habitacion.pasajeros]
                    : [],

                cantidadPasajeros: Array.isArray(habitacion.pasajeros)
                    ? habitacion.pasajeros.length
                    : 0,

                asignaciones: Array.isArray(habitacion.asignaciones)
                    ? [...habitacion.asignaciones]
                    : []
            });
        }
    }

    return habitaciones;
}


function countRoomingRooms(rooming) {

    if (!Array.isArray(rooming)) {
        throw new TypeError(
            "countRoomingRooms espera un array."
        );
    }

    return rooming.length;
}


function getRoomsByVoucher(rooming, voucher) {

    if (!Array.isArray(rooming)) {
        throw new TypeError(
            "getRoomsByVoucher espera un array."
        );
    }

    return rooming.filter(
        room => room.voucher === voucher
    );
}


function getRoomsByPassenger(rooming, numeroDocumento) {

    if (!Array.isArray(rooming)) {
        throw new TypeError(
            "getRoomsByPassenger espera un array."
        );
    }

    return rooming.filter(room =>
        room.pasajeros.some(
            pasajero =>
                pasajero.pax &&
                pasajero.pax.numeroDocumento === numeroDocumento
        )
    );
}


if (typeof module !== "undefined" && module.exports) {

    module.exports = {
        buildRooming,
        countRoomingRooms,
        getRoomsByVoucher,
        getRoomsByPassenger
    };
}
