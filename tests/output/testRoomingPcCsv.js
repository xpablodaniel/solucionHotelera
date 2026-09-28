const {
    exportPcRoomingCsv
} = require("../../src/output/roomingPcCsv");


function assert(condition, message) {

    if (!condition) {
        throw new Error(`TEST FALLIDO: ${message}`);
    }
}


console.log("\n=== Tests del exportador CSV de Rooming PC ===\n");


const filas = [
    {
        habitacion: "249",
        fechaIngreso: "20/09/2026",
        fechaEgreso: "25/09/2026",
        cantidadPlazas: 3,
        tipoDocumento: "DNI",
        numeroDocumento: "DUMMY-PC-002",
        nombre: "ALFA PC",
        edad: 68,
        observacionHabitacion: "CERCANA; ASCENSOR",
        tipoHabitacion: "TRIPLE A COMPARTIR",
        voucher: "DUMMY-PC-002",
        servicio: "PENSION COMPLETA"
    },
    {
        habitacion: "250",
        fechaIngreso: "20/09/2026",
        fechaEgreso: "25/09/2026",
        cantidadPlazas: 2,
        tipoDocumento: "DNI",
        numeroDocumento: "DUMMY-PC-001",
        nombre: "PASAJERO \"PC\"",
        edad: 65,
        observacionHabitacion: null,
        tipoHabitacion: "DOBLE INDIVIDUAL"
    }
];


const csv = exportPcRoomingCsv(filas);
const lineas = csv.split("\n");

assert(
    lineas[0] ===
        "Nro. habitación;Fecha de ingreso;Fecha de egreso;Cantidad plazas;Tipo documento;Nro. doc.;Apellido y nombre;Edad;Voucher;Observación habitación;Tipo habitación",
    "Deberia generar la cabecera de 11 columnas con voucher"
);

assert(
    lineas.length === 3 &&
        lineas[0].split(";").length === 11 &&
        lineas[1].includes("DUMMY-PC-002") &&
        lineas[2].includes("DUMMY-PC-001"),
    "Deberia generar dos filas con el contrato de 11 columnas"
);

assert(
    lineas[1].startsWith(
        "249;20/09/2026;25/09/2026;3;DNI;DUMMY-PC-002;ALFA PC;68;DUMMY-PC-002;"
    ),
    "Deberia conservar los campos de la primera fila"
);

assert(
    lineas[1].includes('"CERCANA; ASCENSOR"'),
    "Deberia escapar el separador en observaciones"
);

assert(
    csv.includes('"PASAJERO ""PC"""'),
    "Deberia escapar comillas en nombres"
);

assert(
    csv.includes("DUMMY-PC-002") &&
        !csv.includes("PENSION COMPLETA"),
    "Deberia exportar voucher sin incluir campos propios del Rooming MAP"
);

const csvVacio = exportPcRoomingCsv([]);

assert(
    csvVacio.split("\n").length === 1,
    "Un array vacio deberia producir solamente la cabecera"
);

let errorDetectado = false;

try {
    exportPcRoomingCsv(null);
} catch (error) {
    errorDetectado = true;
}

assert(
    errorDetectado,
    "Deberia validar que la entrada sea un array"
);

console.log("OK exportador CSV de Rooming PC");
