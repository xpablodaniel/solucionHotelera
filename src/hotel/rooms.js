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
 * Inventario físico del Hotel 31 de Agosto.
 * Los tipos se definen de forma local para no cambiar el significado
 * que esos mismos códigos tienen en el inventario del 23 de Mayo.
 */
const HOTEL_31_AGOSTO_ROOM_TYPES = Object.freeze({

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
        tipo: "TRIPLE MIXTA",
        capacidad: 3
    }),

    XIII: Object.freeze({
        codigo: "XIII",
        tipo: "QUINTUPLE FAMILIAR GRANDE",
        capacidad: 5
    })
});

const HOTEL_31_AGOSTO_ROOMS_DATA = [
    ["5", 0, "X"],
    ["6", 0, "X"],
    ["7", 0, "XI"],
    ["8", 0, "X"],

    ["9", 1, "X"],
    ["10", 1, "X"],
    ["11", 1, "XI"],
    ["12", 1, "XI"],
    ["13", 1, "III"],
    ["14", 1, "II"],
    ["15", 1, "X"],
    ["16", 1, "X"],
    ["17", 1, "X"],

    ["18", 2, "X"],
    ["19", 2, "X"],
    ["20", 2, "XI"],
    ["21", 2, "XI"],
    ["22", 2, "XI"],
    ["23", 2, "II"],
    ["24", 2, "X"],
    ["25", 2, "X"],
    ["26", 2, "X"],

    ["27", 3, "XIII"],
    ["28", 3, "XI"]
];

const HOTEL_31_AGOSTO_ROOMS = Object.freeze(
    HOTEL_31_AGOSTO_ROOMS_DATA.map(([numero, piso, codigo]) => {

        const type = HOTEL_31_AGOSTO_ROOM_TYPES[codigo];

        if (!type) {
            throw new Error(
                `Código de habitación desconocido para Hotel 31 de Agosto: ${codigo}`
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


const HOTEL_INVENTORIES = Object.freeze({
    "900": Object.freeze({
        alojamiento: "900",
        hotel: "HOTEL 23 DE MAYO",
        roomTypes: ROOM_TYPES,
        rooms: ROOMS
    }),
    "901": Object.freeze({
        alojamiento: "901",
        hotel: "HOTEL 31 DE AGOSTO",
        roomTypes: HOTEL_31_AGOSTO_ROOM_TYPES,
        rooms: HOTEL_31_AGOSTO_ROOMS
    })
});

function getHotelInventory(alojamiento) {

    return HOTEL_INVENTORIES[String(alojamiento).trim()] || null;
}


/**
 * Devuelve una habitación por número.
 * Sin código de alojamiento, consulta el Hotel 23 de Mayo.
 */
function getRoom(alojamientoOrNumero, numero) {

    const hasAccommodation = numero !== undefined;
    const inventory = getHotelInventory(
        hasAccommodation ? alojamientoOrNumero : "900"
    );

    if (!inventory) {
        return null;
    }

    const roomNumber = String(
        hasAccommodation ? numero : alojamientoOrNumero
    ).trim();

    return inventory.rooms.find(
        room => room.numero === roomNumber
    ) || null;
}


/**
 * Devuelve todas las habitaciones de un hotel.
 * Sin código de alojamiento, consulta el Hotel 23 de Mayo.
 */
function getAllRooms(alojamiento = "900") {

    const inventory = getHotelInventory(alojamiento);

    return inventory ? inventory.rooms : [];
}


/**
 * Devuelve las habitaciones de un piso.
 * Admite (piso) por compatibilidad y (alojamiento, piso).
 */
function getRoomsByFloor(alojamientoOrFloor, floor) {

    const hasAccommodation = floor !== undefined;
    const inventory = getHotelInventory(
        hasAccommodation ? alojamientoOrFloor : "900"
    );
    const targetFloor = hasAccommodation ? floor : alojamientoOrFloor;

    return (inventory ? inventory.rooms : []).filter(
        room => room.piso === targetFloor
    );
}


/**
 * Devuelve las habitaciones de un determinado tipo.
 *
 * Ejemplo:
 *
 * getRoomsByType("III")
 * getRoomsByType("900", "III")
 */
function getRoomsByType(alojamientoOrCode, code) {

    const hasAccommodation = code !== undefined;
    const inventory = getHotelInventory(
        hasAccommodation ? alojamientoOrCode : "900"
    );
    const targetCode = hasAccommodation ? code : alojamientoOrCode;

    return (inventory ? inventory.rooms : []).filter(
        room => room.codigoTipo === targetCode
    );
}


/**
 * Devuelve la capacidad total de un hotel.
 * Sin código de alojamiento, consulta el Hotel 23 de Mayo.
 */
function getTotalCapacity(alojamiento = "900") {

    const inventory = getHotelInventory(alojamiento);

    if (!inventory) {
        return 0;
    }

    return inventory.rooms.reduce(
        (total, room) =>
            total + room.capacidad,
        0
    );
}


/**
 * Devuelve la cantidad total de habitaciones de un hotel.
 * Sin código de alojamiento, consulta el Hotel 23 de Mayo.
 */
function getRoomCount(alojamiento = "900") {

    const inventory = getHotelInventory(alojamiento);

    return inventory ? inventory.rooms.length : 0;
}


/**
 * Exportaciones para Node.js / pruebas.
 */
if (typeof module !== "undefined" && module.exports) {

    module.exports = {
        ROOM_TYPES,
        ROOMS,
        HOTEL_31_AGOSTO_ROOM_TYPES,
        HOTEL_31_AGOSTO_ROOMS,
        HOTEL_INVENTORIES,
        getRoom,
        getAllRooms,
        getRoomsByFloor,
        getRoomsByType,
        getTotalCapacity,
        getRoomCount
    };
}