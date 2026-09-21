/**
 * Inventario fisico de habitaciones.
 *
 * Este modulo representa habitaciones y su capacidad. No asigna pasajeros,
 * no modifica el Rooming y no decide que habitacion corresponde a una reserva.
 */

const {
    ROOM_TYPES: BED_ROOM_TYPES,
    getBedConfiguration
} = require("./bedConfiguration");


const ROOM_TYPES = Object.fromEntries(
    Object.entries(BED_ROOM_TYPES).map(([codigo, configuracion]) => [
        codigo,
        {
            nombre: configuracion.tipo,
            capacidad: configuracion.capacidad
        }
    ])
);


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


    const configuracion = getBedConfiguration(codigo);


    return {
        numero: String(numero),
        codigo,
        tipo: configuracion.tipo,
        capacidad: configuracion.capacidad,
        camas: configuracion.camas
    };
}


if (typeof module !== "undefined" && module.exports) {

    module.exports = {
        ROOM_TYPES,
        createRoom
    };
}
