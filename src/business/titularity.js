/**
 * Contrato común de titularidad de una reserva.
 *
 * La titularidad solo se confirma mediante una marca explícita y única
 * pax.esTitular === true. El orden del CSV, la edad, el DNI y el parentesco
 * nunca se utilizan para inferirla.
 */
function resolveTitularidad(pasajeros) {
    const lista = Array.isArray(pasajeros) ? pasajeros : [];
    const marcados = lista.filter(pasajero => pasajero?.pax?.esTitular === true);

    if (marcados.length === 1) {
        return {
            estado: "confirmada",
            pasajero: marcados[0],
            origen: "marca_explicita"
        };
    }

    if (marcados.length > 1) {
        return {
            estado: "ambigua",
            pasajero: null,
            origen: "marcas_multiples"
        };
    }

    return {
        estado: "pendiente",
        pasajero: null,
        origen: null
    };
}

function getTitularidad(reserva) {
    if (!reserva || typeof reserva !== "object") {
        return resolveTitularidad([]);
    }

    if (reserva.titularidad && typeof reserva.titularidad === "object") {
        const { estado, pasajero, origen } = reserva.titularidad;
        if (["confirmada", "pendiente", "ambigua"].includes(estado)) {
            const pasajeros = Array.isArray(reserva.pasajeros) ? reserva.pasajeros : [];
            if (estado === "confirmada" && (!pasajero || !pasajeros.includes(pasajero))) {
                return { estado: "ambigua", pasajero: null, origen: "referencia_no_pertenece_a_reserva" };
            }
            return {
                estado,
                pasajero: estado === "confirmada" ? pasajero : null,
                origen: origen ?? null
            };
        }
    }

    return resolveTitularidad(reserva.pasajeros);
}

module.exports = {
    resolveTitularidad,
    getTitularidad
};
