const {
    buildPcRoomingReport
} = require("../../src/output/roomingPcReport");


function assert(condition, message) {

    if (!condition) {
        throw new Error(`TEST FALLIDO: ${message}`);
    }
}


console.log("\n=== Tests del reporte Rooming PC ===\n");


const reservas = [

    {
        voucher: "DUMMY-PC-001",
        pasajeros: [
            {
                servicios: "Pensión Completa",
                habitacion: {
                    numero: "250",
                    asignacion: null
                },
                tipoHabitacion: "DOBLE INDIVIDUAL",
                estadia: {
                    ingreso: "20/09/2026",
                    egreso: "25/09/2026"
                },
                plazas: {
                    cantidad: 2
                },
                pax: {
                    tipoDocumento: "DNI",
                    numeroDocumento: "DUMMY-PC-001",
                    nombre: "ZETA PC",
                    edad: 65
                },
                observacionHabitacion: "PLANTA BAJA"
            },
            {
                servicios: "MEDIA PENSION",
                habitacion: {
                    numero: "250",
                    asignacion: null
                },
                tipoHabitacion: "DOBLE INDIVIDUAL",
                pax: {
                    nombre: "NO DEBE APARECER"
                }
            },
            {
                servicios: "PENSION COMPLETA",
                habitacion: {
                    numero: "249",
                    asignacion: null
                },
                tipoHabitacion: "TRIPLE A COMPARTIR",
                estadia: {
                    ingreso: "20/09/2026",
                    egreso: "25/09/2026"
                },
                plazas: {
                    cantidad: 3
                },
                pax: {
                    tipoDocumento: "DNI",
                    numeroDocumento: "DUMMY-PC-002",
                    nombre: "ALFA PC",
                    edad: 68
                },
                observacionHabitacion: null
            }
        ]
    }
];


const reporte = buildPcRoomingReport(reservas);

assert(
    reporte.filas.length === 2,
    "Solo deberian aparecer los pasajeros de Pension Completa"
);

assert(
    reporte.filas[0].habitacion === "249" &&
        reporte.filas[1].habitacion === "250",
    "Las filas deberian ordenarse por habitacion"
);

assert(
    reporte.filas[0].nombre === "ALFA PC" &&
        reporte.filas[1].nombre === "ZETA PC",
    "Las filas deberian conservar los nombres"
);

assert(
    reporte.filas[1].cantidadPlazas === 2 &&
        reporte.filas[1].tipoHabitacion === "DOBLE INDIVIDUAL" &&
        reporte.filas[1].observacionHabitacion === "PLANTA BAJA",
    "Deberia conservar plazas, tipo y observacion originales"
);

assert(
    !reporte.filas.some(fila => fila.nombre === "NO DEBE APARECER"),
    "Un pasajero de Media Pension no deberia aparecer"
);

assert(
    reporte.estadisticas.pasajeros === 2 &&
        reporte.estadisticas.habitaciones === 2,
    "Deberia calcular las estadisticas del reporte PC"
);

const reporteVacio = buildPcRoomingReport([]);

assert(
    reporteVacio.filas.length === 0 &&
        reporteVacio.estadisticas.pasajeros === 0,
    "Un array vacio deberia producir un reporte vacio"
);

let errorDetectado = false;

try {
    buildPcRoomingReport(null);
} catch (error) {
    errorDetectado = true;
}

assert(
    errorDetectado,
    "buildPcRoomingReport deberia validar la entrada"
);

console.log("OK reporte Rooming PC");
