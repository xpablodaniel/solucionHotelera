const {
    buildPcRoomingReport
} = require("../../src/output/roomingPcReport");

const {
    exportPcRoomingCsv
} = require("../../src/output/roomingPcCsv");


function assert(condition, message) {

    if (!condition) {
        throw new Error(`TEST FALLIDO: ${message}`);
    }
}


console.log("\n=== Comparacion de compatibilidad del Rooming PC ===\n");


const reservas = [

    {
        voucher: "DUMMY-PC-001",
        pasajeros: [
            {
                servicios: "Pensión Completa",
                alojamiento: "900",
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
                alojamiento: "901",
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
const csv = exportPcRoomingCsv(reporte.filas);
const lineas = csv.split("\n");


assert(
    lineas[0] ===
        "Nro. habitación;Fecha de ingreso;Fecha de egreso;Cantidad plazas;Tipo documento;Nro. doc.;Apellido y nombre;Edad;Voucher;Observación habitación;Tipo habitación;Alojamiento",
    "La cabecera deberia incluir voucher"
);

assert(
    reporte.filas.length === 2 && lineas.length === 3,
    "La salida deberia tener una fila por pasajero PC"
);

assert(
    reporte.filas[0].habitacion === "249" &&
        reporte.filas[0].nombre === "ALFA PC" &&
        reporte.filas[1].habitacion === "250" &&
        reporte.filas[1].nombre === "ZETA PC",
    "La salida deberia ordenar por habitacion y nombre"
);

assert(
    lineas[1].startsWith(
        "249;20/09/2026;25/09/2026;3;DNI;DUMMY-PC-002;ALFA PC;68;DUMMY-PC-001;"
    ) &&
        lineas[2].startsWith(
            "250;20/09/2026;25/09/2026;2;DNI;DUMMY-PC-001;ZETA PC;65;DUMMY-PC-001;"
        ),
    "Las filas deberian conservar los campos operativos"
);

assert(
    lineas[1].endsWith(";TRIPLE A COMPARTIR;901") &&
        lineas[2].endsWith("PLANTA BAJA;DOBLE INDIVIDUAL;900"),
    "La salida deberia conservar observacion y tipo de habitacion"
);

assert(
    lineas.every(linea => linea.split(";").length === 12),
    "Cada fila deberia conservar 11 columnas y agregar alojamiento"
);

assert(
    csv.includes("Voucher") &&
        csv.includes("DUMMY-PC-001") &&
        !csv.includes("NO DEBE APARECER") &&
        !csv.includes("Servicio"),
    "La salida PC deberia incluir voucher sin campos MAP ni pasajeros excluidos"
);

console.log("OK comparacion de compatibilidad del Rooming PC");
