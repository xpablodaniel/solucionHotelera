const {
    buildRoomingReport
} = require("../../src/output/roomingReport");


function assert(condition, message) {

    if (!condition) {
        throw new Error(`TEST FALLIDO: ${message}`);
    }
}


console.log("\n=== Tests del reporte de Rooming ===\n");


const reservas = [

    {
        voucher: "DUMMY-201",
        pasajeros: [
            {
                habitacion: {
                    numero: "110",
                    asignacion: null
                },
                estadia: {
                    ingreso: "20/09/2026",
                    egreso: "25/09/2026"
                },
                plazas: {
                    cantidad: 2,
                    ocupadas: 2
                },
                pax: {
                    tipoDocumento: "DNI",
                    numeroDocumento: "DUMMY201",
                    nombre: "ZETA PASAJERO",
                    edad: 58
                },
                servicios: "MEDIA PENSION",
                estado: "O",
                paquete: "PPJ",
                sede: "SECCIONAL DEMO",
                observacionHabitacion: null
            },
            {
                habitacion: {
                    numero: "110",
                    asignacion: null
                },
                estadia: {
                    ingreso: "20/09/2026",
                    egreso: "25/09/2026"
                },
                plazas: {
                    cantidad: 2,
                    ocupadas: 2
                },
                pax: {
                    tipoDocumento: "DNI",
                    numeroDocumento: "DUMMY202",
                    nombre: "ALFA PASAJERO",
                    edad: 60
                },
                servicios: "MEDIA PENSION",
                estado: "O",
                paquete: "PPJ",
                sede: "SECCIONAL DEMO",
                observacionHabitacion: null
            }
        ]
    },

    {
        voucher: "DUMMY-202",
        pasajeros: [
            {
                habitacion: {
                    numero: "109",
                    asignacion: null
                },
                estadia: {
                    ingreso: "20/09/2026",
                    egreso: "25/09/2026"
                },
                plazas: {
                    cantidad: 2,
                    ocupadas: 1
                },
                pax: {
                    tipoDocumento: "DNI",
                    numeroDocumento: "DUMMY203",
                    nombre: "BETA PASAJERO",
                    edad: 62
                },
                servicios: "MEDIA PENSION",
                estado: "O",
                paquete: "PPJ",
                sede: "SECCIONAL DEMO",
                observacionHabitacion: "CERCANA AL ASCENSOR"
            }
        ]
    }
];


console.log("Probando buildRoomingReport()...");

const reporte = buildRoomingReport(reservas);

assert(
    reporte.filas.length === 3,
    "El reporte deberia contener una fila por pasajero"
);

assert(
    reporte.estadisticas.reservas === 2,
    "Deberia contar dos reservas"
);

assert(
    reporte.estadisticas.pasajeros === 3,
    "Deberia contar tres pasajeros"
);

assert(
    reporte.estadisticas.habitaciones === 2,
    "Deberia contar dos habitaciones fisicas"
);

assert(
    reporte.filas[0].habitacion === "109" &&
        reporte.filas[0].voucher === "DUMMY-202",
    "La primera fila deberia ser la habitacion 109"
);

assert(
    reporte.filas[1].nombre === "ALFA PASAJERO" &&
        reporte.filas[2].nombre === "ZETA PASAJERO",
    "La misma habitacion deberia ordenarse por nombre"
);

assert(
    reporte.filas[0].cantidadPlazas === 2 &&
        reporte.filas[0].observacionHabitacion === "CERCANA AL ASCENSOR",
    "La fila deberia conservar capacidad y observacion"
);

assert(
    reporte.filas[0].servicio === "MEDIA PENSION" &&
        reporte.filas[0].estado === "O" &&
        reporte.filas[0].paquete === "PPJ" &&
        reporte.filas[0].sede === "SECCIONAL DEMO",
    "La fila deberia conservar los campos operativos"
);

let errorDetectado = false;

try {
    buildRoomingReport(null);
} catch (error) {
    errorDetectado = true;
}

assert(
    errorDetectado,
    "buildRoomingReport deberia validar la entrada"
);

console.log("OK reporte de Rooming");
