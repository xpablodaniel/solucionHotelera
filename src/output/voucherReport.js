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


function getRoom(passenger) {

    const habitacion = passenger && passenger.habitacion;
    const numero = habitacion ? habitacion.numero : null;

    if (!numero) {
        return null;
    }

    return {
        alojamiento: habitacion.alojamiento ??
            passenger.alojamiento ?? null,
        numero
    };
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


const { getTitularidad } = require("../business/titularity");

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
            const titularidad = getTitularidad(reserva);
            const representative = titularidad.estado === "confirmada"
                ? titularidad.pasajero
                : null;
            const representativePax = representative?.pax || {};
            const hasReservationMetadata = passenger => Boolean(
                passenger?.estadia?.ingreso || passenger?.estadia?.egreso || passenger?.hotel
            );
            const metadataRepresentative = representative && hasReservationMetadata(representative)
                ? representative
                : pasajerosOriginales.find(hasReservationMetadata) || representative || {};
            const metadataStay = metadataRepresentative.estadia || {};
            const roomsByIdentity = new Map();

            for (const passenger of pasajerosOriginales) {

                const room = getRoom(passenger);

                if (!room) {
                    continue;
                }

                const identity = JSON.stringify([
                    room.alojamiento,
                    String(room.numero)
                ]);

                if (!roomsByIdentity.has(identity)) {
                    roomsByIdentity.set(identity, room);
                }
            }

            const rooms = Array.from(roomsByIdentity.values());
            const diasEstadia = getStayDays(pasajerosOriginales);

            return {
                voucher: reserva.voucher,
                titularidad: { estado: titularidad.estado, origen: titularidad.origen },
                representante: representativePax.nombre || null,
                dni: representativePax.numeroDocumento ?? "",
                hotel: metadataRepresentative.hotel || null,
                fechaIngreso: metadataStay.ingreso || null,
                fechaEgreso: metadataStay.egreso || null,
                habitaciones: rooms.map(room => room.numero),
                habitacionesDetalladas: rooms,
                cantidadPasajeros: pasajerosOriginales.length,
                diasEstadia,
                cantidadComidas: diasEstadia === null
                    ? null
                    : pasajerosOriginales.length * diasEstadia * mealMultiplier,
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