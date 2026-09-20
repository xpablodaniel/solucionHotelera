const {
    getBedConfiguration,
    getAllBedConfigurations
} = require("../../src/business/bedConfiguration");


function assert(condition, message) {

    if (!condition) {
        throw new Error(`TEST FALLIDO: ${message}`);
    }
}


function assertBedConfiguration(codigoTipo, tipo, capacidad, camas) {

    const configuracion = getBedConfiguration(codigoTipo);

    assert(configuracion.codigoTipo === codigoTipo, `${codigoTipo} deberia conservar el codigo`);
    assert(configuracion.tipo === tipo, `${codigoTipo} deberia tener el tipo esperado`);
    assert(configuracion.capacidad === capacidad, `${codigoTipo} deberia tener capacidad ${capacidad}`);
    assert(
        JSON.stringify(configuracion.camas) === JSON.stringify(camas),
        `${codigoTipo} deberia tener la configuracion de camas esperada`
    );
}


console.log("\n=== Tests de configuracion de camas ===\n");


console.log("Probando catalogo de tipos...");

assertBedConfiguration(
    "II",
    "DOBLE INDIVIDUAL",
    2,
    [{ tipo: "INDIVIDUAL", cantidad: 2 }]
);

assertBedConfiguration(
    "X",
    "DOBLE MATRIMONIAL",
    2,
    [{ tipo: "MATRIMONIAL", cantidad: 1 }]
);

assertBedConfiguration(
    "III",
    "TRIPLE INDIVIDUAL",
    3,
    [{ tipo: "INDIVIDUAL", cantidad: 3 }]
);

assertBedConfiguration(
    "XI",
    "TRIPLE MATRIMONIAL",
    3,
    [
        { tipo: "MATRIMONIAL", cantidad: 1 },
        { tipo: "INDIVIDUAL", cantidad: 1 }
    ]
);

assertBedConfiguration(
    "XII",
    "CUADRUPLE",
    4,
    [{ tipo: "INDIVIDUAL", cantidad: 4 }]
);

console.log("OK catalogo de tipos");


console.log("Probando codigo inexistente...");

let errorDetectado = false;

try {
    getBedConfiguration("NO_EXISTE");
} catch (error) {
    errorDetectado = true;
}

assert(errorDetectado, "Un codigo inexistente deberia producir un error controlado");
console.log("OK codigo inexistente");


console.log("Probando integridad del catalogo...");

const catalogo = getAllBedConfigurations();

assert(Array.isArray(catalogo), "El catalogo deberia ser un array");
assert(catalogo.length === 5, "El catalogo deberia contener cinco tipos");
assert(Object.isFrozen(catalogo), "El catalogo deberia estar congelado");
assert(Object.isFrozen(catalogo[0]), "Cada configuracion deberia estar congelada");
assert(Object.isFrozen(catalogo[0].camas), "Las camas deberian estar congeladas");
assert(
    Object.isFrozen(catalogo[0].camas[0]),
    "Cada definicion de cama deberia estar congelada"
);

const capacidadOriginal = getBedConfiguration("XII").capacidad;
const cantidadCamasOriginal = getBedConfiguration("XII").camas[0].cantidad;

try {
    getBedConfiguration("XII").capacidad = 99;
    getBedConfiguration("XII").camas[0].cantidad = 99;
    getBedConfiguration("XII").camas.push({ tipo: "MATRIMONIAL", cantidad: 1 });
} catch (error) {
    // En modo estricto estas mutaciones pueden lanzar; el valor debe seguir protegido.
}

assert(
    getBedConfiguration("XII").capacidad === capacidadOriginal,
    "La capacidad del catalogo no deberia modificarse"
);
assert(
    getBedConfiguration("XII").camas[0].cantidad === cantidadCamasOriginal,
    "La configuracion de camas no deberia modificarse"
);
assert(
    getBedConfiguration("XII").camas.length === 1,
    "La lista de camas no deberia modificarse"
);

console.log("OK integridad del catalogo");
console.log("\nTodos los tests de configuracion de camas pasaron.\n");
