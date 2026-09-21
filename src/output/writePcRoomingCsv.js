const fs = require("fs");


function writePcRoomingCsv(csv, ruta) {

    if (typeof csv !== "string") {
        throw new TypeError(
            "writePcRoomingCsv espera el contenido CSV como string."
        );
    }

    if (typeof ruta !== "string" || ruta.trim() === "") {
        throw new TypeError(
            "writePcRoomingCsv espera una ruta de archivo valida."
        );
    }

    fs.writeFileSync(ruta, csv, "utf8");
}


if (typeof module !== "undefined" && module.exports) {

    module.exports = {
        writePcRoomingCsv
    };
}
