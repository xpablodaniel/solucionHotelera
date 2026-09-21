const fs = require("fs");
const path = require("path");

const {
    parseCSV
} = require("../../src/parser/csvParser");

const {
    processReservations
} = require("../../src/business/processReservations");

const {
    buildRoomingReport
} = require("../../src/output/roomingReport");

const {
    exportRoomingCsv
} = require("../../src/output/roomingCsv");


function assert(condition, message) {

    if (!condition) {
        throw new Error(`TEST FALLIDO: ${message}`);
    }
}


console.log("\n=== Comparacion de compatibilidad del Rooming ===\n");


const csvPath = path.join(
    __dirname,
    "../fixtures/reservas_contingente.csv"
);

const csv = fs.readFileSync(csvPath, "utf8");
const reservas = processReservations(parseCSV(csv));
const reporte = buildRoomingReport(reservas);
const salida = exportRoomingCsv(reporte.filas);
const lineas = salida.split("\n");


assert(
    lineas[0] ===
        "Nro. habitación;Fecha de ingreso;Fecha de egreso;Cantidad plazas;Tipo documento;Nro. doc.;Apellido y nombre;Edad;Voucher;Servicio;Estado;Paquete;Sede;Observación habitación",
    "La cabecera deberia respetar el separador del listado original"
);

assert(
    reporte.filas.length === 3 && lineas.length === 4,
    "La salida deberia conservar una fila por pasajero"
);

assert(
    reporte.filas[0].habitacion === "238" &&
        reporte.filas[0].nombre === "ABUELA DEMO" &&
        reporte.filas[0].voucher === "DUMMY-001",
    "La primera fila deberia conservar habitacion, nombre y voucher"
);

assert(
    salida.includes("DUMMY-001") && salida.includes("DUMMY-002"),
    "La salida deberia conservar ambos vouchers"
);

assert(
    salida.indexOf("DUMMY-001") < salida.indexOf("DUMMY-002"),
    "La salida deberia conservar el orden por nombre dentro de la habitacion"
);

assert(
    lineas.every(linea => linea.split(";").length === 14),
    "Cada fila deberia conservar las 14 columnas del contrato original"
);

console.log("OK comparacion de compatibilidad del Rooming");
