const {
    escapeCsvValue,
    ROOMING_SEPARATOR
} = require("./roomingCsv");


const ROOMING_PC_HEADERS = [
    "Nro. habitación",
    "Fecha de ingreso",
    "Fecha de egreso",
    "Cantidad plazas",
    "Tipo documento",
    "Nro. doc.",
    "Apellido y nombre",
    "Edad",
    "Observación habitación",
    "Tipo habitación"
];


const ROOMING_PC_FIELDS = [
    "habitacion",
    "fechaIngreso",
    "fechaEgreso",
    "cantidadPlazas",
    "tipoDocumento",
    "numeroDocumento",
    "nombre",
    "edad",
    "observacionHabitacion",
    "tipoHabitacion"
];


function exportPcRoomingCsv(filas) {

    if (!Array.isArray(filas)) {
        throw new TypeError(
            "exportPcRoomingCsv espera un array de filas."
        );
    }

    const lines = [
        ROOMING_PC_HEADERS.map(escapeCsvValue).join(ROOMING_SEPARATOR)
    ];

    for (const fila of filas) {

        if (!fila || typeof fila !== "object") {
            continue;
        }

        lines.push(
            ROOMING_PC_FIELDS
                .map(campo => escapeCsvValue(fila[campo]))
                .join(ROOMING_SEPARATOR)
        );
    }

    return lines.join("\n");
}


if (typeof module !== "undefined" && module.exports) {

    module.exports = {
        exportPcRoomingCsv,
        ROOMING_PC_HEADERS,
        ROOMING_PC_FIELDS
    };
}
