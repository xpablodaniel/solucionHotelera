const {
    parseRow,
    parseRoom,
    parseCSV
} = require("../../src/parser/csvParser");


function assert(condition, message) {

    if (!condition) {
        throw new Error(`❌ TEST FALLIDO: ${message}`);
    }
}


/**
 * Prueba parseRoom()
 */
function testParseRoom() {

    console.log("Probando parseRoom()...");

    const casos = [
        {
            entrada: "238",
            numero: "238",
            asignacion: null
        },
        {
            entrada: "238 A",
            numero: "238",
            asignacion: "A"
        },
        {
            entrada: "238 B",
            numero: "238",
            asignacion: "B"
        },
        {
            entrada: "238 C",
            numero: "238",
            asignacion: "C"
        },
        {
            entrada: " 238 A ",
            numero: "238",
            asignacion: "A"
        },
        {
            entrada: "",
            numero: null,
            asignacion: null
        }
    ];


    for (const caso of casos) {

        const resultado = parseRoom(caso.entrada);

        assert(
            resultado.numero === caso.numero,
            `"${caso.entrada}" → número incorrecto`
        );

        assert(
            resultado.asignacion === caso.asignacion,
            `"${caso.entrada}" → asignación incorrecta`
        );
    }


    console.log("✅ parseRoom() OK");
}


/**
 * Prueba parseRow()
 */
function testParseRow() {

    console.log("Probando parseRow()...");


    const fila = [
        "900",
        "HOTEL 23 DE MAYO",
        "238 A",
        "TRIPLE A COMPARTIR",
        "",
        "3",
        "30243135",
        "SECCIONAL DEMO",
        "12/07/2026",
        "19/07/2026",
        "1",
        "DNI",
        "12345678",
        "GOMEZ GRACIELA",
        "65",
        "SUTEBA",
        "MEDIA PENSION",
        "PPJ",
        "Sin Transporte",
        "12/07/2026",
        "",
        "",
        "demo@example.com",
        "O",
        "15/03/1961",
        "0",
        "",
        "usuario"
    ];


    const resultado = parseRow(fila);


    assert(
        resultado.habitacion.numero === "238",
        "El número de habitación debería ser 238"
    );

    assert(
        resultado.habitacion.asignacion === "A",
        "La asignación debería ser A"
    );

    assert(
        resultado.plazas.cantidad === 3,
        "La cantidad de plazas debería ser 3"
    );

    assert(
        resultado.plazas.ocupadas === 1,
        "Las plazas ocupadas deberían ser 1"
    );

    assert(
        resultado.voucher === "30243135",
        "El voucher no coincide"
    );

    assert(
        resultado.pax.nombre === "GOMEZ GRACIELA",
        "El nombre del PAX no coincide"
    );

    assert(
        resultado.estado === "O",
        "El estado debería ser O"
    );


    console.log("✅ parseRow() OK");
}


/**
 * Prueba parseCSV()
 */
function testParseCSV() {

    console.log("Probando parseCSV()...");


    const csv = `Cód. Alojamiento,Descripción,Nro. habitación,Tipo habitación,Observación habitación,Cantidad plazas,Voucher,Sede,Fecha de ingreso,Fecha de egreso,Plazas ocupadas,Tipo documento,Nro. doc.,Apellido y nombre,Edad,Entidad,Servicios,Paquete,Transporte,Fecha viaje,Hora viaje,Parada,Email,Estado,Fecha de nacimiento,Teléfono,Celular,Usuario
900,HOTEL 23 DE MAYO,238 A,TRIPLE A COMPARTIR,,3,30243135,SECCIONAL DEMO,12/07/2026,19/07/2026,1,DNI,12345678,GOMEZ GRACIELA,65,SUTEBA,MEDIA PENSION,PPJ,Sin Transporte,12/07/2026,,,demo@example.com,O,15/03/1961,0,,usuario
900,HOTEL 23 DE MAYO,238 B,TRIPLE A COMPARTIR,,3,30243135,SECCIONAL DEMO,12/07/2026,19/07/2026,1,DNI,22345678,ALBA LAUTARO,68,SUTEBA,MEDIA PENSION,PPJ,Sin Transporte,12/07/2026,,,demo2@example.com,O,10/05/1958,0,,usuario`;


    const resultado = parseCSV(csv);


    assert(
        resultado.length === 2,
        "El CSV debería producir 2 registros"
    );

    assert(
        resultado[0].habitacion.numero === "238",
        "La primera habitación debería ser 238"
    );

    assert(
        resultado[0].habitacion.asignacion === "A",
        "La primera asignación debería ser A"
    );

    assert(
        resultado[1].habitacion.asignacion === "B",
        "La segunda asignación debería ser B"
    );

    assert(
        resultado[0].voucher === "30243135",
        "El voucher debería ser 30243135"
    );

    assert(
        resultado[1].pax.nombre === "ALBA LAUTARO",
        "El segundo PAX no coincide"
    );


    console.log("✅ parseCSV() OK");
}

/**
 * Prueba CSV con una coma dentro de un campo entrecomillado.
 *
 * Este caso representa un problema real del gestor:
 * un nombre puede contener una coma.
 *
 * Ejemplo:
 * "GOMEZ, GRACIELA"
 *
 * En un CSV correctamente interpretado,
 * esa coma NO debe generar una nueva columna.
 */
