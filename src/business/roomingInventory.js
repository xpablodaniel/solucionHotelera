/**
 * Validacion del Rooming contra el inventario fisico.
 *
 * Este modulo valida capacidad y no asigna habitaciones, redistribuye
 * pasajeros, asigna camas ni fusiona reservas.
 */


function normalizeAccommodation(value) {

    if (value === undefined || value === null) {
        return null;
    }

    const alojamiento = String(value).trim();

    return alojamiento || null;
}


function findInventoryRoom(room, inventario) {

    const numero = String(room.numero);
    const matchingRooms = inventario.filter(
        item => String(item.numero) === numero
    );
    const alojamiento = normalizeAccommodation(room.alojamiento);

    if (alojamiento) {

        const exactMatch = matchingRooms.find(
            item => normalizeAccommodation(item.alojamiento) === alojamiento
        );

        if (exactMatch) {
            return exactMatch;
        }

        return matchingRooms.some(
            item => normalizeAccommodation(item.alojamiento)
        )
            ? null
            : matchingRooms[0] || null;
    }

    const inventoryAccommodations = new Set(
        matchingRooms
            .map(item => normalizeAccommodation(item.alojamiento))
            .filter(Boolean)
    );
    const hasUnidentifiedRoom = matchingRooms.some(
        item => !normalizeAccommodation(item.alojamiento)
    );

    if (
        inventoryAccommodations.size > 1 ||
        (inventoryAccommodations.size > 0 && hasUnidentifiedRoom)
    ) {
        return null;
    }

    return matchingRooms[0] || null;
}


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


        const habitacionInventario = findInventoryRoom(room, inventario);


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
