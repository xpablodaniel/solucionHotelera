const assert = require("node:assert/strict");
const test = require("node:test");

const {
    diagnoseRoomDeclarations
} = require("../../src/business/roomDeclarations");

function makeRoom({
    accommodation = "900",
    number = "101",
    declaredCapacity = [2],
    declaredOccupied = [2],
    inventoryCapacity = 2,
    assignments = []
} = {}) {
    const passengerCount = Math.max(
        declaredCapacity.length,
        declaredOccupied.length,
        assignments.length
    );
    const passengers = Array.from({ length: passengerCount }, (_, index) => ({
        alojamiento: accommodation,
        habitacion: {
            numero: number,
            asignacion: assignments[index] ?? null
        },
        plazas: {
            cantidad: declaredCapacity[index] ?? null,
            ocupadas: declaredOccupied[index] ?? null
        },
        pax: {
            nombre: `PAX-${index + 1}`
        }
    }));

    return {
        alojamiento: accommodation,
        numero: number,
        capacidad: passengers[0]?.plazas.cantidad ?? null,
        ocupadasInformadas: passengers[0]?.plazas.ocupadas ?? null,
        inventario: inventoryCapacity === null
            ? null
            : { capacidad: inventoryCapacity },
        pasajeros: passengers,
        asignaciones: assignments
    };
}

function makeReservation(voucher, rooms) {
    const passengers = rooms.flatMap(room => room.pasajeros);
    return {
        voucher,
        pasajeros: passengers,
        cantidadPasajeros: passengers.length,
        habitaciones: rooms
    };
}

function diagnoseOne(roomOptions) {
    const [diagnostic] = diagnoseRoomDeclarations([
        makeReservation("VOUCHER-1", [makeRoom(roomOptions)])
    ]);
    return diagnostic;
}

test("reports declared occupancy matching the processed passenger count", () => {
    const diagnostic = diagnoseOne({
        declaredCapacity: [2, 2],
        declaredOccupied: [2, 2],
        inventoryCapacity: 2
    });

    assert.equal(diagnostic.cantidadPasajeros, 2);
    assert.deepEqual(diagnostic.plazasOcupadas, {
        estado: "COINCIDE",
        valoresDeclarados: [2, 2],
        cantidadPasajeros: 2
    });
});

test("reports declared occupancy differing from passengers without correction", () => {
    const diagnostic = diagnoseOne({
        declaredCapacity: [2, 2],
        declaredOccupied: [3, 3],
        inventoryCapacity: 3
    });

    assert.deepEqual(diagnostic.plazasOcupadas, {
        estado: "DIFIERE",
        valoresDeclarados: [3, 3],
        cantidadPasajeros: 2
    });
});

test("reports conflicting occupancy declarations and preserves every row value", () => {
    const diagnostic = diagnoseOne({
        declaredCapacity: [2, 2],
        declaredOccupied: [2, 3],
        inventoryCapacity: 3
    });

    assert.deepEqual(diagnostic.plazasOcupadas, {
        estado: "DECLARACION_INCONSISTENTE",
        valoresDeclarados: [2, 3],
        cantidadPasajeros: 2
    });
});

test("reports conflicting occupancy values when another passenger has no declaration", () => {
    const diagnostic = diagnoseOne({
        declaredCapacity: [2, 2, 2],
        declaredOccupied: [2, 3, null],
        inventoryCapacity: 3
    });

    assert.deepEqual(diagnostic.plazasOcupadas, {
        estado: "DECLARACION_INCONSISTENTE",
        valoresDeclarados: [2, 3, null],
        cantidadPasajeros: 3
    });
});

test("distinguishes absent and partially missing occupancy declarations", () => {
    const absent = diagnoseOne({
        declaredCapacity: [2, 2],
        declaredOccupied: [null, null]
    });
    const partial = diagnoseOne({
        declaredCapacity: [2, 2],
        declaredOccupied: [null, 2]
    });

    assert.deepEqual(absent.plazasOcupadas, {
        estado: "SIN_DATO",
        valoresDeclarados: [null, null],
        cantidadPasajeros: 2
    });
    assert.deepEqual(partial.plazasOcupadas, {
        estado: "DECLARACION_INCOMPLETA",
        valoresDeclarados: [null, 2],
        cantidadPasajeros: 2
    });
});

