const fs = require("fs");
const path = require("path");

const {
    parseCSV
} = require("../../src/parser/csvParser");

const {
    processReservations
} = require("../../src/business/processReservations");

const {
    buildVoucherReport
} = require("../../src/output/voucherReport");

const {
    renderVouchersHtml
} = require("../../src/output/voucherHtml");

const {
    writeVoucherHtml
} = require("../../src/output/writeVoucherHtml");


function assert(condition, message) {

    if (!condition) {
        throw new Error(`TEST FALLIDO: ${message}`);
    }
}


function readFixture(fileName) {

    const fixturePath = path.join(
        __dirname,
        "../fixtures",
        fileName
    );

    return fs.readFileSync(fixturePath, "utf8");
}


function buildPipeline(records, mode, temporaryPath) {

    const reservas = processReservations(records);
    const vouchers = buildVoucherReport(reservas, mode);
    const html = renderVouchersHtml(vouchers);

    writeVoucherHtml(html, temporaryPath);

    return {
        reservas,
        vouchers,
        html
    };
}


console.log("\n=== Integracion completa de Vouchers ===\n");


const csvContingente = readFixture("reservas_contingente.csv");
const csvIndividuales = readFixture("reservas_individuales.csv");
const registros = [
    ...parseCSV(csvContingente),
    ...parseCSV(csvIndividuales)
];

const temporaryDirectory = path.join(__dirname, "tmp");
const temporaryPath = path.join(
    temporaryDirectory,
    "vouchers_integration_test.html"
);


try {

    fs.mkdirSync(temporaryDirectory, { recursive: true });

    const resultadoMap = buildPipeline(
        registros,
        "MAP",
        temporaryPath
    );

    assert(
        registros.length === 6,
        "Los dos fixtures deberian producir seis registros"
    );

    assert(
        resultadoMap.reservas.length === 4,
        "Los dos fixtures deberian producir cuatro reservas"
    );

    assert(
        resultadoMap.vouchers.length === 4,
        "El reporte MAP deberia conservar cuatro vouchers"
    );

    assert(
        resultadoMap.vouchers.some(voucher =>
            voucher.voucher === "DUMMY-001" &&
            voucher.cantidadPasajeros === 2 &&
            voucher.habitaciones.join(",") === "238"
        ),
        "DUMMY-001 deberia conservar sus dos pasajeros y la habitacion 238"
    );

    assert(
        resultadoMap.vouchers.some(voucher =>
            voucher.voucher === "DUMMY-102" &&
            voucher.cantidadPasajeros === 2 &&
            voucher.cantidadComidas === 10
        ),
        "DUMMY-102 deberia calcular diez comidas MAP"
    );

    assert(
        resultadoMap.html.includes("Voucher de Comidas") &&
            resultadoMap.html.includes("Favor de brindar servicio de Cena") &&
            !resultadoMap.html.includes("Voucher de Comidas PPJ"),
        "La salida MAP deberia contener solo el contrato MAP"
    );

    assert(
        fs.existsSync(temporaryPath),
        "El pipeline MAP deberia crear el archivo temporal"
    );

    assert(
        fs.readFileSync(temporaryPath, "utf8") === resultadoMap.html,
        "El archivo MAP deberia conservar exactamente el HTML generado"
    );

    console.log("OK pipeline MAP");


    const resultadoPc = buildPipeline(
        registros,
        "PC",
        temporaryPath
    );

    assert(
        resultadoPc.vouchers.length === 4,
        "El reporte PC deberia conservar los mismos cuatro vouchers"
    );

    assert(
        resultadoPc.vouchers.some(voucher =>
            voucher.voucher === "DUMMY-102" &&
            voucher.cantidadComidas === 20
        ),
        "DUMMY-102 deberia calcular veinte comidas PC"
    );

    assert(
        resultadoPc.html.includes("Voucher de Comidas PPJ") &&
            resultadoPc.html.includes("Favor de brindar servicio de Pensión Completa") &&
            resultadoPc.html.includes("Almuerzo") &&
            resultadoPc.html.includes("Cena"),
        "La salida PC deberia contener Almuerzo y Cena"
    );

    assert(
        (resultadoPc.html.match(/class="container"/g) || []).length === 4 &&
            (resultadoPc.html.match(/class="voucher-page"/g) || []).length === 1,
        "Los cuatro vouchers deberian formar una pagina"
    );

    assert(
        fs.readFileSync(temporaryPath, "utf8") === resultadoPc.html,
        "El archivo PC deberia conservar exactamente el HTML generado"
    );

    console.log("OK pipeline PC");
    console.log("OK integracion completa de Vouchers");

} finally {

    if (fs.existsSync(temporaryPath)) {
        fs.unlinkSync(temporaryPath);
    }

    if (fs.existsSync(temporaryDirectory)) {
        fs.rmdirSync(temporaryDirectory);
    }
}
