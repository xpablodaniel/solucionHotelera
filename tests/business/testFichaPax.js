const assert = require("node:assert/strict");
const test = require("node:test");

const {
    buildFichaPaxPages,
    searchFichaPax
} = require("../../src/business/fichaPax");
const {
    buildResponsibleRelationships
} = require("../../src/business/responsibleRelationships");


function makePassenger(index, overrides = {}) {

    return {
        alojamiento: "900",
        hotel: "31 DE AGOSTO",
        habitacion: {
            numero: index < 5 ? "101" : "102",
            asignacion: null
        },
        estadia: {
            ingreso: "12/10/2026",
            egreso: "15/10/2026"
        },
        servicios: "MEDIA PENSION",
        plazas: {
            cantidad: 2,
            ocupadas: 2
        },
        contacto: {
            email: null,
            telefono: null,
            celular: null
        },
        pax: {
            tipoDocumento: "DNI",
            numeroDocumento: String(10000000 + index),
            nombre: `PAX ${index}`,
            edad: 30 + index,
            fechaNacimiento: null
        },
        ...overrides
    };
}


function makeReservation(voucher, passengers) {

    const roomsByNumber = new Map();

    for (const passenger of passengers) {

        const numero = passenger.habitacion.numero;

        if (!roomsByNumber.has(numero)) {
            roomsByNumber.set(numero, {
                alojamiento: passenger.alojamiento,
                numero,
                inventario: null,
                capacidad: passenger.plazas.cantidad,
                ocupadasInformadas: passenger.plazas.ocupadas,
                pasajeros: []
            });
        }

        roomsByNumber.get(numero).pasajeros.push(passenger);
    }

    return {
        voucher,
        pasajeros: passengers,
        cantidadPasajeros: passengers.length,
        habitaciones: Array.from(roomsByNumber.values())
    };
}


function makeReservations() {

    const firstVoucherPassengers = Array.from(
        { length: 8 },
        (_, index) => makePassenger(index + 1)
    );
    firstVoucherPassengers[0].pax.edad = 22;
    firstVoucherPassengers[1].pax.edad = 91;

    return [
        makeReservation("VOUCHER-001", firstVoucherPassengers),
        makeReservation("VOUCHER-002", [
            makePassenger(20, {
                pax: {
                    tipoDocumento: "DNI",
                    numeroDocumento: "20999999",
                    nombre: "GOMEZ MARTA",
                    edad: 45,
                    fechaNacimiento: null
                }
            })
        ])
    ];
}


test("one voucher produces one page when its companions fit", () => {

    const reservation = makeReservation("VOUCHER-ONE", [
        makePassenger(1),
        makePassenger(2),
        makePassenger(3)
    ]);

    const pages = buildFichaPaxPages(reservation);

    assert.equal(pages.length, 1);
    assert.equal(pages[0].voucher, "VOUCHER-ONE");
    assert.equal(pages[0].acompanantes.length, 2);
});


test("uses the first CSV passenger as titular, not the oldest passenger", () => {

    const reservation = makeReservations()[0];
    const pages = buildFichaPaxPages(reservation);

    assert.equal(
        pages[0].titular.pax.numeroDocumento,
        reservation.pasajeros[0].pax.numeroDocumento
    );
    assert.equal(reservation.pasajeros[0].pax.edad, 22);
    assert.equal(reservation.pasajeros[1].pax.edad, 91);
});


test("preserves CSV order for companions", () => {

    const reservation = makeReservations()[0];
    const pages = buildFichaPaxPages(reservation);

    assert.deepEqual(
        pages.flatMap(page => page.acompanantes)
            .map(passenger => passenger.pax.nombre),
        reservation.pasajeros.slice(1).map(passenger => passenger.pax.nombre)
    );
});


test("puts every companion on a page, adding pages after three companions", () => {

    const reservation = makeReservations()[0];
    const pages = buildFichaPaxPages(reservation);

    assert.equal(pages.length, 3);
    assert.deepEqual(
        pages.map(page => page.acompanantes.length),
        [3, 3, 1]
    );
    assert.deepEqual(
        pages.flatMap(page => page.acompanantes)
            .map(passenger => passenger.pax.numeroDocumento),
        reservation.pasajeros.slice(1)
            .map(passenger => passenger.pax.numeroDocumento)
    );
});


