/**
 * Relación de vouchers por responsable documental.
 *
 * Regla estricta:
 * Solo se utiliza el DNI de una titularidad explícitamente confirmada.
 *
 * Esta capa NO modifica las reservas originales ni las agrupa por DNI arbitrario.
 * Solo construye una estructura paralela que relaciona vouchers por responsable.
 */

const {
    normalizeNonEmptyString
} = require("../normalizer/textNormalization");

const normalizeResponsibleDni = normalizeNonEmptyString;
const { getTitularidad } = require("./titularity");

function getReservationVoucher(reserva) {
    if (!reserva || typeof reserva !== "object") {
        return null;
    }

    return reserva.voucher ?? null;
}


function getResponsibleDni(reserva) {
    const titularidad = getTitularidad(reserva);
    if (titularidad.estado !== "confirmada" || !titularidad.pasajero) {
        return null;
    }

    const pax = titularidad.pasajero.pax;
    return pax && typeof pax === "object"
        ? normalizeResponsibleDni(pax.numeroDocumento)
        : null;
}

function getVoucherRoomSummary(reserva) {
    if (!reserva || typeof reserva !== "object") {
        return {
            alojamiento: null,
            habitaciones: []
        };
    }

    const habitaciones = Array.isArray(reserva.habitaciones)
        ? reserva.habitaciones
        : [];

    const numeros = [];
    const seenNumbers = new Set();
    let alojamiento = null;

    for (const habitacion of habitaciones) {
        if (!habitacion || typeof habitacion !== "object") {
            continue;
        }

        const roomNumber = habitacion.numero;
        const roomAlojamiento = Object.prototype.hasOwnProperty.call(habitacion, "alojamiento")
            ? habitacion.alojamiento ?? null
            : null;

        if (alojamiento === null && roomAlojamiento !== null) {
            alojamiento = roomAlojamiento;
        }

        if (roomNumber === null || roomNumber === undefined || roomNumber === "") {
            continue;
        }

        const roomLabel = String(roomNumber);

        if (!seenNumbers.has(roomLabel)) {
            seenNumbers.add(roomLabel);
            numeros.push(roomLabel);
        }
    }

    return {
        alojamiento,
        habitaciones: numeros
    };
}


function buildResponsibleRelationships(reservas) {
    if (!Array.isArray(reservas)) {
        throw new TypeError(
            "buildResponsibleRelationships espera un array de reservas."
        );
    }

    const indexByResponsibleDni = {};
    const orphanReservations = [];
    const ignoredReservations = [];

    for (const [index, reserva] of reservas.entries()) {
        const voucher = getReservationVoucher(reserva);
        const pasajeros = Array.isArray(reserva && reserva.pasajeros)
            ? reserva.pasajeros
            : [];

        if (!pasajeros.length) {
            orphanReservations.push({
                voucher,
                motivo: "sinTitularValido"
            });
            continue;
        }

        const titularidad = getTitularidad(reserva);
        if (titularidad.estado !== "confirmada" || !titularidad.pasajero) {
            orphanReservations.push({
                voucher,
                motivo: "sinTitularValido"
            });
            continue;
        }

        const pax = titularidad.pasajero.pax || null;
        const dniResponsable = pax && typeof pax === "object"
            ? normalizeResponsibleDni(pax.numeroDocumento)
            : null;

        if (!dniResponsable) {
            ignoredReservations.push({
                voucher,
                motivo: "dniResponsableNoDisponible"
            });
            continue;
        }

        if (!indexByResponsibleDni[dniResponsable]) {
            indexByResponsibleDni[dniResponsable] = {
                responsableDni: dniResponsable,
                vouchers: [],
                cantidadVouchers: 0
            };
        }

        const roomSummary = getVoucherRoomSummary(reserva);
        const voucherEntry = {
            voucher,
            reservaIndex: index,
            alojamiento: roomSummary.alojamiento,
            habitaciones: roomSummary.habitaciones
        };

        const existingVoucher = indexByResponsibleDni[dniResponsable].vouchers
            .some(item => item.voucher === voucher);

        if (!existingVoucher) {
            indexByResponsibleDni[dniResponsable].vouchers.push(voucherEntry);
            indexByResponsibleDni[dniResponsable].cantidadVouchers =
                indexByResponsibleDni[dniResponsable].vouchers.length;
        }
    }

    return {
        indexByResponsibleDni,
        orphanReservations,
        ignoredReservations
    };
}


if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        buildResponsibleRelationships,
        getResponsibleDni,
        normalizeResponsibleDni,
        getVoucherRoomSummary
    };
}
