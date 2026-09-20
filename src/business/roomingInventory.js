/**
 * Validacion del Rooming contra el inventario fisico.
 *
 * Este modulo valida capacidad y no asigna habitaciones, redistribuye
 * pasajeros, asigna camas ni fusiona reservas.
 */


/**
 * Valida las habitaciones del Rooming contra su capacidad fisica.
 */
function validateRoomingInventory(rooming) {

    if (!Array.isArray(rooming)) {

        throw new TypeError(
            "validateRoomingInventory espera un array."
        );
    }


    return rooming.map(room => {

        const capacidad =
            Number.isFinite(room.capacidad)
                ? room.capacidad
                : null;


        const pasajeros =
            Array.isArray(room.pasajeros)
                ? room.pasajeros
                : [];


        const cantidadPasajeros = pasajeros.length;


        if (capacidad === null) {

            return {
                ...room,

                cantidadPasajeros,

                plazasLibres: null,

                estado: "CAPACIDAD_DESCONOCIDA"
            };
        }


        const plazasLibres = capacidad - cantidadPasajeros;


        let estado;


        if (capacidad <= 0) {

            estado = "CAPACIDAD_INVALIDA";

        } else if (cantidadPasajeros > capacidad) {

            estado = "CAPACIDAD_SUPERADA";

        } else {

            estado = "OK";
        }


        return {
            ...room,

            cantidadPasajeros,

            plazasLibres,

            estado
        };
    });
}


if (typeof module !== "undefined" && module.exports) {

    module.exports = {
        validateRoomingInventory
    };
}
