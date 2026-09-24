const fs = require("fs");
const path = require("path");

const {
    generateBalnearioVoucherPdf
} = require("../../src/output/balnearioVoucherPdf");
const {
    writeBalnearioVoucherPdf
} = require("../../src/output/writeBalnearioVoucherPdf");


function assert(condition, message) {

    if (!condition) {
        throw new Error(`TEST FALLIDO: ${message}`);
    }
}


console.log("\n=== Tests del writer PDF Alicante ===\n");

const temporaryDirectory = path.join(__dirname, "tmp");
const generatedPath = path.join(
    temporaryDirectory,
    "vouchers_alicante_generated.pdf"
);
const outputPath = path.join(
    temporaryDirectory,
    "vouchers_alicante_written.pdf"
);
const reports = [{
    voucher: "VOUCHER-WRITER",
    titular: {
        nombre: "GOMEZ GRACIELA",
        dni: "30000000"
    },
    hotel: "23 DE MAYO",
    habitaciones: ["238"],
    fechaIngreso: "23/09/2026",
    fechaEgreso: "27/09/2026",
    cantidadPasajeros: 2
}];

try {
    fs.mkdirSync(temporaryDirectory, { recursive: true });

    generateBalnearioVoucherPdf(reports, generatedPath);
    const pdfBuffer = fs.readFileSync(generatedPath);
    writeBalnearioVoucherPdf(pdfBuffer, outputPath);

    assert(
        fs.existsSync(outputPath),
        "El writer debe crear el archivo PDF"
    );

    assert(
        fs.readFileSync(outputPath).equals(pdfBuffer),
        "El writer debe conservar exactamente el contenido binario"
    );

    let errorDetectado = false;
    try {
        writeBalnearioVoucherPdf("no es un buffer", outputPath);
    } catch (error) {
        errorDetectado = true;
    }

    assert(
        errorDetectado,
        "El writer debe rechazar contenido que no sea Buffer"
    );

    errorDetectado = false;
    try {
        writeBalnearioVoucherPdf(pdfBuffer, "");
    } catch (error) {
        errorDetectado = true;
    }

    assert(
        errorDetectado,
        "El writer debe rechazar una ruta vacia"
    );

    console.log("OK escritura binaria, contenido y validaciones");
} finally {
    if (fs.existsSync(generatedPath)) {
        fs.unlinkSync(generatedPath);
    }

    if (fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath);
    }

    if (fs.existsSync(temporaryDirectory)) {
        fs.rmdirSync(temporaryDirectory);
    }
}