const {
    normalizeNonEmptyString
} = require("../../src/normalizer/textNormalization");


function assert(condition, message) {
    if (!condition) {
        throw new Error(`❌ TEST FALLIDO: ${message}`);
    }
}


assert(normalizeNonEmptyString(null) === null, "null → null");
assert(normalizeNonEmptyString(undefined) === null, "undefined → null");
assert(normalizeNonEmptyString("") === null, "cadena vacía → null");
assert(normalizeNonEmptyString("   ") === null, "solo espacios → null");
assert(normalizeNonEmptyString("  12345678  ") === "12345678", "recorta espacios laterales");
assert(normalizeNonEmptyString("900") === "900", "texto sin espacios se conserva");
assert(normalizeNonEmptyString(12345678) === "12345678", "número → texto");
assert(normalizeNonEmptyString(0) === "0", "cero → texto '0'");

console.log("✅ testTextNormalization: todos los casos pasaron.");
