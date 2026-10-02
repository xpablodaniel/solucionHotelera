const {
    buildNonRelatableView
} = require("../../src/business/nonRelatableView");


function assert(condition, message) {
    if (!condition) {
        throw new Error(`❌ TEST FALLIDO: ${message}`);
    }
}


const relationships = {
    indexByResponsibleDni: {
        "12345678": {
            responsableDni: "12345678",
            vouchers: [{ voucher: "VALIDO-1", reservaIndex: 0, alojamiento: "901", habitaciones: ["5"] }],
            cantidadVouchers: 1
        }
    },
    orphanReservations: [
        { voucher: "30250001", motivo: "sinTitularValido" },
        { voucher: null, motivo: "sinTitularValido" }
    ],
    ignoredReservations: [
        { voucher: "30250002", motivo: "dniResponsableNoDisponible" }
    ]
};

const view = buildNonRelatableView(relationships);

// orphan → "Sin titular identificable"
assert(
    view.filas[0].voucher === "30250001" &&
    view.filas[0].etiqueta === "Sin titular identificable",
    "orphanReservations debe proyectarse como 'Sin titular identificable'"
);

// voucher null → "—"
assert(
    view.filas[1].voucher === "—" &&
    view.filas[1].etiqueta === "Sin titular identificable",
    "voucher null debe representarse como '—'"
);

// ignored → "Titular sin documento"
assert(
    view.filas[2].voucher === "30250002" &&
    view.filas[2].etiqueta === "Titular sin documento",
    "ignoredReservations debe proyectarse como 'Titular sin documento'"
);

// reservas válidas no aparecen
assert(
    !view.filas.some(fila => fila.voucher === "VALIDO-1"),
    "Una reserva válida no debe aparecer en la vista"
);

// cantidad === filas.length
assert(
    view.cantidad === view.filas.length && view.cantidad === 3,
    "El contador debe coincidir con la cantidad de filas"
);

// ambas fuentes se combinan sin perder registros
assert(
    view.cantidad ===
        relationships.orphanReservations.length +
        relationships.ignoredReservations.length,
    "Ambas colecciones deben combinarse sin perder registros"
);

// motivo desconocido → etiqueta de resguardo, nunca inventada
const viewMotivoNuevo = buildNonRelatableView({
    orphanReservations: [{ voucher: "X", motivo: "motivoFuturo" }],
    ignoredReservations: []
});
assert(
    viewMotivoNuevo.filas[0].etiqueta === "Motivo no reconocido",
    "Un motivo fuera del contrato debe usar la etiqueta de resguardo"
);

// entrada defensiva: relaciones ausentes o incompletas → vista vacía
for (const entrada of [null, undefined, {}, { orphanReservations: null }]) {
    const vacia = buildNonRelatableView(entrada);
    assert(
        vacia.cantidad === 0 && vacia.filas.length === 0,
        "Entrada incompleta debe producir vista vacía"
    );
}

// inmutabilidad: mutar el resultado no modifica las colecciones originales
const orphanAntes = JSON.stringify(relationships.orphanReservations);
const ignoredAntes = JSON.stringify(relationships.ignoredReservations);
const vistaMutable = buildNonRelatableView(relationships);
vistaMutable.filas.push({ voucher: "MUTADO", etiqueta: "MUTADO" });
vistaMutable.filas[0].voucher = "MUTADO";
vistaMutable.cantidad = 99;

assert(
    JSON.stringify(relationships.orphanReservations) === orphanAntes &&
    JSON.stringify(relationships.ignoredReservations) === ignoredAntes,
    "Mutar la vista no debe modificar las colecciones originales"
);

assert(
    buildNonRelatableView(relationships).cantidad === 3,
    "Reconstruir la vista debe producir el mismo resultado tras mutaciones externas"
);

console.log("✅ testNonRelatableView: todos los casos pasaron.");
