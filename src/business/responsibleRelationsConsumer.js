const {
    findRelatedReservationsByDni
} = require("./responsibleQueries");


/**
 * Construye un detalle seguro para consumo externo.
 * No expone pasajeros ni referencias mutables de la reserva original.
 */
function snapshotReservation(reserva) {

    if (!reserva || typeof reserva !== "object") {
        return null;
    }

    return {
        voucher: reserva.voucher ?? null,
        cantidadPasajeros: reserva.cantidadPasajeros ?? null,
        clasificacion: reserva.clasificacion
            ? {
                tipo: reserva.clasificacion.tipo ?? null,
                consistente: reserva.clasificacion.consistente ?? null,
                advertencias: Array.isArray(reserva.clasificacion.advertencias)
                    ? [...reserva.clasificacion.advertencias]
                    : []
            }
            : null,
        habitaciones: Array.isArray(reserva.habitaciones)
            ? reserva.habitaciones.map(habitacion => ({
                alojamiento: habitacion.alojamiento ?? null,
                numero: habitacion.numero ?? null,
                capacidad: habitacion.capacidad ?? null,
                ocupadasInformadas: habitacion.ocupadasInformadas ?? null,
                asignaciones: Array.isArray(habitacion.asignaciones)
                    ? [...habitacion.asignaciones]
                    : []
            }))
            : []
    };
}


/**
 * El detalle solo se incluye cuando options.includeDetail es true.
 */
function buildResponsibleRelationsView(
    relations,
    dni,
    reservas,
    options = {}
) {

    const relationship = findRelatedReservationsByDni(relations, dni);
    const includeDetail = options.includeDetail === true;

    return {
        responsableDni: relationship.responsableDni,
        cantidadVouchers: relationship.cantidadVouchers,
        vouchers: relationship.vouchers.map(voucherEntry => {

            const viewEntry = {
                voucher: voucherEntry.voucher,
                alojamiento: voucherEntry.alojamiento,
                habitaciones: [...voucherEntry.habitaciones],
                reservaIndex: voucherEntry.reservaIndex
            };

            if (includeDetail) {
                const reserva = Array.isArray(reservas)
                    ? reservas[voucherEntry.reservaIndex]
                    : null;

                viewEntry.detalle = snapshotReservation(reserva);
            }

            return viewEntry;
        })
    };
}


if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        buildResponsibleRelationsView
    };
}