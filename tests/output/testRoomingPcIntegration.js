const fs = require("fs");
const path = require("path");

const {
    parseCSV
} = require("../../src/parser/csvParser");

const {
    processReservations
} = require("../../src/business/processReservations");

const {
    buildPcRoomingReport
} = require("../../src/output/roomingPcReport");

const {
    exportPcRoomingCsv
} = require("../../src/output/roomingPcCsv");

const {
    writePcRoomingCsv
} = require("../../src/output/writePcRoomingCsv");


function assert(condition, message) {

    if (!condition) {
        throw new Error(`TEST FALLIDO: ${message}`);
    }
}


console.log("\n=== Integracion completa del Rooming PC ===\n");


const header = "Cód. Alojamiento,Descripción,Nro. habitación,Tipo habitación,Observación habitación,Cantidad plazas,Voucher,Sede,Fecha de ingreso,Fecha de egreso,Plazas ocupadas,Tipo documento,Nro. doc.,Apellido y nombre,Edad,Entidad,Servicios,Paquete,Transporte,Fecha viaje,Hora viaje,Parada,Email,Estado,Fecha de nacimiento,Teléfono,Celular,Usuario";

const csvEntrada = [
    header,
    "900,HOTEL DEMO,249,TRIPLE A COMPARTIR,,3,DUMMY-PC-002,SECCIONAL DEMO,20/09/2026,25/09/2026,1,DNI,DUMMY-PC-002,ALFA PC,68,SUTEBA,PENSION COMPLETA,PPJ,Sin Transporte,20/09/2026,,,demo@example.com,O,01/01/1958,0,,usuario",
    "900,HOTEL DEMO,250,DOBLE INDIVIDUAL,PLANTA BAJA,2,DUMMY-PC-001,SECCIONAL DEMO,20/09/2026,25/09/2026,1,DNI,DUMMY-PC-001,ZETA PC,65,SUTEBA,Pensión Completa,PPJ,Sin Transporte,20/09/2026,,,demo@example.com,O,01/01/1961,0,,usuario",
    "900,HOTEL DEMO,251,DOBLE INDIVIDUAL,,2,DUMMY-MAP-001,SECCIONAL DEMO,20/09/2026,25/09/2026,1,DNI,DUMMY-MAP-001,NO DEBE APARECER,60,SUTEBA,MEDIA PENSION,PPJ,Sin Transporte,20/09/2026,,,demo@example.com,O,01/01/1966,0,,usuario"
].join("\n");

const temporaryDirectory = path.join(__dirname, "tmp");
const temporaryPath = path.join(
    temporaryDirectory,
    "rooming_pc_jubilados_integration.csv"
);


try {

    const registros = parseCSV(csvEntrada);
    const reservas = processReservations(registros);
    const reporte = buildPcRoomingReport(reservas);
    const csvSalida = exportPcRoomingCsv(reporte.filas);

    fs.mkdirSync(temporaryDirectory, { recursive: true });
    writePcRoomingCsv(csvSalida, temporaryPath);

    assert(
        registros.length === 3,
        "El CSV dummy deberia producir tres registros"
    );

    assert(
        reservas.length === 3,
        "El CSV dummy deberia producir tres reservas"
    );

    assert(
        reporte.filas.length === 2,
        "El reporte PC deberia conservar solo dos pasajeros"
    );

    assert(
        reporte.filas[0].nombre === "ALFA PC" &&
            reporte.filas[1].nombre === "ZETA PC",
        "El reporte PC deberia ordenar por habitacion y nombre"
    );

    assert(
        !csvSalida.includes("NO DEBE APARECER") &&
            !csvSalida.includes("DUMMY-MAP-001"),
        "MEDIA PENSION deberia quedar excluida"
    );

    assert(
        csvSalida.split("\n").length === 3 &&
            csvSalida.split("\n")[0].split(";").length === 10,
        "El CSV PC deberia tener cabecera y dos filas de 10 columnas"
    );

    assert(
        fs.existsSync(temporaryPath),
        "La integracion deberia crear el archivo temporal"
    );

    assert(
        fs.readFileSync(temporaryPath, "utf8") === csvSalida,
        "El archivo deberia conservar exactamente la salida PC"
    );

    console.log("OK integracion completa del Rooming PC");

} finally {

    if (fs.existsSync(temporaryPath)) {
        fs.unlinkSync(temporaryPath);
    }

    if (fs.existsSync(temporaryDirectory)) {
        fs.rmdirSync(temporaryDirectory);
    }
}
