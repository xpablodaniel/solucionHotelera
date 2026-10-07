const assert = require("node:assert/strict");
const test = require("node:test");

const {
    findPotentialPassengerDuplicates
} = require("../../src/business/passengerDuplicates");
const {
    buildResponsibleRelationships
} = require("../../src/business/responsibleRelationships");
const {
    buildRooming
} = require("../../src/business/rooming");
const {
    buildVoucherReport
} = require("../../src/output/voucherReport");

function passenger({
    documentType = "DNI",
    documentNumber,
    name,
    service = "MEDIA PENSION",
    room = "101"
}) {
    return {
        alojamiento: "900",
        hotel: "HOTEL 23 DE MAYO",
        servicios: service,
        estadia: {
            ingreso: "11/03/2026",
            egreso: "14/03/2026"
        },
        habitacion: {
            numero: room,
            asignacion: null
        },
        pax: {
            tipoDocumento: documentType,
            numeroDocumento: documentNumber,
            nombre: name
        }
    };
}

function reservation(voucher, passengers) {
    return {
        voucher,
        pasajeros: passengers,
        cantidadPasajeros: passengers.length,
        clasificacion: {
            tipo: "INDIVIDUAL",
            consistente: true,
            advertencias: []
        },
        habitaciones: [{
            alojamiento: "900",
            numero: "101",
            capacidad: 2,
            inventario: { capacidad: 2 },
            pasajeros: passengers,
            asignaciones: []
        }]
    };
}

test("detects matching document identity within the same voucher", () => {
    const reservations = [reservation("MAP-1", [
        passenger({
            documentType: "DNI",
            documentNumber: " 001234 ",
            name: "PAX UNO"
        }),
        passenger({
            documentType: " dni ",
            documentNumber: "001234",
            name: "PAX REPETIDO"
        })
    ])];

    assert.deepEqual(findPotentialPassengerDuplicates(reservations), [{
        voucher: "MAP-1",
        firstPassengerIndex: 0,
        duplicatePassengerIndex: 1,
        tipoDocumento: "DNI",
        numeroDocumento: "001234"
    }]);
});

test("preserves document-number characters including leading zeroes", () => {
    const reservations = [reservation("ZEROS", [
        passenger({
            documentNumber: "001234",
            name: "PAX CON CERO"
        }),
        passenger({
            documentNumber: "1234",
            name: "PAX SIN CERO"
        })
    ])];

    assert.deepEqual(findPotentialPassengerDuplicates(reservations), []);
});

test("does not report the same number with different document types", () => {
    const reservations = [reservation("TIPOS-DISTINTOS", [
        passenger({
            documentType: "DNI",
            documentNumber: "123456",
            name: "PAX DNI"
        }),
        passenger({
            documentType: "PASAPORTE",
            documentNumber: "123456",
            name: "PAX PASAPORTE"
        })
    ])];

    assert.deepEqual(findPotentialPassengerDuplicates(reservations), []);
});

test("does not infer duplicate identity from names or incomplete documents", () => {
    const reservations = [reservation("INCOMPLETOS", [
        passenger({
            documentType: "",
            documentNumber: "123456",
            name: "MISMO NOMBRE"
        }),
        passenger({
            documentType: null,
            documentNumber: "123456",
            name: "MISMO NOMBRE"
        }),
        passenger({
            documentType: "DNI",
            documentNumber: "",
            name: "MISMO NOMBRE"
        }),
        passenger({
            documentType: "DNI",
            documentNumber: null,
            name: "MISMO NOMBRE"
        }),
        passenger({
            documentType: null,
            documentNumber: null,
            name: "MISMO NOMBRE"
        })
    ])];

    assert.deepEqual(findPotentialPassengerDuplicates(reservations), []);
});