function testCSVComaEnNombre() {

    console.log("Probando CSV con coma dentro del nombre...");

    const csv = `Cód. Alojamiento,Descripción,Nro. habitación,Tipo habitación,Observación habitación,Cantidad plazas,Voucher,Sede,Fecha de ingreso,Fecha de egreso,Plazas ocupadas,Tipo documento,Nro. doc.,Apellido y nombre,Edad,Entidad,Servicios,Paquete,Transporte,Fecha viaje,Hora viaje,Parada,Email,Estado,Fecha de nacimiento,Teléfono,Celular,Usuario
900,HOTEL 23 DE MAYO,238,TRIPLE INDIVIDUAL,,3,30243136,SECCIONAL DEMO,12/07/2026,19/07/2026,1,DNI,12345678,"GOMEZ, GRACIELA",65,SUTEBA,MEDIA PENSION,PPJ,Sin Transporte,12/07/2026,,,demo@example.com,O,15/03/1961,0,,usuario`;

    const resultado = parseCSV(csv);

    assert(
        resultado.length === 1,
        "El CSV debería producir un único registro"
    );

    assert(
        resultado[0].pax.nombre === "GOMEZ, GRACIELA",
        `El nombre debería ser "GOMEZ, GRACIELA", pero fue "${resultado[0].pax.nombre}"`
    );

    console.log("✅ CSV con coma dentro del nombre OK");
}

/**
 * Prueba CSV con comillas escapadas dentro de un campo entrecomillado.
 *
 * En CSV, una comilla literal se representa duplicándola:
 * "GOMEZ ""EL FLACO"""
 */
function testCSVComillasEscapadas() {

    console.log("Probando CSV con comillas escapadas...");

    const csv = `Cód. Alojamiento,Descripción,Nro. habitación,Tipo habitación,Observación habitación,Cantidad plazas,Voucher,Sede,Fecha de ingreso,Fecha de egreso,Plazas ocupadas,Tipo documento,Nro. doc.,Apellido y nombre,Edad,Entidad,Servicios,Paquete,Transporte,Fecha viaje,Hora viaje,Parada,Email,Estado,Fecha de nacimiento,Teléfono,Celular,Usuario
900,HOTEL 23 DE MAYO,238,TRIPLE INDIVIDUAL,,3,30243137,SECCIONAL DEMO,12/07/2026,19/07/2026,1,DNI,12345678,"GOMEZ ""EL FLACO""",65,SUTEBA,MEDIA PENSION,PPJ,Sin Transporte,12/07/2026,,,demo@example.com,O,15/03/1961,0,,usuario`;

    const resultado = parseCSV(csv);

    assert(
        resultado.length === 1,
        "El CSV debería producir un único registro"
    );

    assert(
        resultado[0].pax.nombre === 'GOMEZ "EL FLACO"',
        `El nombre debería conservar las comillas, pero fue "${resultado[0].pax.nombre}"`
    );

    console.log("✅ CSV con comillas escapadas OK");
}

/**
 * Prueba una fila con muchas columnas vacías.
 *
 * Los campos vacíos se representan manteniendo las comas:
 * 900,,238,,,...
 * Algunos exportadores también escriben ciertos vacíos como "".
 */
function testCSVCamposVacios() {

    console.log("Probando CSV con campos vacíos...");

    const header = "Cód. Alojamiento,Descripción,Nro. habitación,Tipo habitación,Observación habitación,Cantidad plazas,Voucher,Sede,Fecha de ingreso,Fecha de egreso,Plazas ocupadas,Tipo documento,Nro. doc.,Apellido y nombre,Edad,Entidad,Servicios,Paquete,Transporte,Fecha viaje,Hora viaje,Parada,Email,Estado,Fecha de nacimiento,Teléfono,Celular,Usuario";
    const fila = Array(28).fill("");

    fila[0] = "900";
    fila[2] = "238";
    fila[4] = '""';
    fila[21] = '""';

    const resultado = parseCSV(`${header}\n${fila.join(",")}`);

    assert(
        resultado.length === 1,
        "El CSV debería producir un único registro"
    );

    assert(
        resultado[0].habitacion.numero === "238",
        "La habitación debería conservar su posición entre campos vacíos"
    );

    assert(
        resultado[0].hotel === null &&
        resultado[0].tipoHabitacion === null &&
        resultado[0].observacionHabitacion === null,
        "Los campos de texto vacíos deberían convertirse en null"
    );

    assert(
        resultado[0].plazas.cantidad === null &&
        resultado[0].pax.nombre === null &&
        resultado[0].viaje.parada === null,
        "Las columnas vacías posteriores no deberían desplazarse"
    );

    console.log("✅ CSV con campos vacíos OK");
}

/**
 * Ejecución de las pruebas
 */
console.log("\n=== SOLUCION HOTEL TOOLS ===");
console.log("=== Tests del parser ===\n");


testParseRoom();

testParseRow();

testParseCSV();

testCSVComaEnNombre();

testCSVComillasEscapadas();

testCSVCamposVacios();


console.log("\n🎉 Todos los tests pasaron correctamente.\n");