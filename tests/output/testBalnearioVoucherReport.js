const {
    buildBalnearioVoucherReport
} = require("../../src/output/balnearioVoucherReport");


function assert(condition, message) {

    if (!condition) {
        throw new Error(`TEST FALLIDO: ${message}`);
    }
}


function passenger({
    dni,
    nombre,
    habitacion,
    asignacion = null,
    hotel = "23 DE MAYO",
    ingreso = "20/09/2026",
    egreso = "25/09/2026"
}) {

    return {
        hotel,
        habitacion: {
            original: asignacion ? `${habitacion} ${asignacion}` : habitacion,
            numero: habitacion,
            asignacion
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


console.log("\n=== Tests del reporte de vouchers Alicante ===\n");


const reporte = buildBalnearioVoucherReport([
    {
        voucher: "VOUCHER-2",
        pasajeros: [
            passenger({
                dni: "30000000",
                nombre: "TITULAR DOS",
                habitacion: "238",
                asignacion: "C"
            })
        ]
    },
    {
        voucher: "VOUCHER-1",
        pasajeros: [
            passenger({
                dni: "30000000",
                nombre: "TITULAR RESERVA",
                habitacion: "238",
                asignacion: "A"
            }),
            passenger({
                dni: "10000000",
                nombre: "DNI MENOR, ACOMPANANTE",
                habitacion: "238",
                asignacion: "B"
            })
        ]
    },
    {
        voucher: "",
        pasajeros: [passenger({
            dni: "90000000",
            nombre: "SIN VOUCHER",
            habitacion: "240"
        })]
    }
]);

assert(
    reporte.length === 2,
    "Cada voucher valido debe producir un reporte independiente"
);

assert(
    reporte.every(item => item.habitaciones[0] === "238"),
    "La limpieza visual debe dejar solo el numero de habitacion"
);

const reporteVoucher1 = reporte.find(item => item.voucher === "VOUCHER-1");

assert(
    reporteVoucher1.titular.nombre === "TITULAR RESERVA" &&
        reporteVoucher1.titular.dni === "30000000",
    "El titular debe ser el primer pasajero, sin ordenar por DNI"
);

assert(
    reporteVoucher1.habitaciones.join(",") === "238" &&
        reporteVoucher1.cantidadPasajeros === 2,
    "La letra operativa no debe aparecer y debe conservarse la cantidad real de pasajeros"
);

assert(
    reporteVoucher1.hotel === "23 DE MAYO" &&
        reporteVoucher1.fechaIngreso === "20/09/2026" &&
        reporteVoucher1.fechaEgreso === "25/09/2026",
    "El reporte debe conservar hotel y fechas del titular"
);

assert(
    !Object.prototype.hasOwnProperty.call(reporteVoucher1, "diasBalneario") &&
        !Object.keys(reporteVoucher1).some(key => key.match(/^dia\d+$/i)),
    "El reporte no debe incluir el bloque inferior de dias"
);

assert(
    reporte.some(item => item.voucher === "VOUCHER-2") &&
        reporte.length === 2,
    "Dos vouchers que comparten habitacion no deben fusionarse"
);

let errorDetectado = false;

try {
    buildBalnearioVoucherReport(null);
} catch (error) {
    errorDetectado = true;
}

assert(
    errorDetectado,
    "El reporte debe validar que la entrada sea un array"
);

console.log("OK reporte Alicante: titular, habitaciones, fechas y sin dias");


console.log("Probando contrato completo del reporte...");

const pasajerosOriginales = [
    passenger({
        dni: "30000000",
        nombre: "GOMEZ GRACIELA",
        habitacion: "238",
        asignacion: "A",
        hotel: "31 DE AGOSTO",
        ingreso: "23/09/2026",
        egreso: "27/09/2026"
    }),
    passenger({
        dni: "10000000",
        nombre: "PEREZ JUAN",
        habitacion: "238",
        asignacion: "B",
        hotel: "31 DE AGOSTO"
    }),
    passenger({
        dni: "40000000",
        nombre: "PEREZ ANA",
        habitacion: "239",
        asignacion: "A",
        hotel: "31 DE AGOSTO"
    }),
    passenger({
        dni: "50000000",
        nombre: "PEREZ LUIS",
        habitacion: "239",
        asignacion: "B",
        hotel: "31 DE AGOSTO"
    })
];
const snapshotPasajeros = JSON.stringify(pasajerosOriginales);
const reporteCompleto = buildBalnearioVoucherReport([{
    voucher: "VOUCHER-COMPLETO",
    pasajeros: pasajerosOriginales
}])[0];

assert(
    reporteCompleto.titular.nombre === "GOMEZ GRACIELA" &&
        reporteCompleto.titular.dni === "30000000",
    "El titular debe ser el primer pasajero aunque otro tenga menor DNI"
);

assert(
    reporteCompleto.hotel === "31 DE AGOSTO",
    "El hotel debe provenir de la Unidad Turistica del titular"
);

assert(
    reporteCompleto.habitaciones.join(",") === "238,239" &&
        reporteCompleto.cantidadPasajeros === 4,
    "Las habitaciones deben deduplicarse sin deduplicar pasajeros"
);

assert(
    reporteCompleto.fechaIngreso === "23/09/2026" &&
        reporteCompleto.fechaEgreso === "27/09/2026",
    "Las fechas deben conservarse directamente desde la estadia"
);

assert(
    JSON.stringify(pasajerosOriginales) === snapshotPasajeros &&
        pasajerosOriginales[0].habitacion.original === "238 A" &&
        pasajerosOriginales[1].habitacion.original === "238 B",
    "La limpieza visual no debe modificar los pasajeros originales"
);

const reporteHotel23 = buildBalnearioVoucherReport([{
    voucher: "VOUCHER-23",
    pasajeros: [passenger({
        dni: "60000000",
        nombre: "HOTEL VEINTITRES",
        habitacion: "240",
        hotel: "23 DE MAYO"
    })]
}])[0];

assert(
    reporteHotel23.hotel === "23 DE MAYO",
    "El hotel 23 DE MAYO debe conservarse sin usar una constante fija"
);

const reporteFechas = buildBalnearioVoucherReport([
    {
        voucher: "VOUCHER-FECHA-IGUAL",
        pasajeros: [passenger({
            dni: "70000000",
            nombre: "FECHA IGUAL",
            habitacion: "241",
            ingreso: "23/09/2026",
            egreso: "23/09/2026"
        })]
    },
    {
        voucher: "VOUCHER-FECHA-AUSENTE",
        pasajeros: [passenger({
            dni: "80000000",
            nombre: "FECHA AUSENTE",
            habitacion: "242",
            ingreso: null,
            egreso: null
        })]
    },
    {
        voucher: "VOUCHER-FECHA-INVALIDA",
        pasajeros: [passenger({
            dni: "90000000",
            nombre: "FECHA INVALIDA",
            habitacion: "243",
            ingreso: "fecha invalida",
            egreso: "otra fecha"
        })]
    }
]);

const fechaIgual = reporteFechas.find(
    reporte => reporte.voucher === "VOUCHER-FECHA-IGUAL"
);
const fechaAusente = reporteFechas.find(
    reporte => reporte.voucher === "VOUCHER-FECHA-AUSENTE"
);
const fechaInvalida = reporteFechas.find(
    reporte => reporte.voucher === "VOUCHER-FECHA-INVALIDA"
);

assert(
    fechaIgual.fechaIngreso === "23/09/2026" &&
        fechaIgual.fechaEgreso === "23/09/2026" &&
        fechaAusente.fechaIngreso === null &&
        fechaAusente.fechaEgreso === null &&
        fechaInvalida.fechaIngreso === "fecha invalida" &&
        fechaInvalida.fechaEgreso === "otra fecha",
    "Las fechas ausentes o invalidas no deben inventarse ni corregirse"
);

const camposEsperados = [
    "voucher",
    "titular",
    "hotel",
    "habitaciones",
    "fechaIngreso",
    "fechaEgreso",
    "cantidadPasajeros"
].sort();

assert(
    JSON.stringify(Object.keys(reporteCompleto).sort()) ===
        JSON.stringify(camposEsperados),
    "El reporte debe contener exactamente el contrato definido"
);

assert(
    !Object.keys(reporteCompleto).some(key =>
        /dia|asistencia|duracion|comida/i.test(key)
    ),
    "El reporte no debe introducir logica de dias o asistencias"
);

assert(
    buildBalnearioVoucherReport([
        {
            voucher: "VOUCHER-SIN-NUMERO",
            pasajeros: [passenger({
                dni: "100000000",
                nombre: "SIN NUMERO",
                habitacion: "244"
            })]
        },
        {
            voucher: "",
            pasajeros: [passenger({
                dni: "110000000",
                nombre: "VOUCHER VACIO",
                habitacion: "245"
            })]
        }
    ]).length === 1,
    "Los vouchers vacios deben descartarse y los validos conservarse"
);

console.log("OK contrato completo del reporte Alicante");