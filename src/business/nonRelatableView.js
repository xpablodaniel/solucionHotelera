/**
 * Proyección de solo lectura de reservas no relacionables.
 *
 * Combina las colecciones que buildResponsibleRelationships() ya produce
 * (orphanReservations e ignoredReservations) en una única vista
 * para auditoría de calidad de datos.
 *
 * Este módulo NO procesa reservas ni decide motivos:
 * solo traduce el motivo declarado por el motor a una etiqueta
 * legible para recepción.
 */

const MOTIVO_LABELS = Object.freeze({
    sinTitularValido: "Sin titular identificable",
    dniResponsableNoDisponible: "Titular sin documento"
});

const FALLBACK_LABEL = "Motivo no reconocido";


function toRow(entry) {

    const motivo = entry && typeof entry === "object"
        ? entry.motivo
        : null;

    return {
        voucher: entry && entry.voucher !== undefined && entry.voucher !== null
            ? entry.voucher
            : "—",
        etiqueta: Object.prototype.hasOwnProperty.call(MOTIVO_LABELS, motivo)
            ? MOTIVO_LABELS[motivo]
            : FALLBACK_LABEL
    };
}


/**
 * Construye la vista de reservas no relacionables.
 *
 * El resultado conserva una fila por reserva no relacionable,
 * primero las huérfanas y luego las ignoradas, en el orden
 * original de cada colección.
 * No expone referencias a las colecciones originales.
 *
 * @returns {{
 *   cantidad: number,
 *   filas: Array<{
 *     voucher: string,
 *     etiqueta: string
 *   }>
 * }}
 */
function buildNonRelatableView(relationships) {

    const orphans = relationships && Array.isArray(relationships.orphanReservations)
        ? relationships.orphanReservations
        : [];
    const ignored = relationships && Array.isArray(relationships.ignoredReservations)
        ? relationships.ignoredReservations
        : [];

    const filas = [
        ...orphans.map(toRow),
        ...ignored.map(toRow)
    ];

    return {
        cantidad: filas.length,
        filas
    };
}


if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        buildNonRelatableView
    };
}
