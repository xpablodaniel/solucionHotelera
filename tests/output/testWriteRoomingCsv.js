const fs = require("fs");
const path = require("path");

const {
    writeRoomingCsv
} = require("../../src/output/writeRoomingCsv");


function assert(condition, message) {

    if (!condition) {
        throw new Error(`TEST FALLIDO: ${message}`);
    }
}


console.log("\n=== Tests de escritura del CSV de Rooming ===\n");


const temporaryDirectory = path.join(__dirname, "tmp");
const temporaryPath = path.join(
    temporaryDirectory,
    "reservas_ingresan_test.csv"
);

const csvInicial = [
    "Nro. habitación;Voucher;Apellido y nombre",
    "238;DUMMY-001;ABUELA DEMO",
    "238;DUMMY-002;AMIGA DEMO"
].join("\n");

const csvReemplazo = [
    "Nro. habitación;Voucher;Apellido y nombre",
    "109;DUMMY-101;PASAJERO UNO"
].join("\n");


try {

    fs.mkdirSync(temporaryDirectory, { recursive: true });
    writeRoomingCsv(csvInicial, temporaryPath);

    assert(
        fs.existsSync(temporaryPath),
        "Deberia crear el archivo de salida"
    );

    assert(
        fs.readFileSync(temporaryPath, "utf8") === csvInicial,
        "Deberia escribir exactamente el texto recibido"
    );

    assert(
        fs.readFileSync(temporaryPath, "utf8").includes(";"),
        "Deberia conservar el separador punto y coma"
    );

    assert(
        fs.readFileSync(temporaryPath, "utf8").includes("\n"),
        "Deberia conservar los saltos de linea"
    );

    writeRoomingCsv(csvReemplazo, temporaryPath);

    assert(
        fs.readFileSync(temporaryPath, "utf8") === csvReemplazo,
        "Deberia sobrescribir correctamente un archivo existente"
    );

    let errorDetectado = false;

    try {
        writeRoomingCsv(null, temporaryPath);
    } catch (error) {
        errorDetectado = true;
    }

    assert(
        errorDetectado,
        "Deberia rechazar un CSV que no sea string"
    );

    errorDetectado = false;

    try {
        writeRoomingCsv(csvInicial, "");
    } catch (error) {
        errorDetectado = true;
    }

    assert(
        errorDetectado,
        "Deberia rechazar una ruta vacia"
    );

    console.log("OK escritura del CSV de Rooming");

} finally {

    if (fs.existsSync(temporaryPath)) {
        fs.unlinkSync(temporaryPath);
    }

    if (fs.existsSync(temporaryDirectory)) {
        fs.rmdirSync(temporaryDirectory);
    }
}
