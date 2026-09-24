function getRoomLabel(passenger) {

    const room = passenger && passenger.habitacion;

    if (!room) {
        return null;
    }

    return room.numero || null;
}


function compareRooms(roomA, roomB) {

    const numberA = Number.parseInt(roomA, 10);
    const numberB = Number.parseInt(roomB, 10);

    if (!Number.isNaN(numberA) && !Number.isNaN(numberB)) {
        return numberA - numberB || roomA.localeCompare(roomB, "es");
    }

    if (!Number.isNaN(numberA)) {
        return -1;
    }

    if (!Number.isNaN(numberB)) {
        return 1;
    }

    return roomA.localeCompare(roomB, "es", { numeric: true });
}


function buildBalnearioVoucherReport(reservas) {

    if (!Array.isArray(reservas)) {
        throw new TypeError(
            "buildBalnearioVoucherReport espera un array de reservas."
        );
    }

    const reportes = reservas
        .filter(reserva => reserva && reserva.voucher)
        .map(reserva => {

            const pasajeros = Array.isArray(reserva.pasajeros)
                ? reserva.pasajeros
                : [];
            const titular = pasajeros[0] || {};
            const titularPax = titular.pax || {};
            const titularStay = titular.estadia || {};
            const habitaciones = Array.from(
                new Set(
                    pasajeros
                        .map(getRoomLabel)
                        .filter(Boolean)
                )
            ).sort(compareRooms);

            return {
                voucher: reserva.voucher,
                titular: {
                    nombre: titularPax.nombre || null,
                    dni: titularPax.numeroDocumento || null
                },
                hotel: titular.hotel || null,
                habitaciones,
                fechaIngreso: titularStay.ingreso || null,
                fechaEgreso: titularStay.egreso || null,
                cantidadPasajeros: pasajeros.length
            };
        });

    reportes.sort((reporteA, reporteB) => {

        const roomA = reporteA.habitaciones[0];
        const roomB = reporteB.habitaciones[0];

        if (!roomA && !roomB) {
            return 0;
        }

        if (!roomA) {
            return 1;
        }

        if (!roomB) {
            return -1;
        }

        return compareRooms(roomA, roomB);
    });

    return reportes;
}


if (typeof module !== "undefined" && module.exports) {

    module.exports = {
        buildBalnearioVoucherReport
    };
}