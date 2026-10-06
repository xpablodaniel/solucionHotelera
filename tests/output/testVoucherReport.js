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
    alojamiento = null,
    hotel = "HOTEL DEMO",
    ingreso = "20/09/2026",
    egreso = "25/09/2026"
}) {

    return {
        voucher,
        alojamiento,
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
    voucherMap.representante === "PEREZ DOS" &&
        voucherMap.dni === "30000000",
    "El representante deberia ser el primer pasajero aunque otro tenga menor DNI"
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

console.log("OK agrupacion, representante y habitaciones");


console.log("Probando representante igual al menor DNI...");

const primerPaxEsMenorDni = buildVoucherReport([
    {
        voucher: "PRIMER-PAX-MENOR-DNI",
        pasajeros: [
            passenger({
                voucher: "PRIMER-PAX-MENOR-DNI",
                dni: "10000000",
                nombre: "PRIMER PAX",
                habitacion: "201"
            }),
            passenger({
                voucher: "PRIMER-PAX-MENOR-DNI",
                dni: "90000000",
                nombre: "SEGUNDO PAX",
                habitacion: "202"
            })
        ]
    }
], "MAP")[0];

assert(
    primerPaxEsMenorDni.representante === "PRIMER PAX" &&
        primerPaxEsMenorDni.dni === "10000000",
    "El primer PAX debe seguir siendo representante cuando también tiene el menor DNI"
);

console.log("OK primer PAX con menor DNI");


console.log("Probando identidad de habitaciones multi-hotel...");

const unaHabitacion = buildVoucherReport([
    {
        voucher: "IDENTIDAD-900",
        pasajeros: [passenger({
            voucher: "IDENTIDAD-900",
            dni: "10000001",
            nombre: "PASAJERO 900",
            alojamiento: "900",
            hotel: "HOTEL 23 DE MAYO",
            habitacion: "101"
        })]
    }
], "MAP")[0];

assert(
    unaHabitacion.habitaciones.length === 1 &&
        unaHabitacion.habitacionesDetalladas[0].alojamiento === "900" &&
        unaHabitacion.habitacionesDetalladas[0].numero === "101",
    "Una habitación 900/101 debería conservar número e identidad"
);

const mismaHabitacion = buildVoucherReport([
    {
        voucher: "IDENTIDAD-DUPLICADA",
        pasajeros: [
            passenger({
                voucher: "IDENTIDAD-DUPLICADA",
                dni: "10000002",
                nombre: "PASAJERO A",
                alojamiento: "900",
                habitacion: "101"
            }),
            passenger({
                voucher: "IDENTIDAD-DUPLICADA",
                dni: "10000003",
                nombre: "PASAJERO B",
                alojamiento: "900",
                habitacion: "101"
            })
        ]
    }
], "MAP")[0];

assert(
    mismaHabitacion.habitaciones.length === 1 &&
        mismaHabitacion.habitacionesDetalladas.length === 1,
    "Dos pasajeros en 900/101 deberían producir una habitación"
);

const variasHabitaciones = buildVoucherReport([
    {
        voucher: "IDENTIDAD-MULTIPLE",
        pasajeros: [
            passenger({
                voucher: "IDENTIDAD-MULTIPLE",
                dni: "10000004",
                nombre: "PASAJERO 101",
                alojamiento: "900",
                habitacion: "101"
            }),
            passenger({
                voucher: "IDENTIDAD-MULTIPLE",
                dni: "10000005",
                nombre: "PASAJERO 102",
                alojamiento: "900",
                habitacion: "102"
            })
        ]
    }
], "MAP")[0];

assert(
    variasHabitaciones.habitacionesDetalladas.length === 2,
    "900/101 y 900/102 deberían permanecer como dos habitaciones"
);

const mismoNumeroHotelesDistintos = buildVoucherReport([
    {
        voucher: "IDENTIDAD-DOS-HOTELES",
        pasajeros: [
            passenger({
                voucher: "IDENTIDAD-DOS-HOTELES",
                dni: "10000006",
                nombre: "PASAJERO 23",
                alojamiento: "900",
                hotel: "HOTEL 23 DE MAYO",
                habitacion: "101"
            }),
            passenger({
                voucher: "IDENTIDAD-DOS-HOTELES",
                dni: "10000007",
                nombre: "PASAJERO 31",
                alojamiento: "901",
                hotel: "HOTEL 31 DE AGOSTO",
                habitacion: "101"
            })
        ]
    }
], "MAP")[0];

assert(
    mismoNumeroHotelesDistintos.habitaciones.length === 2 &&
        mismoNumeroHotelesDistintos.habitacionesDetalladas.length === 2 &&
        mismoNumeroHotelesDistintos.habitacionesDetalladas[0].alojamiento === "900" &&
        mismoNumeroHotelesDistintos.habitacionesDetalladas[1].alojamiento === "901",
    "900/101 y 901/101 deberían permanecer como dos habitaciones distintas"
);

const vouchersIndependientes = buildVoucherReport([
    {
        voucher: "IDENTIDAD-VOUCHER-A",
        pasajeros: [passenger({
            voucher: "IDENTIDAD-VOUCHER-A",
            dni: "10000008",
            nombre: "VOUCHER A",
            alojamiento: "900",
            habitacion: "101"
        })]
    },
    {
        voucher: "IDENTIDAD-VOUCHER-B",
        pasajeros: [passenger({
            voucher: "IDENTIDAD-VOUCHER-B",
            dni: "10000009",
            nombre: "VOUCHER B",
            alojamiento: "900",
            habitacion: "101"
        })]
    }
], "MAP");

assert(
    vouchersIndependientes.length === 2 &&
        vouchersIndependientes[0].voucher !== vouchersIndependientes[1].voucher,
    "Vouchers diferentes deberían continuar como reportes independientes"
);

const habitacionHistorica = buildVoucherReport([
    {
        voucher: "IDENTIDAD-SIN-CODIGO",
        pasajeros: [passenger({
            voucher: "IDENTIDAD-SIN-CODIGO",
            dni: "10000010",
            nombre: "SIN CODIGO",
            habitacion: "101"
        })]
    }
], "MAP")[0];

assert(
    habitacionHistorica.habitaciones[0] === "101" &&
        habitacionHistorica.habitacionesDetalladas[0].alojamiento === null,
    "El reporte histórico debería conservar alojamiento null sin inventar 900"
);

console.log("OK identidad, deduplicación y compatibilidad histórica");


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
    reporteDniNoNumerico.representante === "DNI VALIDO" &&
        reporteDniNoNumerico.dni === "10000000",
    "El primer PAX debe ser representante independientemente del DNI de los siguientes"
);

const primerPaxSinDni = buildVoucherReport([
    {
        voucher: "PRIMER-PAX-SIN-DNI",
        pasajeros: [
            passenger({
                voucher: "PRIMER-PAX-SIN-DNI",
                dni: null,
                nombre: "PRIMER PAX SIN DNI",
                habitacion: "242"
            }),
            passenger({
                voucher: "PRIMER-PAX-SIN-DNI",
                dni: "12345678",
                nombre: "SEGUNDO PAX CON DNI",
                habitacion: "242"
            })
        ]
    }
], "MAP")[0];

assert(
    primerPaxSinDni.representante === "PRIMER PAX SIN DNI" &&
        primerPaxSinDni.dni === "",
    "Si el primer PAX no tiene DNI, el reporte debe dejarlo vacío sin buscar sustituto"
);

assert(
    primerPaxSinDni.voucher === "PRIMER-PAX-SIN-DNI" &&
        primerPaxSinDni.hotel === "HOTEL DEMO" &&
        primerPaxSinDni.fechaIngreso === "20/09/2026" &&
        primerPaxSinDni.fechaEgreso === "25/09/2026" &&
        primerPaxSinDni.habitaciones.join(",") === "242" &&
        primerPaxSinDni.cantidadPasajeros === 2 &&
        primerPaxSinDni.diasEstadia === 5 &&
        primerPaxSinDni.cantidadComidas === 10 &&
        primerPaxSinDni.modo === "MAP",
    "Cambiar el representante no debe alterar los otros datos del reporte"
);

console.log("OK primer PAX sin DNI y preservacion de los otros datos");


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