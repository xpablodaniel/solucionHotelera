const fs = require("fs");


function writeVoucherHtml(html, ruta) {

    if (typeof html !== "string") {
        throw new TypeError(
            "writeVoucherHtml espera el contenido HTML como string."
        );
    }

    if (typeof ruta !== "string" || ruta.trim() === "") {
        throw new TypeError(
            "writeVoucherHtml espera una ruta de archivo valida."
        );
    }

    fs.writeFileSync(ruta, html, "utf8");
}


if (typeof module !== "undefined" && module.exports) {

    module.exports = {
        writeVoucherHtml
    };
}