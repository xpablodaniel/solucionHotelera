const {
    findRelatedReservationsByDni
} = require("./responsibleQueries");


function normalizeProjectionValue(value) {

    return value === undefined || value === null || value === ""
        ? null
        : value;
}


function projectUniformValues(passengers, selector) {

    const values = [...new Set(
        passengers.map(selector).map(normalizeProjectionValue)
    )];
    const uniforme = values.length === 1;

    return {
        uniforme,
        valor: uniforme ? values[0] : null,
        valores: values
    };
}


/**
 * Proyecta una reserva para consumo externo sin exponer referencias mutables.
 */
function projectResponsibleReservationDetail(
    reservas,
    reservaIndex,
    responsableDni
) {

    if (
        !Array.isArray(reservas) ||
        !Number.isInteger(reservaIndex) ||
        reservaIndex < 0 ||
        reservaIndex >= reservas.length ||
        !reservas[reservaIndex] ||
        typeof reservas[reservaIndex] !== "object"
    ) {
        return null;
    }

    const reserva = reservas[reservaIndex];
    const pasajeros = Array.isArray(reserva.pasajeros)
        ? reserva.pasajeros
        : [];
    const habitaciones = Array.isArray(reserva.habitaciones)
        ? reserva.habitaciones
        : [];

    return {
        voucher: reserva.voucher ?? null,
        responsableDni,
        alojamiento: habitaciones.length > 0
            ? habitaciones[0].alojamiento ?? null
            : null,
        habitaciones: habitaciones.map(habitacion => ({
            alojamiento: habitacion.alojamiento ?? null,
            numero: habitacion.numero ?? null,
            capacidad: habitacion.capacidad ?? null,
            ocupadasInformadas: habitacion.ocupadasInformadas ?? null
        })),
        fechaIngreso: projectUniformValues(
            pasajeros,
            pasajero => pasajero?.estadia?.ingreso
        ),
        fechaEgreso: projectUniformValues(
            pasajeros,
            pasajero => pasajero?.estadia?.egreso
        ),
        cantidadPasajeros: reserva.cantidadPasajeros ?? pasajeros.length,
        clasificacion: reserva.clasificacion
            ? {
                tipo: reserva.clasificacion.tipo ?? null,
                consistente: reserva.clasificacion.consistente ?? null,
                advertencias: Array.isArray(reserva.clasificacion.advertencias)
                    ? [...reserva.clasificacion.advertencias]
                    : []
            }
            : null,
        servicios: projectUniformValues(
            pasajeros,
            pasajero => pasajero?.servicios
        )
    };
}


/**
 * Construye un detalle seguro para consumo externo.
 */
function snapshotReservation(reservas, reservaIndex, responsableDni) {

    return projectResponsibleReservationDetail(
        reservas,
        reservaIndex,
        responsableDni
    );
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
                viewEntry.detalle = snapshotReservation(
                    reservas,
                    voucherEntry.reservaIndex,
                    relationship.responsableDni
                );
            }

            return viewEntry;
        })
    };
}


if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        buildResponsibleRelationsView,
        projectResponsibleReservationDetail
    };
}