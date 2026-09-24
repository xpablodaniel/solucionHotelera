const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const {
    generateBalnearioVoucherPdf,
    DEFAULT_TEMPLATE,
    DEFAULT_POSITIONS
} = require("../../src/output/balnearioVoucherPdf");


function assert(condition, message) {

    if (!condition) {
        throw new Error(`TEST FALLIDO: ${message}`);
    }
}


console.log("\n=== Tests del renderer PDF Alicante ===\n");

const temporaryDirectory = path.join(__dirname, "tmp");
const outputPath = path.join(
    temporaryDirectory,
    "vouchers_alicante_test.pdf"
);
const keepOutput = process.env.KEEP_PDF === "1";
const report = {
    voucher: "VOUCHER-PDF",
    titular: {
        nombre: "GOMEZ GRACIELA",
        dni: "30000000"
    },
    hotel: "31 DE AGOSTO",
    habitaciones: ["238", "239"],
    fechaIngreso: "23/09/2026",
    fechaEgreso: "27/09/2026",
    cantidadPasajeros: 2
};
const reportHotel23 = {
    ...report,
    voucher: "VOUCHER-PDF-23",
    hotel: "23 DE MAYO"
};
const reportHotel31 = {
    ...report,
    voucher: "VOUCHER-PDF-31",
    hotel: "31 DE AGOSTO"
};

try {
    assert(fs.existsSync(DEFAULT_TEMPLATE), "Debe existir la plantilla Alicante");
    assert(fs.existsSync(DEFAULT_POSITIONS), "Debe existir positions.json Alicante");

    fs.mkdirSync(temporaryDirectory, { recursive: true });
    const result = generateBalnearioVoucherPdf(
        [
            reportHotel23,
            reportHotel31,
            { ...reportHotel23, voucher: "VOUCHER-PDF-23-2" },
            { ...reportHotel31, voucher: "VOUCHER-PDF-31-2" }
        ],
        outputPath
    );

    assert(result.cantidadVouchers === 4, "Debe informar cuatro vouchers");
    assert(result.cantidadPaginas === 2, "Debe crear dos paginas para cuatro vouchers");
    assert(fs.existsSync(outputPath), "Debe crear el PDF de salida");
    assert(
        fs.readFileSync(outputPath).subarray(0, 5).toString() === "%PDF-",
        "El archivo generado debe ser un PDF valido"
    );

    const inspection = spawnSync(
        "python3",
        [
            "-c",
            [
                "import json, sys",
                "from pypdf import PdfReader",
                "reader = PdfReader(sys.argv[1])",
                "text = '\\n'.join(page.extract_text() or '' for page in reader.pages)",
                "print(json.dumps({'pages': len(reader.pages), 'text': text}))"
            ].join(";"),
            outputPath
        ],
        { encoding: "utf8" }
    );

    assert(
        inspection.status === 0,
        "El PDF generado debe poder inspeccionarse con pypdf"
    );

    const inspectionData = JSON.parse(inspection.stdout);
    assert(
        inspectionData.pages === 2,
        "El PDF real debe contener dos paginas"
    );
    assert(
        inspectionData.text.includes("GOMEZ GRACIELA") &&
            inspectionData.text.includes("23 DE MAYO") &&
            !inspectionData.text.includes("31 DE AGOSTO") &&
            inspectionData.text.includes("238, 239"),
        "El PDF real debe conservar el hotel impreso sin superponer el dato CSV"
    );

    console.log("OK plantilla, posiciones, paginacion y generacion PDF");

    if (keepOutput) {
        console.log(`PDF conservado para inspeccion: ${outputPath}`);
    }
} finally {
    if (!keepOutput && fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath);
    }

    if (!keepOutput && fs.existsSync(temporaryDirectory)) {
        fs.rmdirSync(temporaryDirectory);
    }
}