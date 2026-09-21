const {
    validateRoomingInventory
} = require("../../src/business/roomingInventory");
const {
    createRoom
} = require("../../src/business/inventory");


function assert(condition, message) {

    if (!condition) {
        throw new Error(`TEST FALLIDO: ${message}`);
    }
}


console.log(
    "\n=== Tests Rooming e Inventario ===\n"
);


const inventario = [
    createRoom("238", "XI"),
    createRoom("239", "II"),
    createRoom("240", "XII"),
    {
        numero: "241",
        tipo: "SIN CAPACIDAD",
        capacidad: null
    }
];


// ---------------------------------------------------------
// Habitacion correcta
// ---------------------------------------------------------

console.log(
    "Probando habitacion dentro de capacidad..."
);

const roomingOK = [

    {
        numero: "238",

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
    validateRoomingInventory(roomingOK, inventario);


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


assert(
    resultadoOK[0].inventario,
    "La habitacion deberia conservar el inventario"
);


assert(
    resultadoOK[0].inventario.codigo === "XI",
    "La habitacion 238 deberia tener codigo XI"
);


assert(
    Array.isArray(resultadoOK[0].inventario.camas),
    "El inventario deberia conservar la configuracion de camas"
);


assert(
    resultadoOK[0].inventario.camas.length === 2,
    "XI deberia tener dos unidades de cama"
);


assert(
    resultadoOK[0].inventario.camas[0].tipo === "MATRIMONIAL" &&
        resultadoOK[0].inventario.camas[0].cantidad === 1,
    "XI deberia tener una cama matrimonial"
);


assert(
    resultadoOK[0].inventario.camas[1].tipo === "INDIVIDUAL" &&
        resultadoOK[0].inventario.camas[1].cantidad === 1,
    "XI deberia tener una cama individual"
);


console.log(
    "OK habitacion, capacidad e inventario de camas"
);


// ---------------------------------------------------------
// Plazas libres
// ---------------------------------------------------------

console.log(
    "Probando habitacion con plazas libres..."
);

const roomingLibre = [

    {
        numero: "240",

        pasajeros: [
            { nombre: "PASAJERO" }
        ]
    }
];


const resultadoLibre =
    validateRoomingInventory(roomingLibre, inventario);


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

        pasajeros: [
            {},
            {},
            {},
            {}
        ]
    }
];


const resultadoExcedido =
    validateRoomingInventory(roomingExcedido, inventario);


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

    validateRoomingInventory(null, inventario);

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
        numero: "241",

        pasajeros: [
            { nombre: "PASAJERO" }
        ]
    }
];


const resultadoSinCapacidad =
    validateRoomingInventory(roomingSinCapacidad, inventario);


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


// ---------------------------------------------------------
// Inventario desconocido
// ---------------------------------------------------------

console.log(
    "Probando inventario desconocido..."
);

const roomingSinInventario = [

    {
        numero: "999",

        pasajeros: [
            {},
            {},
            {}
        ]
    }
];


const resultadoSinInventario =
    validateRoomingInventory(roomingSinInventario, inventario);


assert(
    resultadoSinInventario[0].estado ===
        "INVENTARIO_DESCONOCIDO",
    "Deberia detectar inventario desconocido"
);


assert(
    resultadoSinInventario[0].cantidadPasajeros === 3,
    "Deberia contar pasajeros sin inventario"
);


assert(
    resultadoSinInventario[0].plazasLibres === null,
    "No deberia calcular plazas libres sin inventario"
);


console.log(
    "OK inventario desconocido detectado"
);


console.log(
    "\nTodos los tests Rooming e Inventario pasaron.\n"
);