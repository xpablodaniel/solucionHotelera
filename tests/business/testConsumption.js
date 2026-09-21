const {
    buildConsumptionGroups,
    setConsumptionResponsible
} = require("../../src/business/consumption");


function assert(condition, message) {

    if (!condition) {
        throw new Error(`TEST FALLIDO: ${message}`);
    }
}


console.log(
    "\n=== Tests de unidades de consumo ===\n"
);


// ---------------------------------------------------------
// Caso basico
// ---------------------------------------------------------

console.log(
    "Probando una reserva..."
);

const reservas = [

    {
        voucher: "30243142",

        pasajeros: [
            { nombre: "ABUELA" },
            { nombre: "NIETA" }
        ]
    }
];


const unidades =
    buildConsumptionGroups(reservas);


assert(
    unidades.length === 1,
    "Deberia generar una unidad de consumo"
);

assert(
    unidades[0].voucher === "30243142",
    "Deberia conservar el voucher"
);

assert(
    unidades[0].pasajeros.length === 2,
    "Deberia conservar los pasajeros"
);

assert(
    unidades[0].cantidadPasajeros === 2,
    "Deberia contar los pasajeros"
);

assert(
    unidades[0].responsable === null,
    "El responsable inicialmente deberia ser null"
);

console.log(
    "OK reserva individual"
);


// ---------------------------------------------------------
// Dos vouchers en una misma habitacion
// ---------------------------------------------------------

console.log(
    "Probando dos vouchers en una habitacion..."
);

const reservasCompartidas = [

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
];


const unidadesCompartidas =
    buildConsumptionGroups(reservasCompartidas);


assert(
    unidadesCompartidas.length === 2,
    "Dos vouchers deberian generar dos unidades"
);

assert(
    unidadesCompartidas[0].voucher === "30243142",
    "La primera unidad deberia conservar su voucher"
);

assert(
    unidadesCompartidas[1].voucher === "30243143",
    "La segunda unidad deberia conservar su voucher"
);

assert(
    unidadesCompartidas[0].cantidadPasajeros === 2,
    "La primera unidad deberia tener dos pasajeros"
);

assert(
    unidadesCompartidas[1].cantidadPasajeros === 1,
    "La segunda unidad deberia tener un pasajero"
);

console.log(
    "OK vouchers independientes"
);


// ---------------------------------------------------------
// Asignar responsable
// ---------------------------------------------------------

console.log(
    "Probando responsable de consumo..."
);

const unidadConResponsable =
    setConsumptionResponsible(
        unidadesCompartidas[0],
        "ABUELA"
    );


assert(
    unidadConResponsable.responsable === "ABUELA",
    "Deberia asignar el responsable"
);

assert(
    unidadesCompartidas[0].responsable === null,
    "No deberia modificar la unidad original"
);

console.log(
    "OK responsable de consumo"
);


// ---------------------------------------------------------
// Sin reservas
// ---------------------------------------------------------

console.log(
    "Probando array vacio..."
);

const vacio =
    buildConsumptionGroups([]);


assert(
    Array.isArray(vacio),
    "Deberia devolver un array"
);

assert(
    vacio.length === 0,
    "El array deberia estar vacio"
);

console.log(
    "OK array vacio"
);


// ---------------------------------------------------------
// Validaciones
// ---------------------------------------------------------

console.log(
    "Probando validaciones..."
);

let errorDetectado = false;

try {

    buildConsumptionGroups(null);

} catch (error) {

    errorDetectado = true;
}


assert(
    errorDetectado,
    "Deberia rechazar un valor que no sea array"
);

console.log(
    "OK validaciones"
);


console.log(
    "\nTodos los tests de consumo pasaron.\n"
);
