const {
    buildVoucherReport,
    calculateStayDays
} = require("../../src/output/voucherReport");


function assert(condition, message) {

    if (!condition) {
        throw new Error(`TEST FALLIDO: ${message}`);
    }
}


function passenger({
    voucher,
    dni,
    nombre,
    habitacion,
    hotel = "HOTEL DEMO",
    ingreso = "20/09/2026",
    egreso = "25/09/2026"
}) {

    return {
        voucher,
        hotel,
        habitacion: {
            numero: habitacion,
            asignacion: null
        },
        estadia: {
            ingreso,
            egreso
        },
        pax: {
            numeroDocumento: dni,
            nombre
        }
    };
}


console.log("\n=== Tests del reporte de vouchers ===\n");


const reservas = [

    {
        voucher: "VOUCHER-A",
        pasajeros: [
            passenger({
                voucher: "VOUCHER-A",
                dni: "30000000",
                nombre: "PEREZ DOS",
                habitacion: "238"
            }),
            passenger({
                voucher: "VOUCHER-A",
                dni: "10000000",
                nombre: "GOMEZ UNO",
                habitacion: "239"
            }),
            passenger({
                voucher: "VOUCHER-A",
                dni: "20000000",
                nombre: "LOPEZ TRES",
                habitacion: "238"
            })
        ]
    },

    {
        voucher: "VOUCHER-B",
        pasajeros: [
            passenger({
                voucher: "VOUCHER-B",
                dni: "40000000",
                nombre: "OTRO PASAJERO",
                habitacion: "238"
            })
        ]
    },

    {
        voucher: "",
        pasajeros: [
            passenger({
                voucher: "",
                dni: "60000000",
                nombre: "SIN VOUCHER",
                habitacion: "241"
            })
        ]
    }
];


console.log("Probando voucher con varios pasajeros...");

const reporteMap = buildVoucherReport(reservas, "MAP");
const voucherMap = reporteMap[0];

assert(
    reporteMap.length === 2,
    "Cada voucher deberia producir un reporte independiente"
);

assert(
    voucherMap.cantidadPasajeros === 3,
    "La cantidad deberia ser la cantidad real de filas"
);

assert(
    voucherMap.representante === "GOMEZ UNO" &&
        voucherMap.dni === "10000000",
    "El representante deberia ser el pasajero con menor DNI"
);

assert(
    voucherMap.habitaciones.join(",") === "238,239",
    "Deberian combinarse las habitaciones sin repetirlas"
);

assert(
    voucherMap.cantidadComidas === 15,
    "MAP deberia calcular pasajeros por dias por una comida"
);

assert(
    reporteMap[1].voucher === "VOUCHER-B" &&
        reporteMap[1].cantidadPasajeros === 1,
    "Dos vouchers que comparten habitacion no deberian fusionarse"
);

assert(
    !reporteMap.some(reporte => reporte.voucher === ""),
    "Un voucher vacio no deberia generar un reporte"
);

console.log("OK agrupacion, orden, representante y habitaciones");


console.log("Probando orden historico por habitacion...");

const reporteOrdenado = buildVoucherReport([
    {
        voucher: "VOUCHER-H2",
        pasajeros: [passenger({
            voucher: "VOUCHER-H2",
            dni: "70000000",
            nombre: "HABITACION DOS",
            habitacion: "210"
        })]
    },
    {
        voucher: "VOUCHER-H1",
        pasajeros: [passenger({
            voucher: "VOUCHER-H1",
            dni: "80000000",
            nombre: "HABITACION UNO",
            habitacion: "110"
        })]
    }
], "MAP");

assert(
    reporteOrdenado[0].voucher === "VOUCHER-H1" &&
        reporteOrdenado[1].voucher === "VOUCHER-H2",
    "Los vouchers deberian ordenarse por habitacion minima"
);

console.log("OK orden historico por habitacion");


console.log("Probando MAP versus PC...");

const reportePc = buildVoucherReport(reservas, "PC");

assert(
    reportePc[0].modo === "PC" &&
        reportePc[0].cantidadComidas === 30,
    "PC deberia calcular el doble de comidas que MAP"
);

console.log("OK calculo MAP/PC");


console.log("Probando orden historico con DNI no numerico...");

const reporteDniNoNumerico = buildVoucherReport([
    {
        voucher: "VOUCHER-D",
        pasajeros: [
            passenger({
                voucher: "VOUCHER-D",
                dni: "10000000",
                nombre: "DNI VALIDO",
                habitacion: "242"
            }),
            passenger({
                voucher: "VOUCHER-D",
                dni: "SIN DNI",
                nombre: "DNI NO NUMERICO",
                habitacion: "242"
            })
        ]
    }
], "MAP")[0];

assert(
    reporteDniNoNumerico.representante === "DNI NO NUMERICO",
    "El DNI no numerico deberia conservar el orden historico actual"
);

console.log("OK DNI no numerico");


console.log("Probando fechas invalidas, ausentes e invertidas...");

assert(
    calculateStayDays("20/09/2026", "25/09/2026") === 5,
    "Las fechas validas deberian calcular cinco dias"
);

assert(
    calculateStayDays("fecha", "25/09/2026") === null &&
        calculateStayDays(null, "25/09/2026") === null,
    "Las fechas invalidas o ausentes deberian devolver null"
);

assert(
    calculateStayDays("25/09/2026", "20/09/2026") === -5,
    "Las fechas invertidas no deberian corregirse silenciosamente"
);

const reservaSinFechas = {
    voucher: "VOUCHER-C",
    pasajeros: [passenger({
        voucher: "VOUCHER-C",
        dni: "50000000",
        nombre: "SIN FECHAS",
        habitacion: "240",
        ingreso: null,
        egreso: null
    })]
};

const reporteSinFechas = buildVoucherReport(
    [reservaSinFechas],
    "MAP"
)[0];

assert(
    reporteSinFechas.diasEstadia === null &&
        reporteSinFechas.cantidadComidas === null,
    "Sin fechas no deberian inventarse dias ni comidas"
);

console.log("OK fechas invalidas, ausentes e invertidas");


let errorDetectado = false;

try {
    buildVoucherReport(null, "MAP");
} catch (error) {
    errorDetectado = true;
}

assert(
    errorDetectado,
    "buildVoucherReport deberia validar la entrada"
);

console.log("OK validaciones del reporte de vouchers");