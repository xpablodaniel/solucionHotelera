/**
 * Clave numérica comparable para fechas de texto.
 *
 * Formatos reconocidos:
 *   dd/mm/aaaa  (formato de origen de los CSV)
 *   aaaa-mm-dd  (formato ISO)
 *
 * Semántica estricta:
 *   devuelve el timestamp UTC del día, o null si el texto
 *   no coincide con un formato soportado o la fecha no existe
 *   en el calendario (p. ej. 31/02/2025).
 *
 * No infiere ni completa fechas: solo reconoce las ya escritas.
 */

function parseDateKey(value) {

    if (typeof value !== "string") {
        return null;
    }

    const text = value.trim();
    const dayFirst = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);

    if (!dayFirst && !iso) {
        return null;
    }

    const year = Number(dayFirst ? dayFirst[3] : iso[1]);
    const month = Number(dayFirst ? dayFirst[2] : iso[2]);
    const day = Number(dayFirst ? dayFirst[1] : iso[3]);
    const timestamp = Date.UTC(year, month - 1, day);
    const parsed = new Date(timestamp);

    if (
        parsed.getUTCFullYear() !== year ||
        parsed.getUTCMonth() !== month - 1 ||
        parsed.getUTCDate() !== day
    ) {
        return null;
    }

    return timestamp;
}


if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        parseDateKey
    };
}
