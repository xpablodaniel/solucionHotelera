const fs = require("fs");


function writeBalnearioVoucherPdf(pdfBuffer, outputPath) {

    if (!Buffer.isBuffer(pdfBuffer)) {
        throw new TypeError(
            "writeBalnearioVoucherPdf espera el contenido PDF como Buffer."
        );
    }

    if (typeof outputPath !== "string" || outputPath.trim() === "") {
        throw new TypeError(
            "writeBalnearioVoucherPdf espera una ruta de archivo valida."
        );
    }

    fs.writeFileSync(outputPath, pdfBuffer);
}


if (typeof module !== "undefined" && module.exports) {

    module.exports = {
        writeBalnearioVoucherPdf
    };
}