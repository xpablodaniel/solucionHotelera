/**
 * Gestion de unidades de consumo.
 *
 * Una unidad de consumo representa a uno o varios pasajeros que comparten
 * sus consumos. Este modulo no determina parentescos ni modifica reservas.
 * Inicialmente, cada voucher constituye una unidad de consumo.
 */


/**
 * Construye las unidades de consumo a partir de reservas.
 */
function buildConsumptionGroups(reservas) {

    if (!Array.isArray(reservas)) {

        throw new TypeError(
            "buildConsumptionGroups espera un array de reservas."
        );
    }


    return reservas.map(reserva => {

        const pasajeros =
            Array.isArray(reserva.pasajeros)
                ? [...reserva.pasajeros]
                : [];


        return {

            voucher: reserva.voucher ?? null,

            pasajeros,

            cantidadPasajeros: pasajeros.length,

            responsable: null
        };
    });
}


/**
 * Devuelve una unidad con responsable sin modificar la original.
 */
function setConsumptionResponsible(unidad, responsable) {

    if (!unidad || typeof unidad !== "object") {

        throw new TypeError(
            "La unidad de consumo debe ser un objeto."
        );
    }


    return {

        ...unidad,

        responsable
    };
}


if (typeof module !== "undefined" && module.exports) {

    module.exports = {
        buildConsumptionGroups,
        setConsumptionResponsible
    };
}
