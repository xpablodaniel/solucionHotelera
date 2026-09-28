const {
    exportRoomingCsv
} = require("../../src/output/roomingCsv");


function assert(condition, message) {

    if (!condition) {
        throw new Error(`TEST FALLIDO: ${message}`);
    }
}


console.log("\n=== Tests del exportador CSV de Rooming ===\n");


const filas = [
    {
        habitacion: "238",
        fechaIngreso: "20/09/2026",
        fechaEgreso: "27/09/2026",
        cantidadPlazas: 3,
        tipoDocumento: "DNI",
        numeroDocumento: "DUMMY001",
        nombre: "ABUELA DEMO",
        edad: 70,
        voucher: "DUMMY-001",
        alojamiento: "900",
        servicio: "MEDIA PENSION",
        estado: "O",
        paquete: "PPJ",
        sede: "SECCIONAL DEMO",
        observacionHabitacion: "CERCANA, ASCENSOR"
    },
    {
        habitacion: "238",
        fechaIngreso: "20/09/2026",
        fechaEgreso: "27/09/2026",
        cantidadPlazas: 3,
        tipoDocumento: "DNI",
        numeroDocumento: "DUMMY003",
        nombre: "AMIGA \"DEMO\"",
        edad: 68,
        voucher: "DUMMY-002",
        alojamiento: "900",
        servicio: "MEDIA PENSION",
        estado: "O",
        paquete: "PPJ",
        sede: "SECCIONAL DEMO",
        observacionHabitacion: "Línea 1\nLínea 2"
    },
    {
        habitacion: "9",
        voucher: "DUMMY-003",
        alojamiento: "901"
    },
    {
        habitacion: "101",
        voucher: "DUMMY-004"
    }
];


console.log("Probando exportRoomingCsv()...");

const csv = exportRoomingCsv(filas);
const lineas = csv.split("\n");

assert(
    lineas[0] ===
        "Nro. habitación;Fecha de ingreso;Fecha de egreso;Cantidad plazas;Tipo documento;Nro. doc.;Apellido y nombre;Edad;Voucher;Servicio;Estado;Paquete;Sede;Observación habitación;Alojamiento",
    "Deberia generar la cabecera en el orden del contrato"
);

assert(
    lineas[1].startsWith("238;20/09/2026;27/09/2026;3;DNI;DUMMY001;ABUELA DEMO;70;DUMMY-001"),
    "Deberia conservar la primera fila y su voucher"
);

assert(
    lineas[1].includes('"CERCANA, ASCENSOR"'),
    "Deberia escapar campos con comas"
);

assert(
    csv.includes('"Línea 1\nLínea 2";900') &&
        csv.includes("DUMMY-003") &&
        csv.includes(";901\n") &&
        csv.endsWith(";"),
    "Deberia exportar ambos codigos y dejar vacio el alojamiento historico"
);

assert(
    csv.includes('"AMIGA ""DEMO"""'),
    "Deberia escapar comillas duplicandolas"
);

assert(
    csv.includes('"Línea 1\nLínea 2"'),
    "Deberia escapar saltos de linea"
);

assert(
    csv.indexOf("DUMMY-001") < csv.indexOf("DUMMY-002"),
    "Deberia conservar el orden recibido y los vouchers separados"
);

const csvVacio = exportRoomingCsv([]);

assert(
    csvVacio.split("\n").length === 1,
    "Un array vacio deberia producir solamente la cabecera"
);

assert(
    csvVacio.startsWith("Nro. habitación;"),
    "Un array vacio deberia conservar la cabecera"
);

let errorDetectado = false;

try {
    exportRoomingCsv(null);
} catch (error) {
    errorDetectado = true;
}

assert(
    errorDetectado,
    "exportRoomingCsv deberia validar la entrada"
);

console.log("OK exportador CSV de Rooming");