test("repeats titular and voucher details on every continuation page", () => {

    const reservation = makeReservations()[0];
    const pages = buildFichaPaxPages(reservation);
    const firstPage = pages[0];

    for (const page of pages) {
        assert.deepEqual(page.titular, firstPage.titular);
        assert.equal(page.voucher, firstPage.voucher);
        assert.deepEqual(page.estadia, firstPage.estadia);
        assert.deepEqual(page.habitaciones, firstPage.habitaciones);
        assert.equal(page.servicios, firstPage.servicios);
    }

    assert.deepEqual(
        firstPage.habitaciones.map(room => room.numero),
        ["101", "102"]
    );
});


test("searches for vouchers by a partial voucher value", () => {

    const reservations = makeReservations();

    assert.deepEqual(
        searchFichaPax(reservations, "voucher-002"),
        [reservations[1]]
    );
});


test("searches by the DNI of a non-titular passenger", () => {

    const reservations = makeReservations();

    assert.deepEqual(
        searchFichaPax(reservations, "10000002"),
        [reservations[0]]
    );
});


test("searches by the name of a non-titular passenger", () => {

    const reservations = makeReservations();
    reservations[0].pasajeros[4].pax.nombre = "LOPEZ ANA";

    assert.deepEqual(
        searchFichaPax(reservations, "lopez"),
        [reservations[0]]
    );
});


test("does not invent missing passenger or voucher data", () => {

    const passenger = makePassenger(1, {
        alojamiento: null,
        hotel: null,
        estadia: {
            ingreso: null,
            egreso: null
        },
        servicios: null,
        contacto: {
            email: null,
            telefono: null,
            celular: null
        },
        pax: {
            tipoDocumento: null,
            numeroDocumento: null,
            nombre: null,
            edad: null,
            fechaNacimiento: null
        }
    });
    const reservation = makeReservation(null, [passenger]);
    const [page] = buildFichaPaxPages(reservation);

    assert.equal(page.voucher, null);
    assert.equal(page.titular.pax.nombre, null);
    assert.equal(page.titular.pax.numeroDocumento, null);
    assert.equal(page.titular.hotel, null);
    assert.equal(page.estadia.ingreso, null);
    assert.equal(page.estadia.egreso, null);
    assert.equal(page.servicios, null);
});


test("declaration discrepancies do not change titular order", () => {

    const passengers = [
        makePassenger(1, {
            plazas: { cantidad: 2, ocupadas: 1 },
            pax: {
                tipoDocumento: "DNI",
                numeroDocumento: "10000001",
                nombre: "PRIMER PAX",
                edad: 25,
                fechaNacimiento: null
            }
        }),
        makePassenger(2, {
            plazas: { cantidad: 3, ocupadas: 3 },
            pax: {
                tipoDocumento: "DNI",
                numeroDocumento: "10000002",
                nombre: "PAX MAYOR",
                edad: 88,
                fechaNacimiento: null
            }
        })
    ];
    const reservation = makeReservation("VOUCHER-CONFLICT", passengers);
    const [page] = buildFichaPaxPages(reservation);

    assert.equal(
        page.titular.pax.numeroDocumento,
        passengers[0].pax.numeroDocumento
    );
    assert.equal(page.titular.pax.nombre, "PRIMER PAX");
});


test("page projection does not mutate reservation rooms or responsible relations", () => {

    const reservation = makeReservations()[0];
    const relationships = buildResponsibleRelationships([reservation]);
    const reservationSnapshot = JSON.stringify(reservation);
    const roomsSnapshot = JSON.stringify(reservation.habitaciones);
    const relationshipsSnapshot = JSON.stringify(relationships);

    buildFichaPaxPages(reservation);

    assert.equal(JSON.stringify(reservation), reservationSnapshot);
    assert.equal(JSON.stringify(reservation.habitaciones), roomsSnapshot);
    assert.equal(JSON.stringify(relationships), relationshipsSnapshot);
});


test("projected passenger data is isolated from the reservation", () => {

    const reservation = makeReservations()[0];
    const titularSnapshot = JSON.stringify(reservation.pasajeros[0]);
    const companionSnapshot = JSON.stringify(reservation.pasajeros[1]);
    const pages = buildFichaPaxPages(reservation);

    pages[0].titular.pax.nombre = "CAMBIO EN FICHA";
    pages[0].titular.contacto.email = "cambio@example.test";
    pages[0].acompanantes[0].pax.numeroDocumento = "99999999";
    pages[0].acompanantes[0].estadia.ingreso = "01/01/2000";

    assert.equal(
        JSON.stringify(reservation.pasajeros[0]),
        titularSnapshot
    );
    assert.equal(
        JSON.stringify(reservation.pasajeros[1]),
        companionSnapshot
    );
});