test("compares uniform declared capacity with physical inventory separately", () => {
    const matching = diagnoseOne({
        declaredCapacity: [2, 2],
        declaredOccupied: [2, 2],
        inventoryCapacity: 2
    });
    const differing = diagnoseOne({
        declaredCapacity: [2, 2],
        declaredOccupied: [2, 2],
        inventoryCapacity: 3
    });

    assert.deepEqual(matching.cantidadPlazas, {
        estado: "COINCIDE",
        estadoDeclaracion: "UNIFORME",
        estadoComparacionInventario: "COINCIDE",
        valoresDeclarados: [2, 2],
        capacidadInventario: 2
    });
    assert.deepEqual(differing.cantidadPlazas, {
        estado: "DISCREPANCIA_DESCRIPTIVA",
        estadoDeclaracion: "UNIFORME",
        estadoComparacionInventario: "DISCREPANCIA_DESCRIPTIVA",
        valoresDeclarados: [2, 2],
        capacidadInventario: 3
    });
});

test("reports conflicting, absent, and incomplete declared capacity values", () => {
    const conflicting = diagnoseOne({
        declaredCapacity: [2, 3],
        declaredOccupied: [2, 2],
        inventoryCapacity: 3
    });
    const absent = diagnoseOne({
        declaredCapacity: [null, null],
        declaredOccupied: [2, 2],
        inventoryCapacity: 2
    });
    const partial = diagnoseOne({
        declaredCapacity: [null, 2],
        declaredOccupied: [2, 2],
        inventoryCapacity: 2
    });

    assert.deepEqual(conflicting.cantidadPlazas, {
        estado: "CONFLICTO_DECLARATIVO",
        estadoDeclaracion: "CONFLICTO_DECLARATIVO",
        estadoComparacionInventario: "NO_COMPARABLE",
        valoresDeclarados: [2, 3],
        capacidadInventario: 3
    });
    assert.deepEqual(absent.cantidadPlazas, {
        estado: "SIN_DATO",
        estadoDeclaracion: "SIN_DATO",
        estadoComparacionInventario: "NO_COMPARABLE",
        valoresDeclarados: [null, null],
        capacidadInventario: 2
    });
    assert.deepEqual(partial.cantidadPlazas, {
        estado: "DECLARACION_INCOMPLETA",
        estadoDeclaracion: "DECLARACION_INCOMPLETA",
        estadoComparacionInventario: "NO_COMPARABLE",
        valoresDeclarados: [null, 2],
        capacidadInventario: 2
    });
});

test("does not compare declared capacity when physical inventory is unavailable", () => {
    const diagnostic = diagnoseOne({
        declaredCapacity: [2, 2],
        declaredOccupied: [2, 2],
        inventoryCapacity: null
    });

    assert.deepEqual(diagnostic.cantidadPlazas, {
        estado: "INVENTARIO_DESCONOCIDO",
        estadoDeclaracion: "UNIFORME",
        estadoComparacionInventario: "INVENTARIO_DESCONOCIDO",
        valoresDeclarados: [2, 2],
        capacidadInventario: null
    });
});

test("reports incomplete declared capacity and unavailable inventory separately", () => {
    const diagnostic = diagnoseOne({
        declaredCapacity: [null, 2],
        declaredOccupied: [2, 2],
        inventoryCapacity: null
    });

    assert.equal(
        diagnostic.cantidadPlazas.estadoDeclaracion,
        "DECLARACION_INCOMPLETA"
    );
    assert.equal(
        diagnostic.cantidadPlazas.estadoComparacionInventario,
        "INVENTARIO_DESCONOCIDO"
    );
    assert.deepEqual(diagnostic.cantidadPlazas.valoresDeclarados, [null, 2]);
    assert.equal(diagnostic.cantidadPlazas.capacidadInventario, null);
});

test("diagnoses each voucher-room unit independently, including multiple rooms", () => {
    const first = makeReservation("VOUCHER-A", [
        makeRoom({
            number: "101",
            declaredCapacity: [2],
            declaredOccupied: [1],
            inventoryCapacity: 2
        }),
        makeRoom({
            number: "102",
            declaredCapacity: [3, 3],
            declaredOccupied: [2, 2],
            inventoryCapacity: 3
        })
    ]);
    const second = makeReservation("VOUCHER-B", [
        makeRoom({
            number: "101",
            declaredCapacity: [2],
            declaredOccupied: [1],
            inventoryCapacity: 2
        })
    ]);

    const diagnostics = diagnoseRoomDeclarations([first, second]);

    assert.deepEqual(
        diagnostics.map(item => [
            item.voucher,
            item.alojamiento,
            item.habitacion,
            item.cantidadPasajeros
        ]),
        [
            ["VOUCHER-A", "900", "101", 1],
            ["VOUCHER-A", "900", "102", 2],
            ["VOUCHER-B", "900", "101", 1]
        ]
    );
});

