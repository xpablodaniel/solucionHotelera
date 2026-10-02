const {
    parseDateKey
} = require("../../src/normalizer/dateKeys");


function assert(condition, message) {
    if (!condition) {
        throw new Error(`❌ TEST FALLIDO: ${message}`);
    }
}


const oct31DayFirst = parseDateKey("31/10/2025");
const oct31Iso = parseDateKey("2025-10-31");

assert(typeof oct31DayFirst === "number", "dd/mm/aaaa → número");
assert(oct31DayFirst === Date.UTC(2025, 9, 31), "dd/mm/aaaa → timestamp UTC correcto");
assert(oct31Iso === Date.UTC(2025, 9, 31), "ISO → timestamp UTC correcto");
assert(oct31DayFirst === oct31Iso, "ambos formatos producen la misma clave");

assert(parseDateKey(" 31/10/2025 ") === oct31DayFirst, "espacios laterales se toleran");
assert(parseDateKey("29/02/2024") === Date.UTC(2024, 1, 29), "bisiesto válido se reconoce");

assert(parseDateKey("31/02/2025") === null, "día inexistente → null");
assert(parseDateKey("2025-02-31") === null, "ISO con día inexistente → null");
assert(parseDateKey("29/02/2025") === null, "no bisiesto → null");
assert(parseDateKey("13/13/2025") === null, "mes inexistente → null");
assert(parseDateKey("1/10/2025") === null, "día sin cero inicial → null");
assert(parseDateKey("2025-1-31") === null, "ISO sin ceros → null");
assert(parseDateKey("31-10-2025") === null, "guiones en día primero → null");
assert(parseDateKey("texto") === null, "texto libre → null");
assert(parseDateKey("") === null, "cadena vacía → null");
assert(parseDateKey("  ") === null, "solo espacios → null");

assert(parseDateKey(null) === null, "null → null");
assert(parseDateKey(undefined) === null, "undefined → null");
assert(parseDateKey(31102025) === null, "número → null");
assert(parseDateKey({}) === null, "objeto → null");

console.log("✅ testDateKeys: todos los casos pasaron.");
