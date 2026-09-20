const {
    validateRoomingInventory
} = require("../../src/business/roomingInventory");


function assert(condition, message) {

    if (!condition) {
        throw new Error(`TEST FALLIDO: ${message}`);
    }
}


console.log(
    "\n=== Tests Rooming e Inventario ===\n"
);


// ---------------------------------------------------------
// Habitacion correcta
// ---------------------------------------------------------

console.log(
    "Probando habitacion dentro de capacidad..."
);

const roomingOK = [

    {
        numero: "238",

        capacidad: 3,

        pasajeros: [
            { nombre: "ABUELA" },
            { nombre: "NIETA" },
            { nombre: "AMIGA" }
        ],

        reservas: [
            {
                voucher: "30243142",
                pasajeros: [
                    { nombre: "ABUELA" },
                    { nombre: "NIETA" }
                ]
            },
            {
                voucher: "30243143",
                pasajeros: [
                    { nombre: "AMIGA" }
                ]
            }
        ]
    }
];


const resultadoOK =
    validateRoomingInventory(roomingOK);


assert(
    resultadoOK.length === 1,
    "Deberia devolver una habitacion"
);


assert(
    resultadoOK[0].estado === "OK",
    "La habitacion 238 deberia estar OK"
);


assert(
    resultadoOK[0].cantidadPasajeros === 3,
    "Deberia detectar tres pasajeros"
);


console.log(
    "OK habitacion dentro de capacidad"
);


// ---------------------------------------------------------
// Plazas libres
// ---------------------------------------------------------

console.log(
    "Probando habitacion con plazas libres..."
);

const roomingLibre = [

    {
        numero: "109",

        capacidad: 4,

        pasajeros: [
            { nombre: "PASAJERO" }
        ]
    }
];


const resultadoLibre =
    validateRoomingInventory(roomingLibre);


assert(
    resultadoLibre[0].estado === "OK",
    "Las plazas libres no deberian generar error"
);


assert(
    resultadoLibre[0].plazasLibres === 3,
    "Deberia detectar tres plazas libres"
);


console.log(
    "OK plazas libres"
);


// ---------------------------------------------------------
// Capacidad superada
// ---------------------------------------------------------

console.log(
    "Probando capacidad superada..."
);

const roomingExcedido = [

    {
        numero: "238",

        capacidad: 3,

        pasajeros: [
            {},
            {},
            {},
            {}
        ]
    }
];


const resultadoExcedido =
    validateRoomingInventory(roomingExcedido);


assert(
    resultadoExcedido[0].estado ===
        "CAPACIDAD_SUPERADA",
    "Deberia detectar capacidad superada"
);


console.log(
    "OK capacidad superada detectada"
);


// ---------------------------------------------------------
// Validacion de entrada
// ---------------------------------------------------------

console.log(
    "Probando validaciones..."
);


let errorDetectado = false;


try {

    validateRoomingInventory(null);

} catch (error) {

    errorDetectado = true;
}


assert(
    errorDetectado,
    "Deberia rechazar una entrada que no sea array"
);


console.log(
    "OK validaciones"
);


// ---------------------------------------------------------
// Capacidad desconocida
// ---------------------------------------------------------

console.log(
    "Probando capacidad desconocida..."
);

const roomingSinCapacidad = [

    {
        numero: "999",

        pasajeros: [
            { nombre: "PASAJERO" }
        ]
    }
];


const resultadoSinCapacidad =
    validateRoomingInventory(roomingSinCapacidad);


assert(
    resultadoSinCapacidad[0].estado ===
        "CAPACIDAD_DESCONOCIDA",
    "Deberia detectar capacidad desconocida"
);


assert(
    resultadoSinCapacidad[0].cantidadPasajeros === 1,
    "Deberia contar pasajeros aunque falte la capacidad"
);


assert(
    resultadoSinCapacidad[0].plazasLibres === null,
    "No deberia calcular plazas libres sin capacidad"
);


console.log(
    "OK capacidad desconocida detectada"
);


console.log(
    "\nTodos los tests Rooming e Inventario pasaron.\n"
);