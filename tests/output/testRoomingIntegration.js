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

const {
    writeRoomingCsv
} = require("../../src/output/writeRoomingCsv");


function assert(condition, message) {

    if (!condition) {
        throw new Error(`TEST FALLIDO: ${message}`);
    }
}


console.log("\n=== Integracion completa del Rooming MAP ===\n");


const fixturePath = path.join(
    __dirname,
    "../fixtures/reservas_contingente.csv"
);

const temporaryDirectory = path.join(__dirname, "tmp");
const temporaryPath = path.join(
    temporaryDirectory,
    "reservas_ingresan_integration.csv"
);


try {

    const csvEntrada = fs.readFileSync(fixturePath, "utf8");
    const registros = parseCSV(csvEntrada);
    const reservas = processReservations(registros);
    const reporte = buildRoomingReport(reservas);
    const csvSalida = exportRoomingCsv(reporte.filas);

    fs.mkdirSync(temporaryDirectory, { recursive: true });
    writeRoomingCsv(csvSalida, temporaryPath);

    assert(
        registros.length === 3,
        "El fixture deberia producir tres registros"
    );

    assert(
        reservas.length === 2,
        "El fixture deberia producir dos reservas"
    );

    assert(
        reporte.filas.length === 3,
        "El reporte deberia producir una fila por pasajero"
    );

    assert(
        fs.existsSync(temporaryPath),
        "La integracion deberia crear el archivo temporal"
    );

    const archivoGenerado = fs.readFileSync(temporaryPath, "utf8");

    assert(
        archivoGenerado === csvSalida,
        "El archivo deberia conservar exactamente el CSV exportado"
    );

    assert(
        archivoGenerado.startsWith(
            "Nro. habitación;Fecha de ingreso;Fecha de egreso;Cantidad plazas;Tipo documento;Nro. doc.;Apellido y nombre;Edad;Voucher;Servicio;Estado;Paquete;Sede;Observación habitación"
        ),
        "El archivo deberia contener la cabecera historica"
    );

    assert(
        archivoGenerado.includes("ABUELA DEMO") &&
            archivoGenerado.includes("NIETA DEMO") &&
            archivoGenerado.includes("AMIGA DEMO"),
        "El archivo deberia contener los tres pasajeros"
    );

    assert(
        archivoGenerado.includes("DUMMY-001") &&
            archivoGenerado.includes("DUMMY-002"),
        "El archivo deberia conservar los dos vouchers"
    );

    assert(
        archivoGenerado.indexOf("DUMMY-001") <
            archivoGenerado.indexOf("DUMMY-002"),
        "Los vouchers deberian conservar el orden del reporte"
    );

    console.log("OK integracion completa del Rooming MAP");

} finally {

    if (fs.existsSync(temporaryPath)) {
        fs.unlinkSync(temporaryPath);
    }

    if (fs.existsSync(temporaryDirectory)) {
        fs.rmdirSync(temporaryDirectory);
    }
}
