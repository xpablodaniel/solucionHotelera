const fs = require("fs");


function writeRoomingCsv(csv, ruta) {

    if (typeof csv !== "string") {
        throw new TypeError(
            "writeRoomingCsv espera el contenido CSV como string."
        );
    }

    if (typeof ruta !== "string" || ruta.trim() === "") {
        throw new TypeError(
            "writeRoomingCsv espera una ruta de archivo valida."
        );
    }

    fs.writeFileSync(ruta, csv, "utf8");
}


if (typeof module !== "undefined" && module.exports) {

    module.exports = {
        writeRoomingCsv
    };
}
