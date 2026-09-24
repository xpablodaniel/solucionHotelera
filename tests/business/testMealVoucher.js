const {
    mealVoucherFilename,
    parseDate,
    validateMealVoucher
} = require("../../src/business/mealVoucher");


function assert(condition, message) {

    if (!condition) {
        throw new Error(`TEST FALLIDO: ${message}`);
    }
}


function validVoucher(overrides = {}) {

    return {
        nombre: "Perez Juan",
        dni: "12345678",
        hotel: "23 DE MAYO",
        fecha: "2026-09-23",
        habitacion: "238",
        cantidadPersonas: 2,
        ...overrides
    };
}


function assertInvalid(overrides, message) {

    let invalid = false;

    try {
        validateMealVoucher(validVoucher(overrides));
    } catch (error) {
        invalid = error.code === "INVALID_MEAL_VOUCHER";
    }

    assert(invalid, message);
}


console.log("\n=== Tests de Voucher de Comida Diario ===\n");


const voucher = validateMealVoucher(validVoucher());

assert(
    voucher.nombre === "PEREZ JUAN" &&
        voucher.dni === "12345678" &&
        voucher.fecha === "23/09/2026" &&
        voucher.hotel === "23 DE MAYO" &&
        voucher.habitacion === "238" &&
        voucher.cantidadPersonas === 2,
    "Deberia validar y normalizar un voucher correcto"
);

assert(
    parseDate("23/09/2026") === "23/09/2026" &&
        parseDate("2026-09-23") === "23/09/2026",
    "Deberia aceptar fechas ISO y dd/mm/yyyy"
);

assertInvalid({ nombre: "" }, "Deberia rechazar nombre vacio");
assertInvalid({ hotel: "HOTEL INVALIDO" }, "Deberia rechazar hotel invalido");
assertInvalid({ dni: "ABC123" }, "Deberia rechazar DNI no numerico");
assertInvalid({ fecha: "31/02/2026" }, "Deberia rechazar fecha invalida");
assertInvalid({ habitacion: "" }, "Deberia rechazar habitacion vacia");
assertInvalid({ cantidadPersonas: 0 }, "Deberia rechazar cantidad cero");
assertInvalid({ cantidadPersonas: -1 }, "Deberia rechazar cantidad negativa");
assertInvalid({ cantidadPersonas: 1.5 }, "Deberia rechazar cantidad decimal");

assert(
    validateMealVoucher(validVoucher({
        nombre: "Gomez <Juan> & Asociados"
    })).nombre === "GOMEZ <JUAN> & ASOCIADOS",
    "Deberia conservar caracteres del nombre para el renderer"
);

assert(
    mealVoucherFilename(validVoucher()) ===
        "voucher_cena_12345678_2026-09-23.pdf",
    "Deberia generar un nombre de archivo estable"
);

console.log("OK validacion, normalizacion y nombre de archivo");