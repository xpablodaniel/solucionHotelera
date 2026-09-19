const {
    groupByVoucher,
    groupByRoom
} = require("../../src/business/reservation");


function assert(condition, message) {

    if (!condition) {
        throw new Error(`❌ TEST FALLIDO: ${message}`);
    }
}

console.log("\n=== Tests de lógica de reservas ===\n");

console.log("Probando groupByVoucher()...");


const records = [

    {
        voucher: "30243135",
        pax: {
            nombre: "GOMEZ GRACIELA"
        }
    },

    {
        voucher: "30243135",
        pax: {
            nombre: "ALBA LAUTARO"
        }
    },

    {
        voucher: "30243135",
        pax: {
            nombre: "INES PEREZ"
        }
    },

    {
        voucher: "30243136",
        pax: {
            nombre: "JUAN PEREZ"
        }
    }
];


const resultado = groupByVoucher(records);


assert(
    resultado.length === 2,
    "Deberían existir 2 reservas"
);


assert(
    resultado[0].voucher === "30243135",
    "El primer voucher debería ser 30243135"
);

assert(
    resultado[0].pasajeros.length === 3,
    "La reserva 30243135 debería tener 3 pasajeros"
);


assert(
    resultado[1].voucher === "30243136",
    "El segundo voucher debería ser 30243136"
);


assert(
    resultado[1].pasajeros.length === 1,
    "La reserva 30243136 debería tener 1 pasajero"
);


console.log("✅ groupByVoucher() OK");


console.log("Probando groupByVoucher() con vouchers vacíos...");


const registrosSinVoucher = [
    {
        voucher: "",
        pax: {
            nombre: "SIN VOUCHER"
        }
    },

    {
        voucher: null,
        pax: {
            nombre: "VOUCHER NULO"
        }
    },

    {
        voucher: "30243137",
        pax: {
            nombre: "PAX VÁLIDO"
        }
    }
];


const reservasSinVoucher = groupByVoucher(registrosSinVoucher);


assert(
    reservasSinVoucher.length === 1,
    "Los registros sin voucher no deberían crear reservas"
);


assert(
    reservasSinVoucher[0].pasajeros[0].pax.nombre === "PAX VÁLIDO",
    "Debería conservarse el registro con voucher válido"
);


console.log("✅ groupByVoucher() con vouchers vacíos OK");


console.log("Probando groupByRoom()...");


const registrosPorHabitacion = [

    {
        habitacion: {
            numero: "238",
            asignacion: "A"
        },
        plazas: {
            cantidad: 3,
            ocupadas: 3
        },
        pax: {
            nombre: "GOMEZ GRACIELA"
        }
    },

    {
        habitacion: {
            numero: "238",
            asignacion: "B"
        },
        plazas: {
            cantidad: 3,
            ocupadas: 3
        },
        pax: {
            nombre: "ALBA LAUTARO"
        }
    },

    {
        habitacion: {
            numero: "239",
            asignacion: null
        },
        pax: {
            nombre: "INES PEREZ"
        }
    },

    {
        habitacion: null,
        pax: {
            nombre: "SIN HABITACION"
        }
    }
];


const habitaciones = groupByRoom(registrosPorHabitacion, true);


assert(
    habitaciones.length === 2,
    "Deberían existir 2 habitaciones"
);


assert(
    habitaciones[0].numero === "238",
    "La primera habitación debería ser 238"
);


assert(
    habitaciones[0].pasajeros.length === 2,
    "La habitación 238 debería tener 2 pasajeros"
);


assert(
    habitaciones[0].asignaciones.join(",") === "A,B",
    "La habitación 238 debería conservar las asignaciones A y B"
);


assert(
    habitaciones[1].numero === "239" &&
    habitaciones[1].asignaciones.length === 0,
    "La habitación 239 debería existir sin asignaciones"
);


console.log("✅ groupByRoom() OK");


const habitacionesSinContingente = groupByRoom(
    registrosPorHabitacion,
    false
);


assert(
    habitacionesSinContingente[0].asignaciones.length === 0,
    "Las asignaciones no deberían acumularse fuera de contingentes"
);


console.log("✅ groupByRoom() sin contingente OK");


console.log(
    "Probando capacidad de habitación con contingente A/B/C..."
);


