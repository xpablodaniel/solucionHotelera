/**
 * Normalización genérica de texto proveniente de datos de origen.
 *
 * Semántica única compartida por las capas de relaciones:
 *   null / undefined → null
 *   cualquier otro valor → String(value).trim()
 *   cadena vacía tras el trim → null
 *
 * No infiere ni transforma contenido: solo normaliza presencia/ausencia.
 */

function normalizeNonEmptyString(value) {

    if (value === undefined || value === null) {
        return null;
    }

    const text = String(value).trim();

    return text === "" ? null : text;
}


if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        normalizeNonEmptyString
    };
}