test("treats document types or numbers containing only spaces as empty", () => {
    const reservations = [reservation("SOLO-ESPACIOS", [
        passenger({
            documentType: "   ",
            documentNumber: "123456",
            name: "MISMO NOMBRE"
        }),
        passenger({
            documentType: "DNI",
            documentNumber: "123456",
            name: "MISMO NOMBRE"
        }),
        passenger({
            documentType: "DNI",
            documentNumber: "   ",
            name: "MISMO NOMBRE"
        }),
        passenger({
            documentType: "DNI",
            documentNumber: "654321",
            name: "MISMO NOMBRE"
        })
    ])];

    assert.deepEqual(findPotentialPassengerDuplicates(reservations), []);
});

test("does not report the same document in different vouchers as an intra-voucher duplicate", () => {
    const reservations = [
        reservation("VOUCHER-A", [
            passenger({
                documentNumber: "12345678",
                name: "PAX A"
            })
        ]),
        reservation("VOUCHER-B", [
            passenger({
                documentNumber: "12345678",
                name: "PAX B"
            })
        ])
    ];

    assert.deepEqual(findPotentialPassengerDuplicates(reservations), []);

    const relationships = buildResponsibleRelationships(reservations);
    assert.equal(
        relationships.indexByResponsibleDni["12345678"].cantidadVouchers,
        2
    );
});

test("reports a duplicate without mutating passenger order, counts, rooming, vouchers, or relationships", () => {
    const mapPassengers = [
        passenger({
            documentType: "DNI",
            documentNumber: "009876",
            name: "PRIMER PAX"
        }),
        passenger({
            documentType: " dni ",
            documentNumber: "009876",
            name: "SEGUNDO PAX"
        })
    ];
    const pcPassengers = [
        passenger({
            documentType: "DNI",
            documentNumber: "009876",
            name: "PRIMER PAX PC",
            service: "PENSION COMPLETA",
            room: "102"
        }),
        passenger({
            documentType: "dni",
            documentNumber: "009876",
            name: "SEGUNDO PAX PC",
            service: "PENSION COMPLETA",
            room: "102"
        })
    ];
    const reservations = [
        reservation("MAP-DUP", mapPassengers),
        reservation("PC-DUP", pcPassengers)
    ];
    const originalSnapshot = JSON.stringify(reservations);

    const duplicates = findPotentialPassengerDuplicates(reservations);

    assert.deepEqual(duplicates, [
        {
            voucher: "MAP-DUP",
            firstPassengerIndex: 0,
            duplicatePassengerIndex: 1,
            tipoDocumento: "DNI",
            numeroDocumento: "009876"
        },
        {
            voucher: "PC-DUP",
            firstPassengerIndex: 0,
            duplicatePassengerIndex: 1,
            tipoDocumento: "DNI",
            numeroDocumento: "009876"
        }
    ]);
    assert.equal(JSON.stringify(reservations), originalSnapshot);
    assert.equal(reservations[0].cantidadPasajeros, 2);
    assert.strictEqual(reservations[0].pasajeros[0], mapPassengers[0]);
    assert.strictEqual(reservations[0].pasajeros[1], mapPassengers[1]);

    const mapReport = buildVoucherReport([reservations[0]], "MAP")[0];
    const pcReport = buildVoucherReport([reservations[1]], "PC")[0];
    assert.equal(mapReport.cantidadPasajeros, 2);
    assert.equal(mapReport.representante, "PRIMER PAX");
    assert.equal(pcReport.cantidadPasajeros, 2);
    assert.equal(pcReport.representante, "PRIMER PAX PC");

    const rooming = buildRooming([reservations[0]])[0];
    assert.equal(rooming.cantidadPasajeros, 2);
    assert.deepEqual(rooming.pasajeros, mapPassengers);

    const relationships = buildResponsibleRelationships(reservations);
    assert.equal(
        relationships.indexByResponsibleDni["009876"].cantidadVouchers,
        2
    );
    assert.equal(JSON.stringify(reservations), originalSnapshot);
});
