const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const {
    buildBalnearioVoucherReport
} = require("../../src/output/balnearioVoucherReport");
const {
    generateBalnearioVoucherPdf
} = require("../../src/output/balnearioVoucherPdf");


function assert(condition, message) {

    if (!condition) {
        throw new Error(`TEST FALLIDO: ${message}`);
    }
}


function passenger({ dni, nombre, habitacion, asignacion }) {

    return {
        hotel: "23 DE MAYO",
        habitacion: {
            original: `${habitacion} ${asignacion}`,
            numero: habitacion,
            asignacion
        },
        estadia: {
            ingreso: "23/09/2026",
            egreso: "27/09/2026"
        },
        pax: {
            numeroDocumento: dni,
            nombre
        }
    };
}


console.log("\n=== Tests de integracion del voucher Alicante ===\n");

const temporaryDirectory = path.join(__dirname, "tmp");
const outputPath = path.join(
    temporaryDirectory,
    "vouchers_alicante_integration.pdf"
);
const pasajeros = [
    passenger({
        dni: "30000000",
        nombre: "GOMEZ GRACIELA",
        habitacion: "238",
        asignacion: "A"
    }),
    passenger({
        dni: "10000000",
        nombre: "PEREZ JUAN",
        habitacion: "238",
        asignacion: "B"
    })
];

try {
    const reportes = buildBalnearioVoucherReport([{
        voucher: "VOUCHER-INTEGRACION",
        pasajeros
    }]);

    assert(reportes.length === 1, "Debe construirse un reporte Alicante");
    assert(
        reportes[0].titular.nombre === "GOMEZ GRACIELA" &&
            reportes[0].habitaciones.join(",") === "238",
        "El reporte debe conservar titular y habitacion visual"
    );

    const result = generateBalnearioVoucherPdf(reportes, outputPath);

    assert(result.cantidadVouchers === 1, "Debe generar un voucher");
    assert(fs.existsSync(outputPath), "Debe persistir el PDF integrado");

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
    const inspectionData = JSON.parse(inspection.stdout);

    assert(
        inspectionData.pages === 1 &&
            inspectionData.text.includes("GOMEZ GRACIELA") &&
            inspectionData.text.includes("238"),
        "La salida integrada debe contener los campos del reporte"
    );

    if (process.env.KEEP_PDF === "1") {
        console.log(`PDF integrado conservado: ${outputPath}`);
    }

    console.log("OK reporte, renderer y writer integrados");
} finally {
    if (process.env.KEEP_PDF !== "1") {
        if (fs.existsSync(outputPath)) {
            fs.unlinkSync(outputPath);
        }

        if (fs.existsSync(temporaryDirectory)) {
            fs.rmdirSync(temporaryDirectory);
        }
    }
}