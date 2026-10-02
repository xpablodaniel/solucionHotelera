/**
 * Consultas sobre relaciones ya construidas por responsable.
 *
 * Este módulo no procesa reservas ni vuelve a buscar pasajeros.
 */

const {
    normalizeNonEmptyString
} = require("../normalizer/textNormalization");

const normalizeQueryDni = normalizeNonEmptyString;

function emptyRelationship(dni) {

    return {
        responsableDni: dni,
        vouchers: [],
        cantidadVouchers: 0
    };
}


function findRelatedReservationsByDni(relations, dni) {

    const normalizedDni = normalizeQueryDni(dni);
    const index = relations && relations.indexByResponsibleDni;

    if (
        !index ||
        typeof index !== "object" ||
        normalizedDni === null ||
        !Object.prototype.hasOwnProperty.call(index, normalizedDni)
    ) {
        return emptyRelationship(normalizedDni);
    }

    return index[normalizedDni];
}


if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        findRelatedReservationsByDni
    };
}