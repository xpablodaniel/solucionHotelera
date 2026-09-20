const {
    processReservations
} = require(
    "../../src/business/processReservations"
);


function assert(condition, message) {

    if (!condition) {

        throw new Error(
            `❌ TEST FALLIDO: ${message}`
        );
    }
}


console.log("\n=== Tests de procesamiento de reservas ===\n");


// ---------------------------------------------------------
// Reserva individual
// ---------------------------------------------------------

console.log(
    "Probando procesamiento de reserva individual..."
);


const registrosIndividual = [

    {
        voucher: "58000085",

        servicios: "DESAYUNO",

        transporte: "Sin Transporte",

        paquete: "",

        habitacion: {
            numero: "109",
            asignacion: null
        },

        pax: {
            nombre: "GARCIA GUILLERMO"
        }
    },

    {
        voucher: "58000085",

        servicios: "DESAYUNO",

        transporte: "Sin Transporte",

        paquete: "",

        habitacion: {
            numero: "109",
            asignacion: null
        },

        pax: {
            nombre: "RODRIGUEZ ANTONELIA"
        }
    }
];


const reservasIndividual =
    processReservations(
        registrosIndividual
    );


assert(
    reservasIndividual.length === 1,
    "Debería existir una sola reserva"
);


assert(
    reservasIndividual[0].voucher === "58000085",
    "El voucher debería conservarse"
);


assert(
    reservasIndividual[0].cantidadPasajeros === 2,
    "La reserva debería tener dos pasajeros"
);


assert(
    reservasIndividual[0].clasificacion.tipo ===
        "INDIVIDUAL",
    "La reserva debería clasificarse como individual"
);


assert(
    reservasIndividual[0].clasificacion.consistente ===
        true,
    "La reserva debería ser consistente"
);


assert(
    Array.isArray(
        reservasIndividual[0].habitaciones
    ),
    "La reserva debería contener habitaciones"
);


assert(
    reservasIndividual[0].habitaciones.length === 1,
    "La reserva individual debería tener una habitación"
);


assert(
    reservasIndividual[0].habitaciones[0].numero ===
        "109",
    "La habitación debería ser la 109"
);


assert(
    reservasIndividual[0].habitaciones[0].pasajeros.length ===
        2,
    "La habitación debería tener dos pasajeros"
);


assert(
    reservasIndividual[0].habitaciones[0].asignaciones.length ===
        0,
    "Una reserva individual no debería tener asignaciones"
);


console.log(
    "✅ Reserva individual procesada correctamente"
);


// ---------------------------------------------------------
// Contingente
// ---------------------------------------------------------

console.log(
    "Probando procesamiento de contingente..."
);


const registrosGrupo = [

    {
        voucher: "30188721",

        servicios:
            "ACTIVIDAD RECREATI - COORDINADOR MDQ - PENSIÓN COMPLETA - SEGUROS - SERVICIOS PPJ",

        transporte:
            "PPJ MDQ BUS 2 - PPJ MDQ 2",

        paquete:
            "PPJ MAR DEL PLATA 23/10 2",

        habitacion: {
            numero: "238",
            asignacion: "A"
        },

        pax: {
            nombre: "GOMEZ GRACIELA"
        }
    },

    {
        voucher: "30188721",

        servicios:
            "ACTIVIDAD RECREATI - COORDINADOR MDQ - PENSIÓN COMPLETA - SEGUROS - SERVICIOS PPJ",

        transporte:
            "PPJ MDQ BUS 2 - PPJ MDQ 2",

        paquete:
            "PPJ MAR DEL PLATA 23/10 2",

        habitacion: {
            numero: "238",
            asignacion: "B"
        },

        pax: {
            nombre: "ALBA LAUTARO"
        }
    }
];


const reservasGrupo =
    processReservations(
        registrosGrupo
    );


assert(
    reservasGrupo.length === 1,
    "Debería existir un solo grupo"
);


assert(
    reservasGrupo[0].voucher === "30188721",
    "El voucher del grupo debería conservarse"
);


assert(
    reservasGrupo[0].cantidadPasajeros === 2,
    "El grupo debería tener dos pasajeros"
);


assert(
    reservasGrupo[0].clasificacion.tipo ===
        "CONTINGENTE",
    "El grupo debería clasificarse como contingente"
);


assert(
    reservasGrupo[0].clasificacion.consistente ===
        true,
    "El grupo debería ser consistente"
);


assert(
    Array.isArray(
        reservasGrupo[0].habitaciones
    ),
    "El contingente debería contener habitaciones"
);


assert(
    reservasGrupo[0].habitaciones.length === 1,
    "El contingente debería tener una habitación"
);


assert(
    reservasGrupo[0].habitaciones[0].numero ===
        "238",
    "La habitación del contingente debería ser la 238"
);


assert(
    reservasGrupo[0].habitaciones[0].pasajeros.length ===
        2,
    "La habitación debería tener dos pasajeros"
);


assert(
    reservasGrupo[0].habitaciones[0].asignaciones.length ===
        2,
    "El contingente debería conservar las asignaciones"
);


assert(
    reservasGrupo[0].habitaciones[0].asignaciones.join(",") ===
        "A,B",
    "Las asignaciones deberían ser A y B"
);


console.log(
    "✅ Contingente procesado correctamente"
);


// ---------------------------------------------------------
// Varios vouchers
// ---------------------------------------------------------

console.log(
    "Probando múltiples reservas..."
);


const registrosMultiples = [

    {
        voucher: "10001",
        servicios: "DESAYUNO",
        transporte: "Sin Transporte",
        paquete: ""
    },

    {
        voucher: "10001",
        servicios: "DESAYUNO",
        transporte: "Sin Transporte",
        paquete: ""
    },

    {
        voucher: "20002",
        servicios: "PENSIÓN COMPLETA",
        transporte: "BUS GRUPO",
        paquete: "PPJ"
    }
];


const reservasMultiples =
    processReservations(
        registrosMultiples
    );


assert(
    reservasMultiples.length === 2,
    "Deberían existir dos reservas"
);


assert(
    reservasMultiples[0].cantidadPasajeros === 2,
    "La primera reserva debería tener dos pasajeros"
);


assert(
    reservasMultiples[1].cantidadPasajeros === 1,
    "La segunda reserva debería tener un pasajero"
);


console.log(
    "✅ Múltiples reservas procesadas correctamente"
);


// ---------------------------------------------------------
// Array vacío
// ---------------------------------------------------------

console.log(
    "Probando procesamiento sin registros..."
);


const resultadoVacio =
    processReservations([]);


assert(
    Array.isArray(resultadoVacio),
    "El resultado debería ser un array"
);


assert(
    resultadoVacio.length === 0,
    "No debería generar reservas"
);


console.log(
    "✅ Array vacío OK"
);


// ---------------------------------------------------------
// Validación
// ---------------------------------------------------------

console.log(
    "Probando validación de entrada..."
);


let errorDetectado = false;


try {

    processReservations(null);

}
catch (error) {

    errorDetectado = true;
}


assert(
    errorDetectado === true,
    "Debe rechazar una entrada que no sea array"
);


console.log(
    "✅ Validación de entrada OK"
);


console.log(
    "\n🎉 Todos los tests de procesamiento pasaron.\n"
);