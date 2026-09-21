const fs = require("fs");
const path = require("path");

const {
    writePcRoomingCsv
} = require("../../src/output/writePcRoomingCsv");


function assert(condition, message) {

    if (!condition) {
        throw new Error(`TEST FALLIDO: ${message}`);
    }
}


console.log("\n=== Tests de escritura del CSV de Rooming PC ===\n");


const temporaryDirectory = path.join(__dirname, "tmp");
const temporaryPath = path.join(
    temporaryDirectory,
    "rooming_pc_jubilados_test.csv"
);

const csvInicial = [
    "Nro. habitación;Fecha de ingreso;Tipo habitación",
    "249;20/09/2026;TRIPLE A COMPARTIR",
    "250;20/09/2026;DOBLE INDIVIDUAL"
].join("\n");

const csvReemplazo = [
    "Nro. habitación;Fecha de ingreso;Tipo habitación",
    "251;21/09/2026;DOBLE MATRIMONIAL"
].join("\n");


try {

    fs.mkdirSync(temporaryDirectory, { recursive: true });
    writePcRoomingCsv(csvInicial, temporaryPath);

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

    writePcRoomingCsv(csvReemplazo, temporaryPath);

    assert(
        fs.readFileSync(temporaryPath, "utf8") === csvReemplazo,
        "Deberia sobrescribir correctamente un archivo existente"
    );

    let errorDetectado = false;

    try {
        writePcRoomingCsv(null, temporaryPath);
    } catch (error) {
        errorDetectado = true;
    }

    assert(
        errorDetectado,
        "Deberia rechazar un CSV que no sea string"
    );

    errorDetectado = false;

    try {
        writePcRoomingCsv(csvInicial, "");
    } catch (error) {
        errorDetectado = true;
    }

    assert(
        errorDetectado,
        "Deberia rechazar una ruta vacia"
    );

    console.log("OK escritura del CSV de Rooming PC");

} finally {

    if (fs.existsSync(temporaryPath)) {
        fs.unlinkSync(temporaryPath);
    }

    if (fs.existsSync(temporaryDirectory)) {
        fs.rmdirSync(temporaryDirectory);
    }
}
