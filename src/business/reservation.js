const {
    getRoom
} = require("../hotel/rooms");


/**
 * Agrupa registros por número de voucher.
 *
 * Una fila del CSV representa un PAX,
 * pero varias filas pueden pertenecer
 * a una misma reserva.
 */
function groupByVoucher(records) {

    if (!Array.isArray(records)) {
        throw new TypeError(
            "groupByVoucher espera un array de registros."
        );
    }

    const reservations = new Map();

    for (const record of records) {

        const voucher = record.voucher;

        if (!voucher) {
            continue;
        }

        if (!reservations.has(voucher)) {

            reservations.set(voucher, {
                voucher,
                pasajeros: []
            });
        }

        reservations
            .get(voucher)
            .pasajeros
            .push(record);
    }

    return Array.from(reservations.values());
}


if (typeof module !== "undefined" && module.exports) {

    module.exports = {
        groupByVoucher
    };
}
/**
 * Agrupa los registros de una reserva por número de habitación.
 *
 * IMPORTANTE:
 * La asignación A/B/C se conserva únicamente como dato
 * operativo cuando corresponde a un contingente.
 *
 * Las letras NO representan habitaciones diferentes.
 *
 * Ejemplo de contingente:
 *
 * 238 A → GOMEZ
 * 238 B → ALBA
 * 238 C → INES
 *
 * Resultado:
 *
 * habitación 238
 * ├── 3 pasajeros
 * └── asignaciones A, B, C
 */
function groupByRoom(records, esContingente = false) {

    if (!Array.isArray(records)) {
        throw new TypeError(
            "groupByRoom espera un array de registros."
        );
    }

    const rooms = new Map();

    for (const record of records) {

        if (!record.habitacion) {
            continue;
        }

        const numero = record.habitacion.numero;

        if (!numero) {
            continue;
        }

        if (!rooms.has(numero)) {

            rooms.set(numero, {
                numero,

                inventario: getRoom(numero),

                capacidad: record.plazas
                    ? record.plazas.cantidad
                    : null,

                ocupadasInformadas: record.plazas
                    ? record.plazas.ocupadas
                    : null,

                pasajeros: [],
                asignaciones: []
            });
        }

        const room = rooms.get(numero);

        room.pasajeros.push(record);

        /*
         * La asignación A/B/C solamente tiene
         * significado para contingentes.
         */
        if (
            esContingente &&
            record.habitacion.asignacion
        ) {
            room.asignaciones.push(
                record.habitacion.asignacion
            );
        }
    }

    return Array.from(rooms.values());
}

if (typeof module !== "undefined" && module.exports) {

    module.exports = {
        groupByVoucher,
        groupByRoom
    };
}