const fs = require("fs");
const path = require("path");

const {
    generateMealVoucherPdf,
    DEFAULT_POSITIONS,
    DEFAULT_TEMPLATE
} = require("../../src/output/mealVoucherPdf");


function assert(condition, message) {

    if (!condition) {
        throw new Error(`TEST FALLIDO: ${message}`);
    }
}


console.log("\n=== Tests de generacion PDF de Voucher de Comida Diario ===\n");


const temporaryDirectory = path.join(__dirname, "tmp");
const outputPath = path.join(
    temporaryDirectory,
    "voucher_cena_test.pdf"
);
const data = {
    nombre: "PEREZ JUAN",
    dni: "12345678",
    hotel: "31 DE AGOSTO",
    fecha: "23/09/2026",
    habitacion: "238",
    cantidadPersonas: 3
};


try {

    assert(
        fs.existsSync(DEFAULT_TEMPLATE),
        "Deberia existir la plantilla PDF"
    );

    assert(
        fs.existsSync(DEFAULT_POSITIONS),
        "Deberia existir positions.json"
    );

    fs.mkdirSync(temporaryDirectory, { recursive: true });
    const result = generateMealVoucherPdf(data, outputPath);

    assert(
        result.outputPath === outputPath,
        "Deberia devolver la ruta de salida"
    );

    assert(
        result.filename === "voucher_cena_12345678_2026-09-23.pdf",
        "Deberia devolver el nombre de archivo esperado"
    );

    assert(
        fs.existsSync(outputPath),
        "Deberia crear el PDF de salida"
    );

    const pdfHeader = fs.readFileSync(outputPath).subarray(0, 5).toString();

    assert(
        pdfHeader === "%PDF-",
        "El archivo generado deberia ser un PDF valido"
    );

    console.log("OK plantilla, posiciones y generacion PDF");

} finally {

    if (fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath);
    }

    if (fs.existsSync(temporaryDirectory)) {
        fs.rmdirSync(temporaryDirectory);
    }
}
