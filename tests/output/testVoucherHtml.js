const {
    renderVouchersHtml
} = require("../../src/output/voucherHtml");


function assert(condition, message) {

    if (!condition) {
        throw new Error(`TEST FALLIDO: ${message}`);
    }
}


function voucher(overrides = {}) {

    return {
        voucher: "VOUCHER-HTML",
        representante: "GOMEZ UNO",
        dni: "10000000",
        hotel: "HOTEL DEMO",
        fechaIngreso: "20/09/2026",
        fechaEgreso: "25/09/2026",
        habitaciones: ["238", "239"],
        cantidadPasajeros: 2,
        diasEstadia: 5,
        cantidadComidas: 10,
        modo: "MAP",
        ...overrides
    };
}


console.log("\n=== Tests del renderer HTML de vouchers ===\n");


console.log("Probando campos y escape HTML...");

const mapHtml = renderVouchersHtml([voucher({
    representante: "GOMEZ <UNO>",
    hotel: "HOTEL & DEMO"
})]);

assert(
    mapHtml.includes("GOMEZ &lt;UNO&gt;") &&
        mapHtml.includes("HOTEL &amp; DEMO") &&
        !mapHtml.includes("GOMEZ <UNO>"),
    "Los valores externos deberian escaparse como HTML"
);

assert(
    mapHtml.includes("Voucher de Comidas") &&
        mapHtml.includes("Favor de brindar servicio de Cena") &&
        mapHtml.includes("Almuerzo") === false &&
        mapHtml.includes("Cena"),
    "MAP deberia mostrar solamente Cena"
);

assert(
    mapHtml.includes("10000000") &&
        mapHtml.includes("20/09/2026") &&
        mapHtml.includes("25/09/2026") &&
        mapHtml.includes("238, 239") &&
        mapHtml.includes("Cant. Pax:") &&
        mapHtml.includes("Cant. Comidas:") &&
        mapHtml.includes("10"),
    "MAP deberia mostrar todos los campos del voucher"
);

console.log("OK campos, MAP y escape HTML");


console.log("Probando PC y duracion visual por defecto...");

const pcHtml = renderVouchersHtml([voucher({
    modo: "PC",
    diasEstadia: null,
    cantidadComidas: null
})]);

assert(
    pcHtml.includes("Voucher de Comidas PPJ") &&
        pcHtml.includes("Favor de brindar servicio de Pensión Completa") &&
        pcHtml.includes("Almuerzo") &&
        pcHtml.includes("Cena"),
    "PC deberia mostrar Almuerzo y Cena"
);

assert(
    (pcHtml.match(/class="day-box"/g) || []).length === 2,
    "Una estadia null deberia representarse visualmente como un dia"
);

console.log("OK PC y duracion visual uno");


console.log("Probando cuatro vouchers por pagina...");

const fiveHtml = renderVouchersHtml(
    Array.from({ length: 5 }, (_, index) => voucher({
        voucher: `VOUCHER-${index + 1}`
    }))
);

assert(
    (fiveHtml.match(/class="voucher-page"/g) || []).length === 2,
    "El quinto voucher deberia comenzar una nueva pagina"
);

assert(
    (fiveHtml.match(/class="container"/g) || []).length === 5,
    "Deberian renderizarse todos los vouchers"
);

console.log("OK distribucion de cuatro vouchers por pagina");


let errorDetectado = false;

try {
    renderVouchersHtml(null);
} catch (error) {
    errorDetectado = true;
}

assert(
    errorDetectado,
    "renderVouchersHtml deberia validar la entrada"
);

console.log("OK validaciones del renderer HTML");