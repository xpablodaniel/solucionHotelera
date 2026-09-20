/**
 * Procesamiento de reservas de Solucion Hotel Tools
 *
 * Responsabilidad:
 * - Recibir registros ya procesados por el parser.
 * - Agrupar los registros por voucher.
 * - Clasificar cada reserva.
 * - Construir una estructura uniforme para las siguientes capas.
 *
 * IMPORTANTE:
 * Este módulo NO parsea CSV.
 * Este módulo NO modifica registros originales.
 * Este módulo NO determina titulares.
 * Este módulo NO procesa habitaciones.
 * Este módulo NO calcula comidas.
 */


const {
    groupByVoucher,
    groupByRoom
} = require("./reservation");


const {
    classifyReservation
} = require("./classification");


// ---------------------------------------------------------
// Procesar reservas
// ---------------------------------------------------------

function processReservations(records) {

    if (!Array.isArray(records)) {

        throw new TypeError(
            "processReservations espera un array de registros."
        );
    }


    /*
     * Primero agrupamos los registros que pertenecen
     * al mismo voucher.
     */
    const grouped =
        groupByVoucher(records);


    /*
     * Convertimos cada grupo en una reserva estructurada.
     */
    return grouped.map(group => {

        const pasajeros = group.pasajeros;

        const clasificacion =
            classifyReservation(pasajeros);

        const esContingente =
            clasificacion.tipo === "CONTINGENTE";

        const habitaciones =
            groupByRoom(pasajeros, esContingente);


        return {

            voucher: group.voucher,

            pasajeros,

            cantidadPasajeros:
                pasajeros.length,

            clasificacion: {

                tipo: clasificacion.tipo,

                consistente:
                    clasificacion.consistente,

                advertencias:
                    clasificacion.advertencias
            },

            habitaciones
        };
    });
}


// ---------------------------------------------------------
// Exportaciones
// ---------------------------------------------------------

if (typeof module !== "undefined" && module.exports) {

    module.exports = {
        processReservations
    };
}