/**
 * Catalogo de configuraciones fisicas de camas.
 *
 * Este modulo describe el inventario del hotel. No asigna camas a pasajeros,
 * no interpreta relaciones y no modifica habitaciones del Rooming.
 */


function freezeConfiguration(codigoTipo, tipo, capacidad, camas) {

    return Object.freeze({
        codigoTipo,
        tipo,
        capacidad,
        camas: Object.freeze(
            camas.map(cama => Object.freeze({ ...cama }))
        )
    });
}


const ROOM_TYPES = Object.freeze({

    II: freezeConfiguration(
        "II",
        "DOBLE INDIVIDUAL",
        2,
        [
            { tipo: "INDIVIDUAL", cantidad: 2 }
        ]
    ),

    X: freezeConfiguration(
        "X",
        "DOBLE MATRIMONIAL",
        2,
        [
            { tipo: "MATRIMONIAL", cantidad: 1 }
        ]
    ),

    III: freezeConfiguration(
        "III",
        "TRIPLE INDIVIDUAL",
        3,
        [
            { tipo: "INDIVIDUAL", cantidad: 3 }
        ]
    ),

    XI: freezeConfiguration(
        "XI",
        "TRIPLE MATRIMONIAL",
        3,
        [
            { tipo: "MATRIMONIAL", cantidad: 1 },
            { tipo: "INDIVIDUAL", cantidad: 1 }
        ]
    ),

    XII: freezeConfiguration(
        "XII",
        "CUADRUPLE",
        4,
        [
            { tipo: "INDIVIDUAL", cantidad: 4 }
        ]
    )

});


const BED_CONFIGURATIONS = Object.freeze(
    Object.values(ROOM_TYPES)
);


function getBedConfiguration(codigoTipo) {

    const configuracion = ROOM_TYPES[codigoTipo];

    if (!configuracion) {
        throw new Error(
            `Codigo de tipo de habitacion desconocido: ${codigoTipo}`
        );
    }

    return configuracion;
}


function getAllBedConfigurations() {

    return BED_CONFIGURATIONS;
}


if (typeof module !== "undefined" && module.exports) {

    module.exports = {
        ROOM_TYPES,
        getBedConfiguration,
        getAllBedConfigurations
    };
}
