/**
 * Inventario físico de habitaciones
 * HOTEL 23 DE MAYO
 *
 * Fuente:
 * - Plano de habitaciones proporcionado para el proyecto.
 * - Códigos de tipo de habitación:
 *
 * II  = Doble individual
 * X   = Doble matrimonial
 * III = Triple individual
 * XI  = Triple matrimonial
 * XII = Cuádruple
 *
 * IMPORTANTE:
 * Este módulo describe el inventario físico.
 *
 * NO:
 * - asigna habitaciones a reservas
 * - decide disponibilidad
 * - determina disposición de camas
 * - modifica roomings
 */


const ROOM_TYPES = Object.freeze({

    II: Object.freeze({
        codigo: "II",
        tipo: "DOBLE INDIVIDUAL",
        capacidad: 2
    }),

    X: Object.freeze({
        codigo: "X",
        tipo: "DOBLE MATRIMONIAL",
        capacidad: 2
    }),

    III: Object.freeze({
        codigo: "III",
        tipo: "TRIPLE INDIVIDUAL",
        capacidad: 3
    }),

    XI: Object.freeze({
        codigo: "XI",
        tipo: "TRIPLE MATRIMONIAL",
        capacidad: 3
    }),

    XII: Object.freeze({
        codigo: "XII",
        tipo: "CUADRUPLE",
        capacidad: 4
    })

});


/**
 * Inventario físico del Hotel 23 de Mayo.
 *
 * Cada habitación conserva:
 * - número
 * - piso
 * - código físico
 * - tipo
 * - capacidad
 */

const ROOMS_DATA = [

    // -----------------------------------------------------
    // PRIMER PISO
    // -----------------------------------------------------

    ["101", 1, "X"],
    ["102", 1, "X"],
    ["103", 1, "X"],
    ["104", 1, "II"],
    ["105", 1, "X"],
    ["106", 1, "X"],

    ["107", 1, "X"],
    ["108", 1, "II"],
    ["109", 1, "X"],
    ["110", 1, "X"],
    ["111", 1, "X"],

    ["112", 1, "X"],
    ["113", 1, "X"],
    ["114", 1, "II"],
    ["115", 1, "X"],
    ["116", 1, "III"],

    ["117", 1, "III"],
    ["118", 1, "X"],
    ["119", 1, "X"],
    ["120", 1, "X"],
    ["121", 1, "X"],


    // -----------------------------------------------------
    // SEGUNDO PISO
    // -----------------------------------------------------

    ["222", 2, "X"],
    ["223", 2, "II"],
    ["224", 2, "II"],
    ["225", 2, "X"],
    ["226", 2, "X"],
    ["227", 2, "X"],

    ["228", 2, "X"],
    ["229", 2, "X"],
    ["230", 2, "X"],
    ["231", 2, "II"],
    ["232", 2, "II"],

    ["233", 2, "X"],
    ["234", 2, "X"],
    ["235", 2, "X"],
    ["236", 2, "X"],
    ["237", 2, "III"],

    ["238", 2, "III"],
    ["239", 2, "X"],
    ["240", 2, "XII"],
    ["241", 2, "X"],
    ["242", 2, "X"],


    // -----------------------------------------------------
    // TERCER PISO
    // -----------------------------------------------------

    ["343", 3, "X"],
    ["344", 3, "X"],
    ["345", 3, "X"],
    ["346", 3, "X"],
    ["347", 3, "X"],
    ["348", 3, "X"],

    ["349", 3, "II"],
    ["350", 3, "II"],
    ["351", 3, "X"],
    ["352", 3, "X"],
    ["353", 3, "II"]
];


const ROOMS = Object.freeze(
    ROOMS_DATA.map(([numero, piso, codigo]) => {

        const type = ROOM_TYPES[codigo];

        if (!type) {
            throw new Error(
                `Código de habitación desconocido: ${codigo}`
            );
        }

        return Object.freeze({
            numero,
            piso,
            codigoTipo: type.codigo,
            tipo: type.tipo,
            capacidad: type.capacidad
        });
    })
);


/**
 * Devuelve una habitación por número.
 */
function getRoom(numero) {

    const roomNumber = String(numero).trim();

    return ROOMS.find(
        room => room.numero === roomNumber
    ) || null;
}


/**
 * Devuelve todas las habitaciones.
 */
function getAllRooms() {

    return ROOMS;
}


/**
 * Devuelve las habitaciones de un piso.
 */
function getRoomsByFloor(piso) {

    return ROOMS.filter(
        room => room.piso === piso
    );
}


/**
 * Devuelve las habitaciones de un determinado tipo.
 *
 * Ejemplo:
 *
 * getRoomsByType("III")
 */
function getRoomsByType(codigo) {

    return ROOMS.filter(
        room => room.codigoTipo === codigo
    );
}


/**
 * Devuelve la capacidad total del hotel.
 */
function getTotalCapacity() {

    return ROOMS.reduce(
        (total, room) =>
            total + room.capacidad,
        0
    );
}


/**
 * Devuelve la cantidad total de habitaciones.
 */
function getRoomCount() {

    return ROOMS.length;
}


/**
 * Exportaciones para Node.js / pruebas.
 */
if (typeof module !== "undefined" && module.exports) {

    module.exports = {
        ROOM_TYPES,
        ROOMS,
        getRoom,
        getAllRooms,
        getRoomsByFloor,
        getRoomsByType,
        getTotalCapacity,
        getRoomCount
    };
}