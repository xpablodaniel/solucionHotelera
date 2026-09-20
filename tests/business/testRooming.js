const {
    buildRooming,
    countRoomingRooms,
    getRoomsByVoucher,
    getRoomsByPassenger
} = require("../../src/business/rooming");


function assert(condition, message) {

    if (!condition) {
        throw new Error(
            `TEST FALLIDO: ${message}`
        );
    }
}


console.log("\n=== Tests del Rooming ===\n");


const reservas = [

    {
        voucher: "V001",
        clasificacion: {
            tipo: "INDIVIDUAL"
        },
        habitaciones: [
            {
                numero: "109",
                inventario: {
                    piso: 1,
                    codigoTipo: "X",
                    tipo: "DOBLE MATRIMONIAL",
                    capacidad: 2
                },
                pasajeros: [
                    {
                        pax: {
                            numeroDocumento: "11111111",
                            nombre: "GOMEZ JUAN"
                        }
                    },
                    {
                        pax: {
                            numeroDocumento: "22222222",
                            nombre: "PEREZ MARIA"
                        }
                    }
                ],
                asignaciones: []
            }
        ]
    },

    {
        voucher: "V002",
        clasificacion: {
            tipo: "CONTINGENTE"
        },
        habitaciones: [
            {
                numero: "238",
                inventario: {
                    piso: 2,
                    codigoTipo: "III",
                    tipo: "TRIPLE INDIVIDUAL",
                    capacidad: 3
                },
                pasajeros: [
                    {
                        pax: {
                            numeroDocumento: "33333333",
                            nombre: "GOMEZ GRACIELA"
                        }
                    },
                    {
                        pax: {
                            numeroDocumento: "44444444",
                            nombre: "ALBA LAUTARO"
                        }
                    },
                    {
                        pax: {
                            numeroDocumento: "55555555",
                            nombre: "INES PEREZ"
                        }
                    }
                ],
                asignaciones: ["A", "B", "C"]
            }
        ]
    }
];


console.log("Probando buildRooming()...");

const rooming = buildRooming(reservas);

assert(Array.isArray(rooming), "El rooming deberia ser un array");
assert(rooming.length === 2, "El rooming deberia contener dos habitaciones");

const individual = rooming.find(room => room.voucher === "V001");

assert(individual.numero === "109", "La habitacion individual deberia ser la 109");
assert(individual.clasificacion === "INDIVIDUAL", "Deberia conservar la clasificacion individual");
assert(individual.cantidadPasajeros === 2, "La habitacion deberia tener dos pasajeros");
assert(individual.capacidad === 2, "La capacidad deberia ser 2");
assert(individual.asignaciones.length === 0, "La reserva individual no deberia tener asignaciones");

const contingente = rooming.find(room => room.voucher === "V002");

assert(contingente.numero === "238", "La habitacion del contingente deberia ser la 238");
assert(contingente.clasificacion === "CONTINGENTE", "Deberia conservar la clasificacion contingente");
assert(contingente.capacidad === 3, "La habitacion 238 deberia tener capacidad 3");
assert(contingente.cantidadPasajeros === 3, "La habitacion deberia tener tres pasajeros");
assert(contingente.asignaciones.join(",") === "A,B,C", "Las asignaciones deberian conservarse");

console.log("OK buildRooming y casos individual/contingente");


assert(countRoomingRooms(rooming) === 2, "Deberia haber dos habitaciones en el rooming");

const roomsV002 = getRoomsByVoucher(rooming, "V002");
assert(roomsV002.length === 1, "V002 deberia tener una habitacion");
assert(roomsV002[0].numero === "238", "V002 deberia corresponder a la habitacion 238");

const roomsPassenger = getRoomsByPassenger(rooming, "44444444");
assert(roomsPassenger.length === 1, "El pasajero deberia aparecer en una habitacion");
assert(roomsPassenger[0].numero === "238", "El pasajero deberia estar en la habitacion 238");

let errorDetectado = false;

try {
    buildRooming("no es un array");
} catch (error) {
    errorDetectado = true;
}

assert(errorDetectado, "buildRooming deberia validar la entrada");

errorDetectado = false;

try {
    countRoomingRooms("no es un array");
} catch (error) {
    errorDetectado = true;
}

assert(errorDetectado, "countRoomingRooms deberia validar la entrada");

console.log("OK consultas y validaciones");
console.log("\nTodos los tests del Rooming pasaron.\n");
