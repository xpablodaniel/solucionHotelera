function parseDatePart(value) {

    if (typeof value !== "string") {
        return null;
    }

    const match = value.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

    if (!match) {
        return null;
    }

    const day = Number.parseInt(match[1], 10);
    const month = Number.parseInt(match[2], 10);
    const year = Number.parseInt(match[3], 10);
    const date = new Date(Date.UTC(year, month - 1, day));

    if (
        date.getUTCFullYear() !== year ||
        date.getUTCMonth() !== month - 1 ||
        date.getUTCDate() !== day
    ) {
        return null;
    }

    return date;
}


function calculateStayDays(ingreso, egreso) {

    const start = parseDatePart(ingreso);
    const end = parseDatePart(egreso);

    if (!start || !end) {
        return null;
    }

    const millisecondsPerDay = 24 * 60 * 60 * 1000;

    return Math.round(
        (end.getTime() - start.getTime()) / millisecondsPerDay
    );
}


function compareDocuments(passengerA, passengerB) {

    const documentA = Number.parseInt(
        passengerA && passengerA.pax
            ? passengerA.pax.numeroDocumento
            : null,
        10
    );

    const documentB = Number.parseInt(
        passengerB && passengerB.pax
            ? passengerB.pax.numeroDocumento
            : null,
        10
    );

    return (Number.isNaN(documentA) ? 0 : documentA) -
        (Number.isNaN(documentB) ? 0 : documentB);
}


function getRoomNumber(passenger) {

    return passenger && passenger.habitacion
        ? passenger.habitacion.numero
        : null;
}


function getStayDays(passengers) {

    const days = passengers
        .map(passenger => {
            const estadia = passenger && passenger.estadia;

            return estadia
                ? calculateStayDays(estadia.ingreso, estadia.egreso)
                : null;
        })
        .filter(value => value !== null);

    return days.length > 0 ? Math.max(...days) : null;
}


function buildVoucherReport(reservas, mode) {

    if (!Array.isArray(reservas)) {
        throw new TypeError(
            "buildVoucherReport espera un array de reservas."
        );
    }

    if (mode !== "MAP" && mode !== "PC") {
        throw new Error(
            "buildVoucherReport espera el modo MAP o PC."
        );
    }

    const mealMultiplier = mode === "PC" ? 2 : 1;

    const reportes = reservas
        .filter(reserva => reserva && reserva.voucher)
        .map(reserva => {

            const pasajerosOriginales = Array.isArray(reserva.pasajeros)
                ? [...reserva.pasajeros]
                : [];
            const pasajeros = [...pasajerosOriginales]
                .sort(compareDocuments);

            const representative = pasajeros[0] || {};
            const representativePax = representative.pax || {};
            const representativeStay = representative.estadia || {};
            const rooms = Array.from(
                new Set(
                    pasajerosOriginales
                        .map(getRoomNumber)
                        .filter(Boolean)
                )
            );
            const diasEstadia = getStayDays(pasajeros);

            return {
                voucher: reserva.voucher,
                representante: representativePax.nombre || null,
                dni: representativePax.numeroDocumento || null,
                hotel: representative.hotel || null,
                fechaIngreso: representativeStay.ingreso || null,
                fechaEgreso: representativeStay.egreso || null,
                habitaciones: rooms,
                cantidadPasajeros: pasajeros.length,
                diasEstadia,
                cantidadComidas: diasEstadia === null
                    ? null
                    : pasajeros.length * diasEstadia * mealMultiplier,
                modo: mode
            };
        });

    reportes.sort((reporteA, reporteB) => {

        const roomA = Number.parseInt(reporteA.habitaciones[0], 10);
        const roomB = Number.parseInt(reporteB.habitaciones[0], 10);
        const minRoomA = Number.isNaN(roomA) ? Infinity : roomA;
        const minRoomB = Number.isNaN(roomB) ? Infinity : roomB;

        return minRoomA - minRoomB;
    });

    return reportes;
}


if (typeof module !== "undefined" && module.exports) {

    module.exports = {
        buildVoucherReport,
        calculateStayDays
    };
}