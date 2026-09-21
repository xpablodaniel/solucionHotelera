const ROOMING_HEADERS = [
    "Nro. habitación",
    "Fecha de ingreso",
    "Fecha de egreso",
    "Cantidad plazas",
    "Tipo documento",
    "Nro. doc.",
    "Apellido y nombre",
    "Edad",
    "Voucher",
    "Servicio",
    "Estado",
    "Paquete",
    "Sede",
    "Observación habitación"
];


const ROOMING_FIELDS = [
    "habitacion",
    "fechaIngreso",
    "fechaEgreso",
    "cantidadPlazas",
    "tipoDocumento",
    "numeroDocumento",
    "nombre",
    "edad",
    "voucher",
    "servicio",
    "estado",
    "paquete",
    "sede",
    "observacionHabitacion"
];


const ROOMING_SEPARATOR = ";";


function escapeCsvValue(value) {

    if (value === null || value === undefined) {
        return "";
    }

    const text = String(value);

    if (/[;",\n\r]/.test(text)) {
        return `"${text.replace(/"/g, '""')}"`;
    }

    return text;
}


function exportRoomingCsv(filas) {

    if (!Array.isArray(filas)) {
        throw new TypeError(
            "exportRoomingCsv espera un array de filas."
        );
    }

    const lines = [
        ROOMING_HEADERS.map(escapeCsvValue).join(ROOMING_SEPARATOR)
    ];

    for (const fila of filas) {

        if (!fila || typeof fila !== "object") {
            continue;
        }

        lines.push(
            ROOMING_FIELDS
                .map(campo => escapeCsvValue(fila[campo]))
                .join(ROOMING_SEPARATOR)
        );
    }

    return lines.join("\n");
}


if (typeof module !== "undefined" && module.exports) {

    module.exports = {
        exportRoomingCsv,
        escapeCsvValue,
        ROOMING_HEADERS,
        ROOMING_FIELDS,
        ROOMING_SEPARATOR
    };
}