test("counts passenger rows independently of the number of A/B/C assignments", () => {
    const diagnostic = diagnoseOne({
        declaredCapacity: [3, 3, 3],
        declaredOccupied: [3, 3, 3],
        inventoryCapacity: 3,
        assignments: ["A", "B"]
    });

    assert.equal(diagnostic.cantidadPasajeros, 3);
    assert.deepEqual(diagnostic.plazasOcupadas, {
        estado: "COINCIDE",
        valoresDeclarados: [3, 3, 3],
        cantidadPasajeros: 3
    });
});

test("omits rooms that lack voucher, accommodation, or room identity", () => {
    const rooms = [
        makeRoom({ accommodation: null, number: "102" }),
        makeRoom({ number: null })
    ];
    const reservations = [
        makeReservation(null, [makeRoom({ number: "103" })]),
        makeReservation("VOUCHER-2", rooms)
    ];

    assert.deepEqual(diagnoseRoomDeclarations(reservations), []);
});

test("preserves synthetic Hotel 31 de Agosto room declaration discrepancies", () => {
    const reservation = makeReservation("SYN-H31-ROOM-12", [
        makeRoom({
            accommodation: "901",
            number: "12",
            declaredCapacity: [2, 2],
            declaredOccupied: [3, 3],
            inventoryCapacity: 3
        })
    ]);
    const reservations = [reservation];
    const snapshot = JSON.stringify(reservations);

    const diagnostics = diagnoseRoomDeclarations(reservations);
    const diagnostic = diagnostics.find(
        item => item.voucher === "SYN-H31-ROOM-12" &&
            item.alojamiento === "901" &&
            item.habitacion === "12"
    );

    assert.ok(diagnostic);
    assert.equal(diagnostic.cantidadPasajeros, 2);
    assert.deepEqual(diagnostic.plazasOcupadas, {
        estado: "DIFIERE",
        valoresDeclarados: [3, 3],
        cantidadPasajeros: 2
    });
    assert.deepEqual(diagnostic.cantidadPlazas, {
        estado: "DISCREPANCIA_DESCRIPTIVA",
        estadoDeclaracion: "UNIFORME",
        estadoComparacionInventario: "DISCREPANCIA_DESCRIPTIVA",
        valoresDeclarados: [2, 2],
        capacidadInventario: 3
    });
    assert.equal(reservation.cantidadPasajeros, 2);
    assert.equal(JSON.stringify(reservations), snapshot);
});

test("diagnosis does not mutate passengers, declarations, assignments, counts, or inventory", () => {
    const reservation = makeReservation("IMMUTABLE", [
        makeRoom({
            declaredCapacity: [2, 3],
            declaredOccupied: [1, 2],
            inventoryCapacity: 4,
            assignments: ["A", "B"]
        })
    ]);
    const reservations = [reservation];
    const snapshot = JSON.stringify(reservations);
    const passengerReferences = [...reservation.pasajeros];
    const roomReferences = [...reservation.habitaciones];

    diagnoseRoomDeclarations(reservations);

    assert.equal(JSON.stringify(reservations), snapshot);
    assert.equal(reservation.cantidadPasajeros, 2);
    assert.strictEqual(reservation.pasajeros[0], passengerReferences[0]);
    assert.strictEqual(reservation.pasajeros[1], passengerReferences[1]);
    assert.strictEqual(reservation.habitaciones[0], roomReferences[0]);
});

test("keeps occupancy and declared-capacity comparisons independent", () => {
    const diagnostic = diagnoseOne({
        declaredCapacity: [2, 2, 2],
        declaredOccupied: [2, 2, 2],
        inventoryCapacity: 2
    });

    assert.equal(diagnostic.cantidadPasajeros, 3);
    assert.equal(diagnostic.plazasOcupadas.estado, "DIFIERE");
    assert.equal(diagnostic.cantidadPlazas.estado, "COINCIDE");
});
