/**
 * Clasificación de reservas de Solucion Hotel Tools
 *
 * Responsabilidad:
 * - Analizar las señales disponibles en una reserva.
 * - Determinar si existe evidencia de contingente.
 * - Determinar si existe evidencia de reserva individual.
 * - Evitar clasificaciones basadas en una sola columna.
 *
 * IMPORTANTE:
 * Este módulo NO modifica los datos originales.
 * Este módulo NO determina titulares.
 * Este módulo NO agrupa pasajeros.
 * Este módulo NO calcula comidas.
 */


// ---------------------------------------------------------
// Normalización para comparación
// ---------------------------------------------------------

function normalizeText(value) {

    if (value === undefined || value === null) {
        return "";
    }

    return String(value)
        .trim()
        .toUpperCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}


// ---------------------------------------------------------
// Detección de transporte
// ---------------------------------------------------------

function hasTransport(record) {

    const transporte = normalizeText(
        record?.transporte
    );

    if (!transporte) {
        return false;
    }

    return !(
        transporte === "SIN TRANSPORTE" ||
        transporte === "SIN TRANSPORTE "
    );
}


// ---------------------------------------------------------
// Detección de servicios asociados a contingentes
// ---------------------------------------------------------

function hasFullBoard(record) {

    const servicios = normalizeText(
        record?.servicios
    );

    return servicios.includes("PENSION COMPLETA");
}


function hasLunchAndDinner(record) {

    const servicios = normalizeText(
        record?.servicios
    );

    return (
        servicios.includes("ALMUERZO Y CENA") ||
        servicios.includes("ALMUERZO-CENA") ||
        servicios.includes("ALMUERZO - CENA")
    );
}


// ---------------------------------------------------------
// Detección de paquete de contingente
// ---------------------------------------------------------

function hasGroupPackage(record) {

    const paquete = normalizeText(
        record?.paquete
    );

    if (!paquete) {
        return false;
    }

    return (
        paquete.includes("PPJ") ||
        paquete.includes("EGRESADO") ||
        paquete.includes("JUEGOS BONAERENSES")
    );
}


// ---------------------------------------------------------
// Análisis de evidencias
// ---------------------------------------------------------

function analyzeRecord(record) {

    if (!record || typeof record !== "object") {
        throw new TypeError(
            "analyzeRecord espera un registro."
        );
    }

    const transporte = hasTransport(record);

    const pensionCompleta = hasFullBoard(record);

    const almuerzoCena = hasLunchAndDinner(record);

    const paqueteContingente = hasGroupPackage(record);

    return {

        transporte,

        servicios: {
            pensionCompleta,
            almuerzoCena
        },

        paquete: {
            contingente: paqueteContingente
        }
    };
}


// ---------------------------------------------------------
// Clasificación
// ---------------------------------------------------------

function classifyRecord(record) {

    const evidencias = analyzeRecord(record);
    const transporte = normalizeText(record.transporte);

    const razones = [];

    let puntosContingente = 0;
    let puntosIndividual = 0;


    // Transporte
    if (evidencias.transporte) {

        puntosContingente++;

        razones.push(
            "Tiene transporte"
        );
    }
    else if (transporte === "SIN TRANSPORTE") {

        puntosIndividual++;

        razones.push(
            "Sin transporte"
        );
    }
    else {

        razones.push(
            "Transporte no informado"
        );
    }


    // Servicios
    if (evidencias.servicios.pensionCompleta) {

        puntosContingente++;

        razones.push(
            "Tiene pensión completa"
        );
    }

    if (evidencias.servicios.almuerzoCena) {

        puntosContingente++;

        razones.push(
            "Tiene almuerzo y cena"
        );
    }


    // Paquete
    if (evidencias.paquete.contingente) {

        puntosContingente++;

        razones.push(
            "El paquete contiene indicador de contingente"
        );
    }


    // -----------------------------------------------------
    // Clasificación conservadora
    // -----------------------------------------------------

    let tipo;

    if (
        puntosContingente >= 2 &&
        puntosContingente > puntosIndividual
    ) {

        tipo = "CONTINGENTE";

    }
    else if (
        puntosIndividual > puntosContingente
    ) {

        tipo = "INDIVIDUAL";

    }
    else {

        tipo = "NO_CLASIFICADA";
    }


    return {

        tipo,

        puntos: {
            contingente: puntosContingente,
            individual: puntosIndividual
        },

        razones,

        evidencias
    };
}
/**
 * Clasifica una reserva completa.
 *
 * Una reserva está formada por uno o varios registros
 * que comparten el mismo voucher.
 *
 * La clasificación se realiza a partir de las evidencias
 * encontradas en todos sus registros.
 *
 * Si los registros presentan clasificaciones diferentes,
 * se genera una advertencia.
 */
function classifyReservation(records) {

    if (!Array.isArray(records)) {
        throw new TypeError(
            "classifyReservation espera un array de registros."
        );
    }

    if (records.length === 0) {

        return {
            tipo: "NO_CLASIFICADA",
            consistente: true,
            pasajeros: 0,
            resultados: [],
            advertencias: [
                "La reserva no contiene registros."
            ]
        };
    }


    const resultados = records.map(
        record => classifyRecord(record)
    );


    const tipos = new Set(
        resultados.map(resultado => resultado.tipo)
    );


    const advertencias = [];


    /*
     * Si aparecen diferentes clasificaciones
     * dentro del mismo voucher, la reserva necesita revisión.
     */
    if (tipos.size > 1) {

        advertencias.push(
            "Los pasajeros de la reserva presentan " +
            "clasificaciones diferentes."
        );
    }


    /*
     * Prioridad:
     *
     * CONTINGENTE
     * NO_CLASIFICADA
     * INDIVIDUAL
     *
     * La prioridad evita perder una evidencia fuerte
     * de contingente cuando algún registro está incompleto.
     */
    let tipo;

    if (tipos.has("CONTINGENTE")) {

        tipo = "CONTINGENTE";

    }
    else if (tipos.has("NO_CLASIFICADA")) {

        tipo = "NO_CLASIFICADA";

    }
    else {

        tipo = "INDIVIDUAL";
    }


    return {

        tipo,

        consistente: tipos.size === 1,

        pasajeros: records.length,

        resultados,

        advertencias
    };
}

// ---------------------------------------------------------
// Exportaciones
// ---------------------------------------------------------

if (typeof module !== "undefined" && module.exports) {

    module.exports = {

        normalizeText,
        hasTransport,
        hasFullBoard,
        hasLunchAndDinner,
        hasGroupPackage,
        analyzeRecord,
        classifyRecord,
        classifyReservation
    };
}