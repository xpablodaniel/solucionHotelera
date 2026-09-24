const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const {
    writeBalnearioVoucherPdf
} = require("./writeBalnearioVoucherPdf");


const PROJECT_ROOT = path.resolve(__dirname, "../..");
const DEFAULT_TEMPLATE = path.join(
    PROJECT_ROOT,
    "python/balneario/VOUCHER_ALICANTE.pdf"
);
const DEFAULT_POSITIONS = path.join(
    PROJECT_ROOT,
    "python/balneario/positions.json"
);
const GENERATOR = path.join(
    PROJECT_ROOT,
    "python/balneario/generate_pdf.py"
);


function validateReports(reportes) {

    if (!Array.isArray(reportes) || reportes.length === 0) {
        throw new TypeError(
            "renderBalnearioVoucherPdf espera un array no vacio de reportes."
        );
    }
}


function resolvePaths(options) {

    const templatePath = options.templatePath || DEFAULT_TEMPLATE;
    const positionsPath = options.positionsPath || DEFAULT_POSITIONS;

    if (!fs.existsSync(templatePath)) {
        throw new Error(`No existe la plantilla PDF: ${templatePath}`);
    }

    if (!fs.existsSync(positionsPath)) {
        throw new Error(`No existe positions.json: ${positionsPath}`);
    }

    return {
        templatePath,
        positionsPath
    };
}


function runGenerator(reportes, outputPath, options) {

    const { templatePath, positionsPath } = resolvePaths(options);

    const request = JSON.stringify({
        templatePath,
        positionsPath,
        outputPath,
        reports: reportes
    });
    const result = spawnSync(
        options.python || "python3",
        [options.generatorPath || GENERATOR],
        {
            input: request,
            encoding: "utf8"
        }
    );

    if (result.status !== 0) {
        throw new Error(
            result.stderr.trim() || "No se pudo generar el PDF Alicante."
        );
    }
}


function renderBalnearioVoucherPdf(reportes, options = {}) {

    validateReports(reportes);

    const temporaryDirectory = fs.mkdtempSync(
        path.join(os.tmpdir(), "balneario-voucher-")
    );
    const temporaryOutput = path.join(
        temporaryDirectory,
        "vouchers_alicante.pdf"
    );

    try {
        runGenerator(reportes, temporaryOutput, options);
        return fs.readFileSync(temporaryOutput);
    } finally {
        if (fs.existsSync(temporaryOutput)) {
            fs.unlinkSync(temporaryOutput);
        }

        if (fs.existsSync(temporaryDirectory)) {
            fs.rmdirSync(temporaryDirectory);
        }
    }
}


function generateBalnearioVoucherPdf(reportes, outputPath, options = {}) {

    validateReports(reportes);

    if (typeof outputPath !== "string" || outputPath.trim() === "") {
        throw new TypeError(
            "generateBalnearioVoucherPdf espera una ruta de salida valida."
        );
    }

    const pdfBuffer = renderBalnearioVoucherPdf(reportes, options);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    writeBalnearioVoucherPdf(pdfBuffer, outputPath);

    return {
        outputPath,
        cantidadVouchers: reportes.length,
        cantidadPaginas: Math.ceil(reportes.length / 3)
    };
}


if (typeof module !== "undefined" && module.exports) {

    module.exports = {
        renderBalnearioVoucherPdf,
        generateBalnearioVoucherPdf,
        DEFAULT_TEMPLATE,
        DEFAULT_POSITIONS
    };
}