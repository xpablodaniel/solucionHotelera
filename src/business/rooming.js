const {
    getBedConfiguration
} = require("./bedConfiguration");


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


function calculateRoomOccupancy(room) {

    if (!room || typeof room !== "object") {
        throw new TypeError(
            "calculateRoomOccupancy espera una habitación."
        );
    }

    const capacidad = Number.isFinite(room.capacidad)
        ? room.capacidad
        : null;

    const cantidadPasajeros = Number.isFinite(room.cantidadPasajeros)
        ? room.cantidadPasajeros
        : 0;

    if (capacidad === null) {
        return {
            capacidad: null,
            cantidadPasajeros,
            plazasLibres: null,
            porcentajeOcupacion: null,
            estado: "CAPACIDAD_DESCONOCIDA"
        };
    }

    const plazasLibres = capacidad - cantidadPasajeros;

    const porcentajeOcupacion = capacidad > 0
        ? (cantidadPasajeros / capacidad) * 100
        : null;

    let estado;

    if (capacidad <= 0) {
        estado = "CAPACIDAD_INVALIDA";
    } else if (cantidadPasajeros > capacidad) {
        estado = "CAPACIDAD_SUPERADA";
    } else {
        estado = "OK";
    }

    return {
        capacidad,
        cantidadPasajeros,
        plazasLibres,
        porcentajeOcupacion,
        estado
    };
}


function attachBedConfiguration(rooming) {

    if (!Array.isArray(rooming)) {
        throw new TypeError(
            "attachBedConfiguration espera un array de habitaciones."
        );
    }

    return rooming.map(room => {

        const codigoTipo = room.inventario
            ? room.inventario.codigoTipo
            : null;

        const configuracion = getBedConfiguration(codigoTipo);
        const ocupacion = calculateRoomOccupancy(room);

        return {
            ...room,

            pasajeros: Array.isArray(room.pasajeros)
                ? [...room.pasajeros]
                : [],

            asignaciones: Array.isArray(room.asignaciones)
                ? [...room.asignaciones]
                : [],

            configuracionCamas: {
                codigoTipo: configuracion.codigoTipo,
                camas: configuracion.camas.map(cama => ({ ...cama }))
            },

            ocupacion: {
                plazasLibres: ocupacion.plazasLibres,
                porcentaje: ocupacion.porcentajeOcupacion,
                estado: ocupacion.estado
            }
        };
    });
}


if (typeof module !== "undefined" && module.exports) {

    module.exports = {
        buildRooming,
        countRoomingRooms,
        getRoomsByVoucher,
        getRoomsByPassenger,
        calculateRoomOccupancy,
        attachBedConfiguration
    };
}
