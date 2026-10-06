const {
    buildVoucherHtmlForDate
} = require("../../src/output/voucherHtmlForDate");


function assert(condition, message) {
    if (!condition) {
        throw new Error(`TEST FALLIDO: ${message}`);
    }
}


function passenger(name, dni, arrival, service, room) {
    return {
        servicios: service,
        hotel: "HOTEL DEMO",
        estadia: {
            ingreso: arrival,
            egreso: "15/10/2026"
        },
        habitacion: {
            numero: room
        },
        pax: {
            nombre: name,
            numeroDocumento: dni
        }
    };
}


const firstMapPassenger = passenger(
    "JUAN",
    "90000000",
    "10/10/2026",
    "Media Pensión",
    "101"
);
const laterMapPassenger = passenger(
    "MARIA",
    "10000000",
    "10/10/2026",
    "MEDIA PENSION",
    "102"
);
const affectedMapVoucher = {
    voucher: "100",
    pasajeros: [firstMapPassenger, laterMapPassenger]
};
const affectedPcVoucher = {
    voucher: "200",
    pasajeros: [
        passenger("ANA PC", "20000000", "10/10/2026", "Pensión Completa", "201")
    ]
};
const breakfastVoucher = {
    voucher: "300",
    pasajeros: [
        passenger("LUIS DESAYUNO", "30000000", "10/10/2026", "DESAYUNO", "301")
    ]
};
const unaffectedMapVoucher = {
    voucher: "400",
    pasajeros: [
        passenger("NO INGRESA", "40000000", "11/10/2026", "MEDIA PENSION", "401")
    ]
};
const mixedServiceVoucher = {
    voucher: "500",
    pasajeros: [
        passenger("MIX MAP", "50000000", "10/10/2026", "MEDIA PENSION", "501"),
        passenger("MIX PC", "50000001", "12/10/2026", "PENSION COMPLETA", "502")
    ]
};
const divergentDateVoucher = {
    voucher: "600",
    pasajeros: [
        passenger("PAX FECHA A", "60000000", "10/10/2026", "MEDIA PENSION", "601"),
        passenger("PAX FECHA B", "60000001", "11/10/2026", "MEDIA PENSION", "602")
    ]
};
const missingDateVoucher = {
    voucher: "700",
    pasajeros: [
        passenger("PAX SIN EGRESO", "70000000", "10/10/2026", "MEDIA PENSION", "701"),
        {
            ...passenger("PAX EGRESO AUSENTE", "70000001", "10/10/2026", "MEDIA PENSION", "702"),
            estadia: { ingreso: "10/10/2026", egreso: null }
        }
    ]
};
const reservations = [
    affectedMapVoucher,
    affectedPcVoucher,
    breakfastVoucher,
    unaffectedMapVoucher,
    mixedServiceVoucher,
    divergentDateVoucher,
    missingDateVoucher
];
const baseUrl = "https://hotel.example/client/reservations.html";

const mapOutput = buildVoucherHtmlForDate(
    reservations,
    "10/10/2026",
    "MAP",
    baseUrl
);

assert(
    mapOutput.reportes.length === 1 &&
        mapOutput.reportes[0].voucher === "100",
    "Voucher MAP debe excluir PC, desayuno, voucher no afectado y servicios inconsistentes"
);
assert(
    mapOutput.reportes[0].representante === "JUAN" &&
        mapOutput.reportes[0].dni === "90000000" &&
        mapOutput.reportes[0].cantidadPasajeros === 2,
    "Debe conservar el voucher completo y su primer PAX como representante"
);
assert(
    mapOutput.reportes[0].habitaciones.join(",") === "101,102" &&
        mapOutput.reportes[0].cantidadComidas === 10,
    "El reporte debe incluir habitaciones y comidas calculadas con el voucher completo"
);
assert(
    mapOutput.reportes[0].fechaIngreso === "10/10/2026" &&
        mapOutput.reportes[0].fechaEgreso === "15/10/2026",
    "El consumer debe conservar las fechas uniformes del voucher"
);
assert(
    mapOutput.reviewRequired.length === 2 &&
        mapOutput.reviewRequired[0].voucher === "600" &&
        mapOutput.reviewRequired[0].reason === "DIVERGENT_STAY_PERIODS" &&
        mapOutput.reviewRequired[1].voucher === "700" &&
        mapOutput.reviewRequired[1].reason === "MISSING_OR_INVALID_DATES",
    "Los vouchers con fechas divergentes o ausentes deben quedar para revisión manual"
);
assert(
    mapOutput.html.includes("JUAN") &&
        mapOutput.html.includes("90000000") &&
        mapOutput.html.includes("Cant. Pax:</strong> 2") &&
        mapOutput.html.includes("101, 102"),
    "El HTML debe renderizar los campos del reporte del voucher completo"
);
assert(
    mapOutput.html.includes(`<base href="${baseUrl}">`) &&
        mapOutput.html.includes("../src/output/styles.css") &&
        mapOutput.html.includes("../assets/suteba_logo_3.jpg"),
    "El documento imprimible debe preservar las rutas relativas mediante base URL"
);

const pcOutput = buildVoucherHtmlForDate(
    reservations,
    "10/10/2026",
    "PC",
    baseUrl
);
assert(
    pcOutput.reportes.length === 1 &&
        pcOutput.reportes[0].voucher === "200" &&
        pcOutput.reportes[0].cantidadComidas === 10 &&
        pcOutput.html.includes("Voucher de Comidas PPJ"),
    "Voucher PC debe generar solo su régimen y el HTML correspondiente"
);

const emptyOutput = buildVoucherHtmlForDate(
    reservations,
    "12/10/2026",
    "MAP",
    baseUrl
);
assert(
    emptyOutput.reportes.length === 0 && emptyOutput.html === null,
    "Sin vouchers del régimen en la fecha, no debe producir HTML descargable"
);
assert(
    emptyOutput.reviewRequired.length === 0,
    "La selección vacía no debe reportar vouchers para revisión"
);

const onlyReviewOutput = buildVoucherHtmlForDate(
    [divergentDateVoucher],
    "10/10/2026",
    "MAP",
    baseUrl
);
assert(
    onlyReviewOutput.reportes.length === 0 &&
        onlyReviewOutput.html === null &&
        onlyReviewOutput.reviewRequired.length === 1 &&
        onlyReviewOutput.reviewRequired[0].voucher === "600",
    "Si todos los vouchers requieren revisión, no debe generarse un documento"
);

let invalidModeThrew = false;
try {
    buildVoucherHtmlForDate(reservations, "10/10/2026", "DESAYUNO", baseUrl);
} catch (error) {
    invalidModeThrew = error instanceof Error;
}
assert(invalidModeThrew, "Un modo distinto de MAP/PC debe lanzar un error");

let missingBaseThrew = false;
try {
    buildVoucherHtmlForDate(reservations, "10/10/2026", "MAP", "");
} catch (error) {
    missingBaseThrew = error instanceof TypeError;
}
assert(
    missingBaseThrew,
    "Con resultados, una URL base faltante debe lanzar TypeError"
);

console.log("OK pipeline HTML de vouchers MAP/PC por fecha");
