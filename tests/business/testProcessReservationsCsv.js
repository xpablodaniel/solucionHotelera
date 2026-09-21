const fs = require("fs");
const path = require("path");

const {
    parseCSV
} = require("../../src/parser/csvParser");

const {
    processReservations
} = require("../../src/business/processReservations");


function assert(condition, message) {

    if (!condition) {
        throw new Error(`TEST FALLIDO: ${message}`);
    }
}


function testScenario(nombre, archivo, expectativas) {

    console.log(`Probando escenario: ${nombre}`);

    const csvPath = path.join(
        __dirname,
        "../fixtures",
        archivo
    );

    const csv = fs.readFileSync(csvPath, "utf8");
    const records = parseCSV(csv);
    const reservas = processReservations(records);

    assert(
        records.length === expectativas.registros,
        `${nombre}: deberia producir ${expectativas.registros} registros`
    );

    assert(
        reservas.length === expectativas.reservas,
        `${nombre}: deberia producir ${expectativas.reservas} reservas`
    );

    assert(
        reservas.every(reserva =>
            Array.isArray(reserva.habitaciones) &&
            reserva.habitaciones.length > 0
        ),
        `${nombre}: cada reserva deberia conservar al menos una habitacion`
    );

    if (expectativas.habitaciones) {

        assert(
            new Set(
                reservas.flatMap(reserva =>
                    reserva.habitaciones.map(habitacion => habitacion.numero)
                )
            ).size === expectativas.habitaciones,
            `${nombre}: deberia conservar ${expectativas.habitaciones} habitaciones`
        );
    }

    if (expectativas.pasajerosPorVoucher) {

        for (const [voucher, cantidad] of Object.entries(
            expectativas.pasajerosPorVoucher
        )) {

            const reserva = reservas.find(
                reservaActual => reservaActual.voucher === voucher
            );

            assert(
                reserva && reserva.cantidadPasajeros === cantidad,
                `${nombre}: el voucher ${voucher} deberia conservar ${cantidad} pasajeros`
            );
        }
    }

    if (expectativas.pasajerosPorHabitacion) {

        for (const [numero, cantidad] of Object.entries(
            expectativas.pasajerosPorHabitacion
        )) {

            const habitaciones = reservas.flatMap(
                reserva => reserva.habitaciones
            ).filter(
                habitacion => habitacion.numero === numero
            );

            assert(
                habitaciones.length > 0 &&
                habitaciones.reduce(
                    (total, habitacion) => total + habitacion.pasajeros.length,
                    0
                ) === cantidad,
                `${nombre}: la habitacion ${numero} deberia conservar ${cantidad} pasajeros`
            );
        }
    }

    console.log(`OK ${nombre}`);
}


console.log(
    "\n=== Integracion CSV -> reservas procesadas ===\n"
);


testScenario(
    "contingente",
    "reservas_contingente.csv",
    {
        registros: 3,
        reservas: 2,
        habitaciones: 1,
        pasajerosPorVoucher: {
            "DUMMY-001": 2,
            "DUMMY-002": 1
        },
        pasajerosPorHabitacion: {
            "238": 3
        }
    }
);


testScenario(
    "individuales",
    "reservas_individuales.csv",
    {
        registros: 3,
        reservas: 2,
        habitaciones: 2,
        pasajerosPorVoucher: {
            "DUMMY-101": 1,
            "DUMMY-102": 2
        },
        pasajerosPorHabitacion: {
            "109": 1,
            "110": 2
        }
    }
);


console.log(
    "OK todos los escenarios CSV procesados y convertidos en reservas"
);
