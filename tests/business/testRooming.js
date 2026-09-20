const {
    buildRooming,
    countRoomingRooms,
    getRoomsByVoucher,
    getRoomsByPassenger,
    calculateRoomOccupancy,
    attachBedConfiguration,
    groupRoomsForRooming
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


console.log("Probando calculateRoomOccupancy()...");

const ocupacionCompleta = calculateRoomOccupancy({
    capacidad: 3,
    cantidadPasajeros: 3
});

assert(ocupacionCompleta.capacidad === 3, "La capacidad deberia ser 3");
assert(ocupacionCompleta.cantidadPasajeros === 3, "Deberia haber tres pasajeros");
assert(ocupacionCompleta.plazasLibres === 0, "No deberia haber plazas libres");
assert(ocupacionCompleta.porcentajeOcupacion === 100, "La ocupacion deberia ser del 100%");
assert(ocupacionCompleta.estado === "OK", "El estado deberia ser OK");

const ocupacionParcial = calculateRoomOccupancy({
    capacidad: 4,
    cantidadPasajeros: 1
});

assert(ocupacionParcial.plazasLibres === 3, "Deberia haber tres plazas libres");
assert(ocupacionParcial.porcentajeOcupacion === 25, "La ocupacion deberia ser del 25%");
assert(ocupacionParcial.estado === "OK", "Una ocupacion parcial deberia ser valida");

const capacidadSuperada = calculateRoomOccupancy({
    capacidad: 3,
    cantidadPasajeros: 4
});

assert(capacidadSuperada.plazasLibres === -1, "Deberia indicar una plaza negativa");
assert(
    capacidadSuperada.porcentajeOcupacion === (4 / 3) * 100,
    "La ocupacion deberia superar el 100%"
);
assert(
    capacidadSuperada.estado === "CAPACIDAD_SUPERADA",
    "Deberia detectar capacidad superada"
);

const capacidadDesconocida = calculateRoomOccupancy({
    capacidad: null,
    cantidadPasajeros: 2
});

assert(capacidadDesconocida.plazasLibres === null, "No se deberian calcular plazas sin capacidad");
assert(
    capacidadDesconocida.porcentajeOcupacion === null,
    "No se deberia calcular porcentaje sin capacidad"
);
assert(
    capacidadDesconocida.estado === "CAPACIDAD_DESCONOCIDA",
    "Deberia detectar capacidad desconocida"
);

const capacidadInvalida = calculateRoomOccupancy({
    capacidad: 0,
    cantidadPasajeros: 1
});

assert(capacidadInvalida.plazasLibres === -1, "Deberia calcular las plazas libres");
assert(
    capacidadInvalida.porcentajeOcupacion === null,
    "No deberia calcular porcentaje para capacidad invalida"
);
assert(
    capacidadInvalida.estado === "CAPACIDAD_INVALIDA",
    "Deberia detectar capacidad invalida"
);

let habitacionInvalida = false;

try {
    calculateRoomOccupancy(null);
} catch (error) {
    habitacionInvalida = true;
}

assert(habitacionInvalida, "Deberia validar la habitacion recibida");

const roomOriginal = {
    numero: "240",
    capacidad: 4,
    cantidadPasajeros: 1
};

calculateRoomOccupancy(roomOriginal);

assert(roomOriginal.capacidad === 4, "La capacidad original no deberia modificarse");
assert(
    roomOriginal.cantidadPasajeros === 1,
    "La cantidad original no deberia modificarse"
);
assert(
    !Object.prototype.hasOwnProperty.call(roomOriginal, "plazasLibres"),
    "El calculo no deberia agregar propiedades a la habitacion"
);

console.log("OK calculos e inmutabilidad");


console.log("Probando attachBedConfiguration()...");

const roomingOperativo = attachBedConfiguration(rooming);

assert(
    Array.isArray(roomingOperativo),
    "El rooming operativo deberia ser un array"
);

const individualOperativo = roomingOperativo.find(
    room => room.voucher === "V001"
);

assert(
    individualOperativo.configuracionCamas.codigoTipo === "X",
    "La habitacion 109 deberia usar la configuracion X"
);
assert(
    individualOperativo.configuracionCamas.camas[0].tipo === "MATRIMONIAL",
    "La habitacion 109 deberia tener cama matrimonial"
);
assert(
    individualOperativo.ocupacion.plazasLibres === 0,
    "La habitacion 109 no deberia tener plazas libres"
);
assert(
    individualOperativo.ocupacion.porcentaje === 100,
    "La ocupacion de la habitacion 109 deberia ser del 100%"
);

const contingenteOperativo = roomingOperativo.find(
    room => room.voucher === "V002"
);

assert(
    contingenteOperativo.configuracionCamas.codigoTipo === "III",
    "La habitacion 238 deberia usar la configuracion III"
);
assert(
    contingenteOperativo.configuracionCamas.camas[0].cantidad === 3,
    "La habitacion 238 deberia tener tres camas individuales"
);
assert(
    contingenteOperativo.ocupacion.estado === "OK",
    "La ocupacion del contingente deberia ser correcta"
);
assert(
    contingenteOperativo.asignaciones.join(",") === "A,B,C",
    "La conexion no deberia modificar las asignaciones"
);
assert(
    contingenteOperativo.pasajeros.length === 3,
    "La conexion no deberia modificar los pasajeros"
);

assert(
    !Object.prototype.hasOwnProperty.call(rooming[0], "configuracionCamas"),
    "La conexion no deberia modificar el Rooming original"
);
assert(
    !Object.prototype.hasOwnProperty.call(rooming[0], "ocupacion"),
    "La conexion no deberia agregar ocupacion al Rooming original"
);

console.log("OK conexion con configuracion de camas");


console.log("Probando habitaciones compartidas entre vouchers...");

const reservaAbuelaNieta = {
    voucher: "30243142",
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
                { nombre: "ABUELA" },
                { nombre: "NIETA" }
            ],
            asignaciones: ["A", "B"]
        }
    ]
};

const reservaAmiga = {
    voucher: "30243143",
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
                { nombre: "AMIGA" }
            ],
            asignaciones: ["C"]
        }
    ]
};

const roomingCompartido = groupRoomsForRooming([
    reservaAbuelaNieta,
    reservaAmiga
]);

assert(
    roomingCompartido.length === 1,
    "Las dos reservas deberian formar una sola habitacion fisica"
);

const habitacion238 = roomingCompartido[0];

assert(habitacion238.numero === "238", "La habitacion deberia ser la 238");
assert(habitacion238.reservas.length === 2, "Deberia conservar dos reservas");
assert(habitacion238.pasajeros.length === 3, "Deberia contener tres pasajeros");
assert(
    habitacion238.reservas[0].voucher === "30243142",
    "Deberia conservar el voucher de la abuela y la nieta"
);
assert(
    habitacion238.reservas[1].voucher === "30243143",
    "Deberia conservar el voucher de la amiga"
);
assert(
    habitacion238.asignaciones.join(",") === "A,B,C",
    "Deberia conservar las asignaciones A/B/C"
);
assert(
    habitacion238.inventario.codigoTipo === "III" &&
    habitacion238.capacidad === 3,
    "Deberia conservar el inventario fisico de la habitacion"
);

console.log("OK habitaciones compartidas entre vouchers");
console.log("\nTodos los tests del Rooming pasaron.\n");