const grupoContingente = [

    {
        voucher: "30243138",
        habitacion: {
            numero: "238",
            asignacion: "A"
        },
        tipoHabitacion: "TRIPLE A COMPARTIR",
        plazas: {
            cantidad: 3,
            ocupadas: 3
        },
        pax: {
            nombre: "GOMEZ GRACIELA"
        }
    },

    {
        voucher: "30243138",
        habitacion: {
            numero: "238",
            asignacion: "B"
        },
        tipoHabitacion: "TRIPLE A COMPARTIR",
        plazas: {
            cantidad: 3,
            ocupadas: 3
        },
        pax: {
            nombre: "ALBA LAUTARO"
        }
    },

    {
        voucher: "30243138",
        habitacion: {
            numero: "238",
            asignacion: "C"
        },
        tipoHabitacion: "TRIPLE A COMPARTIR",
        plazas: {
            cantidad: 3,
            ocupadas: 3
        },
        pax: {
            nombre: "INES PEREZ"
        }
    }
];


const habitacionesContingente = groupByRoom(
    grupoContingente,
    true
);


assert(
    habitacionesContingente.length === 1 &&
    habitacionesContingente[0].numero === "238",
    "El contingente debería ocupar una sola habitación 238"
);


assert(
    habitacionesContingente[0].pasajeros.length === 3,
    "La habitación del contingente debería tener 3 pasajeros"
);


assert(
    habitacionesContingente[0].capacidad === 3,
    "La capacidad no debería sumarse entre las filas del contingente"
);


assert(
    habitacionesContingente[0].ocupadasInformadas === 3,
    "Las plazas ocupadas no deberían sumarse entre las filas del contingente"
);


assert(
    habitacionesContingente[0].asignaciones.join(",") === "A,B,C",
    "El contingente debería conservar las asignaciones A, B y C"
);


console.log("✅ Capacidad A/B/C conservada correctamente");


console.log("Probando groupByRoom() con reserva individual...");


const reservaIndividual = [

    {
        voucher: "30243136",
        habitacion: {
            numero: "238",
            asignacion: "A"
        },
        pax: {
            nombre: "GOMEZ GRACIELA"
        }
    }
];


const habitacionesIndividual = groupByRoom(
    reservaIndividual,
    false
);


assert(
    habitacionesIndividual.length === 1 &&
    habitacionesIndividual[0].numero === "238",
    "La reserva individual debería tener una habitación 238"
);


assert(
    habitacionesIndividual[0].pasajeros.length === 1,
    "La reserva individual debería tener un pasajero"
);


assert(
    habitacionesIndividual[0].asignaciones.length === 0,
    "Una reserva individual no debería utilizar asignaciones"
);


console.log("✅ groupByRoom() reserva individual OK");


console.log(
    "Probando capacidad y pasajeros detectados..."
);


const habitacionTripleUnaPersona = [

    {
        voucher: "30243137",

        habitacion: {
            numero: "237",
            asignacion: null
        },

        tipoHabitacion: "TRIPLE",

        plazas: {
            cantidad: 3,
            ocupadas: 1
        },

        pax: {
            nombre: "PEREZ JUAN"
        }
    }
];


const resultadoTriple =
    groupByRoom(
        habitacionTripleUnaPersona,
        false
    );


assert(
    resultadoTriple.length === 1,
    "Debería existir una sola habitación"
);


assert(
    resultadoTriple[0].numero === "237",
    "La habitación debería ser 237"
);


assert(
    resultadoTriple[0].pasajeros.length === 1,
    "Debería detectarse un solo pasajero"
);


assert(
    resultadoTriple[0].capacidad === 3,
    "La capacidad debería ser 3"
);


assert(
    resultadoTriple[0].ocupadasInformadas === 1,
    "Las plazas ocupadas informadas deberían ser 1"
);


console.log(
    "✅ Capacidad y pasajeros detectados OK"
);


console.log("Probando validaciones de entrada...");


let errorGroupByVoucher = false;

try {
    groupByVoucher(null);
}
catch (error) {
    errorGroupByVoucher = error instanceof TypeError;
}


assert(
    errorGroupByVoucher,
    "groupByVoucher() debería rechazar entradas que no sean arrays"
);


let errorGroupByRoom = false;

try {
    groupByRoom({});
}
catch (error) {
    errorGroupByRoom = error instanceof TypeError;
}


assert(
    errorGroupByRoom,
    "groupByRoom() debería rechazar entradas que no sean arrays"
);


console.log("✅ Validaciones de entrada OK");

console.log("\n🎉 Todos los tests de reservas pasaron.\n");