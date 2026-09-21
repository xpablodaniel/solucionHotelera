/**
 * Validacion del Rooming contra el inventario fisico.
 *
 * Este modulo valida capacidad y no asigna habitaciones, redistribuye
 * pasajeros, asigna camas ni fusiona reservas.
 */


/**
 * Valida las habitaciones del Rooming contra su capacidad fisica.
 */
function validateRoomingInventory(rooming, inventario) {

    if (!Array.isArray(rooming)) {

        throw new TypeError(
            "validateRoomingInventory espera un array."
        );
    }


    if (!Array.isArray(inventario)) {

        throw new TypeError(
            "validateRoomingInventory espera un inventario en formato array."
        );
    }


    return rooming.map(room => {

        const pasajeros =
            Array.isArray(room.pasajeros)
                ? room.pasajeros
                : [];


        const cantidadPasajeros = pasajeros.length;


        const habitacionInventario = inventario.find(
            item => String(item.numero) === String(room.numero)
        );


        if (!habitacionInventario) {

            return {
                ...room,

                cantidadPasajeros,

                plazasLibres: null,

                estado: "INVENTARIO_DESCONOCIDO"
            };
        }


        const capacidad =
            Number.isFinite(habitacionInventario.capacidad)
                ? habitacionInventario.capacidad
                : null;


        if (capacidad === null) {

            return {
                ...room,

                inventario: { ...habitacionInventario },

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

            inventario: { ...habitacionInventario },

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
