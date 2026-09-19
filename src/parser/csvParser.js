/**
 * Parser inicial de Solucion Hotel Tools
 *
 * Responsabilidad:
 * - Recibir una fila CSV ya separada en columnas.
 * - Convertir sus valores a un objeto estructurado.
 * - Normalizar datos básicos.
 * - Separar número de habitación y asignación.
 *
 * IMPORTANTE:
 * Este módulo NO agrupa reservas.
 * Este módulo NO determina titulares.
 * Este módulo NO aplica reglas de comidas.
 * Este módulo NO interpreta contingentes.
 */

/**
 * Limpia un valor de texto.
 */
function cleanText(value) {
    if (value === undefined || value === null) {
        return null;
    }

    const text = String(value).trim();

    return text === "" ? null : text;
}


/**
 * Convierte un valor a número entero.
 *
 * Si no puede convertirse, devuelve null.
 */
function parseInteger(value) {
    const text = cleanText(value);

    if (text === null) {
        return null;
    }

    const number = Number.parseInt(text, 10);

    return Number.isNaN(number) ? null : number;
}


/**
 * Analiza el campo de habitación.
 *
 * Ejemplos:
 *
 * "238"   → habitación 238
 * "238 A" → habitación 238 / asignación A
 * "238 B" → habitación 238 / asignación B
 */
function parseRoom(value) {
    const original = cleanText(value);

    if (original === null) {
        return {
            original: null,
            numero: null,
            asignacion: null
        };
    }

    const match = original.match(/^(\d+)\s*([A-Za-z])?$/);

    if (!match) {
        return {
            original,
            numero: original,
            asignacion: null
        };
    }

    return {
        original,
        numero: match[1],
        asignacion: match[2]
            ? match[2].toUpperCase()
            : null
    };
}


/**
 * Convierte una fila del CSV en un objeto estructurado.
 *
 * La fila debe respetar el orden de las 28 columnas
 * definido por el gestor de reservas.
 */
function parseRow(fields) {

    if (!Array.isArray(fields)) {
        throw new TypeError("parseRow espera un array de columnas.");
    }

    if (fields.length !== 28) {
        throw new Error(
            `Cantidad de columnas inesperada: ${fields.length}. ` +
            `Se esperaban 28.`
        );
    }

    return {

        alojamiento: cleanText(fields[0]),

        hotel: cleanText(fields[1]),

        habitacion: parseRoom(fields[2]),

        tipoHabitacion: cleanText(fields[3]),

        observacionHabitacion: cleanText(fields[4]),

        plazas: {
            cantidad: parseInteger(fields[5]),
            ocupadas: parseInteger(fields[10])
        },

        voucher: cleanText(fields[6]),

        sede: cleanText(fields[7]),

        estadia: {
            ingreso: cleanText(fields[8]),
            egreso: cleanText(fields[9])
        },

        pax: {
            tipoDocumento: cleanText(fields[11]),
            numeroDocumento: cleanText(fields[12]),
            nombre: cleanText(fields[13]),
            edad: parseInteger(fields[14]),
            fechaNacimiento: cleanText(fields[24])
        },

        entidad: cleanText(fields[15]),

        servicios: cleanText(fields[16]),

        paquete: cleanText(fields[17]),

        transporte: cleanText(fields[18]),

        viaje: {
            fecha: cleanText(fields[19]),
            hora: cleanText(fields[20]),
            parada: cleanText(fields[21])
        },

        contacto: {
            email: cleanText(fields[22]),
            telefono: cleanText(fields[25]),
            celular: cleanText(fields[26])
        },

        estado: cleanText(fields[23]),

        usuario: cleanText(fields[27])
    };
}


/**
 * Lee un CSV completo.
 *
 * Primera versión:
 * - La primera línea se considera cabecera.
 * - Las siguientes líneas son registros.
 * - Cada registro debe contener 28 columnas.
 *
 * IMPORTANTE:
 * Esta primera versión utiliza split(",").
 * Todavía no maneja correctamente comas
 * dentro de campos entrecomillados.
 */
function parseCSV(csvText) {

    if (typeof csvText !== "string") {
        throw new TypeError(
            "parseCSV espera un texto CSV."
        );
    }

    const lines = csvText
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(line => line !== "");

    if (lines.length === 0) {
        return [];
    }

    // Primera línea: cabecera
    const header = lines[0].split(",");

    // Las restantes son registros
    const dataRows = lines.slice(1);

    return dataRows
        .map(line => line.split(","))
        .filter(fields => fields.length === 28)
        .map(fields => parseRow(fields));
}
// Exportación para Node.js / pruebas
if (typeof module !== "undefined" && module.exports) {
    module.exports = {
    cleanText,
    parseInteger,
    parseRoom,
    parseRow,
    parseCSV
};
}