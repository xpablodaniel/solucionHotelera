const {
    buildResponsibleRelationsView
} = require("./responsibleRelationsConsumer");

const {
    normalizeNonEmptyString
} = require("../normalizer/textNormalization");

const {
    parseDateKey
} = require("../normalizer/dateKeys");


function getDateExtreme(vouchers, field, direction) {

    const dates = [];

    for (const voucher of vouchers) {
        const values = voucher[field]?.valores;

        if (!Array.isArray(values) || values.length === 0) {
            return null;
        }

        for (const value of values) {
            const key = parseDateKey(value);

            if (key === null) {
                return null;
            }

            dates.push({ value, key });
        }
    }

    if (dates.length === 0) {
        return null;
    }

    const extreme = dates.reduce((selected, candidate) => {
        const isMoreExtreme = direction === "minimum"
            ? candidate.key < selected.key
            : candidate.key > selected.key;

        return isMoreExtreme ? candidate : selected;
    });

    return extreme.value;
}


/**
 * Construye una vista consolidada de solo lectura para un DNI.
 *
 * El resultado conserva un elemento por voucher y su reservaIndex original.
 * totalPaxRegistrados suma los pasajeros de esos vouchers sin deduplicar;
 * documentosDistintos cuenta los números de documento informados, no vacíos.
 * Fechas y servicios conservan la proyección uniforme/divergente de UI 2.
 * Los extremos de fecha son null si falta o no se reconoce algún valor
 * necesario para calcular el mínimo o máximo correspondiente.
 * No infiere relaciones ni interpreta coincidencias entre vouchers.
 *
 * @returns {{
 *   responsableDni: (string|null),
 *   cantidadVouchers: number,
 *   totalPaxRegistrados: number,
 *   documentosDistintos: number,
 *   alojamientos: string[],
 *   extremosFechas: {
 *     ingresoMinimo: (string|null),
 *     egresoMaximo: (string|null)
 *   },
 *   vouchers: Array<{
 *     voucher: (string|null),
 *     reservaIndex: number,
 *     alojamiento: (string|null),
 *     habitaciones: string[],
 *     fechaIngreso: (object|null),
 *     fechaEgreso: (object|null),
 *     cantidadPasajeros: number,
 *     clasificacion: (object|null),
 *     servicios: (object|null)
 *   }>
 * }}
 */
function buildResponsibleRelationsAggregateView(relations, dni, reservas) {

    const relationView = buildResponsibleRelationsView(
        relations,
        dni,
        reservas,
        { includeDetail: true }
    );
    const documents = new Set();
    const accommodations = new Map();
    let totalPaxRegistrados = 0;

    const vouchers = relationView.vouchers.map(voucher => {
        const reserva = Array.isArray(reservas)
            ? reservas[voucher.reservaIndex]
            : null;
        const pasajeros = Array.isArray(reserva?.pasajeros)
            ? reserva.pasajeros
            : [];
        const detalle = voucher.detalle;

        totalPaxRegistrados += pasajeros.length;

        for (const pasajero of pasajeros) {
            const document = normalizeNonEmptyString(
                pasajero?.pax?.numeroDocumento
            );

            if (document !== null) {
                documents.add(document);
            }
        }

        const roomAccommodations = Array.isArray(detalle?.habitaciones)
            ? detalle.habitaciones
                .map(room => normalizeNonEmptyString(room?.alojamiento))
                .filter(accommodation => accommodation !== null)
            : [];
        const voucherAccommodations = roomAccommodations.length > 0
            ? roomAccommodations
            : [normalizeNonEmptyString(voucher.alojamiento)].filter(Boolean);

        for (const accommodation of voucherAccommodations) {
            if (!accommodations.has(accommodation)) {
                accommodations.set(accommodation, accommodation);
            }
        }

        return {
            voucher: voucher.voucher,
            reservaIndex: voucher.reservaIndex,
            alojamiento: voucher.alojamiento,
            habitaciones: [...voucher.habitaciones],
            fechaIngreso: detalle?.fechaIngreso ?? null,
            fechaEgreso: detalle?.fechaEgreso ?? null,
            cantidadPasajeros: detalle?.cantidadPasajeros ?? pasajeros.length,
            clasificacion: detalle?.clasificacion ?? null,
            servicios: detalle?.servicios ?? null
        };
    });

    return {
        responsableDni: relationView.responsableDni,
        cantidadVouchers: relationView.cantidadVouchers,
        totalPaxRegistrados,
        documentosDistintos: documents.size,
        alojamientos: [...accommodations.values()],
        extremosFechas: {
            ingresoMinimo: getDateExtreme(vouchers, "fechaIngreso", "minimum"),
            egresoMaximo: getDateExtreme(vouchers, "fechaEgreso", "maximum")
        },
        vouchers
    };
}


if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        buildResponsibleRelationsAggregateView
    };
}