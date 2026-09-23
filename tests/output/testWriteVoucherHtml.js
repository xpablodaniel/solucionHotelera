const fs = require("fs");
const path = require("path");

const {
    writeVoucherHtml
} = require("../../src/output/writeVoucherHtml");


function assert(condition, message) {

    if (!condition) {
        throw new Error(`TEST FALLIDO: ${message}`);
    }
}


console.log("\n=== Tests de escritura HTML de vouchers ===\n");


const temporaryDirectory = path.join(__dirname, "tmp");
const temporaryPath = path.join(
    temporaryDirectory,
    "vouchers_test.html"
);

const htmlInicial = "<!DOCTYPE html><html><body>MAP</body></html>";
const htmlReemplazo = "<!DOCTYPE html><html><body>PC</body></html>";


try {

    fs.mkdirSync(temporaryDirectory, { recursive: true });
    writeVoucherHtml(htmlInicial, temporaryPath);

    assert(
        fs.existsSync(temporaryPath),
        "Deberia crear el archivo HTML de salida"
    );

    assert(
        fs.readFileSync(temporaryPath, "utf8") === htmlInicial,
        "Deberia escribir exactamente el HTML recibido"
    );

    writeVoucherHtml(htmlReemplazo, temporaryPath);

    assert(
        fs.readFileSync(temporaryPath, "utf8") === htmlReemplazo,
        "Deberia sobrescribir correctamente un archivo existente"
    );

    let errorDetectado = false;

    try {
        writeVoucherHtml(null, temporaryPath);
    } catch (error) {
        errorDetectado = true;
    }

    assert(
        errorDetectado,
        "Deberia rechazar contenido que no sea string"
    );

    errorDetectado = false;

    try {
        writeVoucherHtml(htmlInicial, "");
    } catch (error) {
        errorDetectado = true;
    }

    assert(
        errorDetectado,
        "Deberia rechazar una ruta vacia"
    );

    console.log("OK escritura HTML de vouchers");

} finally {

    if (fs.existsSync(temporaryPath)) {
        fs.unlinkSync(temporaryPath);
    }

    if (fs.existsSync(temporaryDirectory)) {
        fs.rmdirSync(temporaryDirectory);
    }
}