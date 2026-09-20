/**
 * Inventario fisico de habitaciones.
 *
 * Este modulo representa habitaciones y su capacidad. No asigna pasajeros,
 * no modifica el Rooming y no decide que habitacion corresponde a una reserva.
 */

const ROOM_TYPES = {

    II: {
        nombre: "DOBLE INDIVIDUAL",
        capacidad: 2
    },

    X: {
        nombre: "DOBLE MATRIMONIAL",
        capacidad: 2
    },

    III: {
        nombre: "TRIPLE INDIVIDUAL",
        capacidad: 3
    },

    XI: {
        nombre: "TRIPLE MATRIMONIAL",
        capacidad: 3
    },

    XII: {
        nombre: "CUADRUPLE",
        capacidad: 4
    }
};


function createRoom(numero, codigo) {

    if (!numero) {
        throw new TypeError(
            "La habitacion debe tener numero."
        );
    }


    if (!ROOM_TYPES[codigo]) {
        throw new TypeError(
            `Codigo de habitacion desconocido: ${codigo}`
        );
    }


    const tipo = ROOM_TYPES[codigo];


    return {
        numero: String(numero),
        codigo,
        tipo: tipo.nombre,
        capacidad: tipo.capacidad
    };
}


if (typeof module !== "undefined" && module.exports) {

    module.exports = {
        ROOM_TYPES,
        createRoom
    };
}
