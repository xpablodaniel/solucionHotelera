const {
    buildRoomingCsvForDate
} = require("../../src/output/roomingCsvForDate");


function assert(condition, message) {
    if (!condition) {
        throw new Error(`TEST FALLIDO: ${message}`);
    }
}


function passenger({
    name,
    voucher,
    arrival,
    service,
    room
}) {
    return {
        servicios: service,
        alojamiento: "900",
        hotel: "HOTEL DEMO",
        habitacion: { numero: room },
        estadia: {
            ingreso: arrival,
            egreso: "15/10/2026"
        },
        plazas: { cantidad: 2 },
        tipoHabitacion: "DOBLE",
        observacionHabitacion: "SIN OBSERVACIÓN",
        estado: "O",
        paquete: "PPJ",
        sede: "DEMO",
        pax: {
            tipoDocumento: "DNI",
            numeroDocumento: voucher,
            nombre: name,
            edad: 60
        }
    };
}


const juan = passenger({
    name: "JUAN",
    voucher: "100",
    arrival: "10/10/2026",
    service: "Media Pensión",
    room: "101"
});
const maria = passenger({
    name: "MARIA",
    voucher: "100",
    arrival: "15/10/2026",
    service: "MEDIA PENSION",
    room: "102"
});
const pcPassenger = passenger({
    name: "ANA PC",
    voucher: "200",
    arrival: "10/10/2026",
    service: "Pensión Completa",
    room: "201"
});
const breakfastPassenger = passenger({
    name: "LUIS DESAYUNO",
    voucher: "300",
    arrival: "10/10/2026",
    service: "DESAYUNO",
    room: "301"
});
const mapReservation = {
    voucher: "100",
    pasajeros: [juan, maria]
};
const pcReservation = {
    voucher: "200",
    pasajeros: [pcPassenger]
};
const breakfastReservation = {
    voucher: "300",
    pasajeros: [breakfastPassenger]
};
const reservations = [
    mapReservation,
    pcReservation,
    breakfastReservation
];
const originalSnapshot = JSON.stringify(reservations);

const mapRooming = buildRoomingCsvForDate(
    reservations,
    "10/10/2026",
    "MAP"
);

assert(
    mapRooming.filas.length === 1 &&
        mapRooming.filas[0].nombre === "JUAN" &&
        mapRooming.filas[0].voucher === "100",
    "Rooming MAP debe contener solo a Juan, que ingresa en la fecha"
);
assert(
    !mapRooming.csv.includes("MARIA") &&
        !mapRooming.csv.includes("ANA PC") &&
        !mapRooming.csv.includes("LUIS DESAYUNO"),
    "Rooming MAP debe excluir otras fechas, PC y desayuno"
);
assert(
    mapRooming.csv.split("\n").length === 2 &&
        mapRooming.csv.split("\n")[0].split(";").length === 15 &&
        mapRooming.csv.includes(";900"),
    "Rooming MAP debe producir una fila operativa con el contrato CSV existente"
);
assert(
    mapRooming.estadisticas.pasajeros === 1 &&
        mapRooming.estadisticas.habitaciones === 1,
    "Las estadísticas MAP deben corresponder a los pasajeros y habitaciones seleccionados"
);

const pcRooming = buildRoomingCsvForDate(
    reservations,
    "2026-10-10",
    "PC"
);
assert(
    pcRooming.filas.length === 1 &&
        pcRooming.filas[0].nombre === "ANA PC" &&
        pcRooming.filas[0].voucher === "200",
    "Rooming PC debe aceptar fecha ISO y seleccionar solo el pasajero PC del día"
);
assert(
    pcRooming.csv.split("\n").length === 2 &&
        pcRooming.csv.split("\n")[0].split(";").length === 12 &&
        !pcRooming.csv.includes("JUAN"),
    "Rooming PC debe producir su contrato CSV de 12 columnas"
);

const mapEmpty = buildRoomingCsvForDate(
    reservations,
    "12/10/2026",
    "MAP"
);
const pcEmpty = buildRoomingCsvForDate(
    [breakfastReservation],
    "10/10/2026",
    "PC"
);
assert(
    mapEmpty.filas.length === 0 &&
        mapEmpty.csv === null &&
        pcEmpty.csv === null,
    "Sin pasajeros del modo y fecha solicitados no debe haber CSV descargable"
);
assert(
    JSON.stringify(reservations) === originalSnapshot,
    "La selección y el reporte no deben modificar las reservas procesadas"
);

let invalidInputThrew = false;
try {
    buildRoomingCsvForDate(null, "10/10/2026", "MAP");
} catch (error) {
    invalidInputThrew = error instanceof TypeError;
}
assert(
    invalidInputThrew,
    "La entrada inválida debe conservar la validación TypeError de la selección"
);

let invalidModeThrew = false;
try {
    buildRoomingCsvForDate(reservations, "10/10/2026", "BREAKFAST");
} catch (error) {
    invalidModeThrew = error instanceof Error;
}
assert(invalidModeThrew, "El modo debe ser MAP o PC");

console.log("OK pipeline Rooming MAP/PC CSV por fecha");
