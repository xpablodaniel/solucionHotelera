const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const {
    mealVoucherFilename,
    validateMealVoucher
} = require("../business/mealVoucher");


const PROJECT_ROOT = path.resolve(__dirname, "../..");
const DEFAULT_TEMPLATE = path.join(
    PROJECT_ROOT,
    "python/mealVoucher/VOUCHER_DE_COMIDAS_DIARIO.pdf"
);
const DEFAULT_POSITIONS = path.join(
    PROJECT_ROOT,
    "python/mealVoucher/positions.json"
);
const GENERATOR = path.join(
    PROJECT_ROOT,
    "python/mealVoucher/generate_pdf.py"
);


function generateMealVoucherPdf(data, outputPath, options = {}) {

    const voucher = validateMealVoucher(data);

    if (typeof outputPath !== "string" || outputPath.trim() === "") {
        throw new TypeError(
            "generateMealVoucherPdf espera una ruta de salida valida."
        );
    }

    const templatePath = options.templatePath || DEFAULT_TEMPLATE;
    const positionsPath = options.positionsPath || DEFAULT_POSITIONS;

    if (!fs.existsSync(templatePath)) {
        throw new Error(`No existe la plantilla PDF: ${templatePath}`);
    }

    if (!fs.existsSync(positionsPath)) {
        throw new Error(`No existe positions.json: ${positionsPath}`);
    }

    const request = JSON.stringify({
        templatePath,
        positionsPath,
        outputPath,
        data: voucher
    });
    const result = spawnSync(
        options.python || "python3",
        [GENERATOR],
        {
            input: request,
            encoding: "utf8"
        }
    );

    if (result.status !== 0) {
        throw new Error(
            result.stderr.trim() || "No se pudo generar el PDF del voucher."
        );
    }

    return {
        outputPath,
        filename: mealVoucherFilename(voucher)
    };
}


if (typeof module !== "undefined" && module.exports) {

    module.exports = {
        generateMealVoucherPdf,
        DEFAULT_POSITIONS,
        DEFAULT_TEMPLATE
    };
}
