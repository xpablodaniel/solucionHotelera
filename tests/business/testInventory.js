const {
    ROOM_TYPES,
    createRoom
} = require("../../src/business/inventory");


function assert(condition, message) {

    if (!condition) {
        throw new Error(`TEST FALLIDO: ${message}`);
    }
}


console.log(
    "\n=== Tests del Inventario fisico ===\n"
);


// ---------------------------------------------------------
// Tipos conocidos
// ---------------------------------------------------------

console.log(
    "Probando tipos de habitacion..."
);

assert(
    ROOM_TYPES.II.capacidad === 2,
    "II deberia tener capacidad 2"
);

assert(
    ROOM_TYPES.X.capacidad === 2,
    "X deberia tener capacidad 2"
);

assert(
    ROOM_TYPES.III.capacidad === 3,
    "III deberia tener capacidad 3"
);

assert(
    ROOM_TYPES.XI.capacidad === 3,
    "XI deberia tener capacidad 3"
);

assert(
    ROOM_TYPES.XII.capacidad === 4,
    "XII deberia tener capacidad 4"
);

console.log(
    "OK tipos de habitacion"
);


// ---------------------------------------------------------
// Crear habitacion
// ---------------------------------------------------------

console.log(
    "Probando createRoom()..."
);

const room238 =
    createRoom("238", "XI");


assert(
    room238.numero === "238",
    "El numero deberia ser 238"
);

assert(
    room238.codigo === "XI",
    "El codigo deberia ser XI"
);

assert(
    room238.capacidad === 3,
    "La capacidad deberia ser 3"
);

assert(
    room238.tipo === "TRIPLE MATRIMONIAL",
    "El tipo deberia ser triple matrimonial"
);

console.log(
    "OK createRoom()"
);


// ---------------------------------------------------------
// Codigo desconocido
// ---------------------------------------------------------

console.log(
    "Probando codigo desconocido..."
);

let errorDetectado = false;

try {

    createRoom("999", "ZZ");

} catch (error) {

    errorDetectado = true;
}


assert(
    errorDetectado,
    "Deberia rechazar un codigo desconocido"
);

console.log(
    "OK validacion de codigo"
);


console.log(
    "\nTodos los tests del Inventario pasaron.\n"
);
