function normalizeService(value) {

    return String(value || "")
        .trim()
        .toUpperCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}


function buildPcRoomingReport(reservas) {

    if (!Array.isArray(reservas)) {
        throw new TypeError(
            "buildPcRoomingReport espera un array de reservas."
        );
    }

    const filas = [];

    for (const reserva of reservas) {

        if (!reserva || !Array.isArray(reserva.pasajeros)) {
            continue;
        }

        for (const pasajero of reserva.pasajeros) {

            if (!pasajero || typeof pasajero !== "object") {
                continue;
            }

            if (!normalizeService(pasajero.servicios).includes("PENSION COMPLETA")) {
                continue;
            }

            const habitacion = pasajero.habitacion || {};
            const pax = pasajero.pax || {};

            filas.push({
                habitacion: habitacion.numero || null,
                fechaIngreso: pasajero.estadia
                    ? pasajero.estadia.ingreso
                    : null,
                fechaEgreso: pasajero.estadia
                    ? pasajero.estadia.egreso
                    : null,
                cantidadPlazas: pasajero.plazas
                    ? pasajero.plazas.cantidad
                    : null,
                tipoDocumento: pax.tipoDocumento || null,
                numeroDocumento: pax.numeroDocumento || null,
                nombre: pax.nombre || null,
                edad: pax.edad ?? null,
                observacionHabitacion:
                    pasajero.observacionHabitacion || null,
                tipoHabitacion: pasajero.tipoHabitacion || null
            });
        }
    }

    filas.sort((filaA, filaB) => {

        const numeroA = Number.parseInt(filaA.habitacion, 10);
        const numeroB = Number.parseInt(filaB.habitacion, 10);
        const habitacionA = Number.isNaN(numeroA) ? Infinity : numeroA;
        const habitacionB = Number.isNaN(numeroB) ? Infinity : numeroB;

        if (habitacionA !== habitacionB) {
            return habitacionA - habitacionB;
        }

        return (filaA.nombre || "").localeCompare(
            filaB.nombre || "",
            "es"
        );
    });

    return {
        filas,
        estadisticas: {
            pasajeros: filas.length,
            habitaciones: new Set(
                filas
                    .map(fila => fila.habitacion)
                    .filter(Boolean)
            ).size
        }
    };
}


if (typeof module !== "undefined" && module.exports) {

    module.exports = {
        buildPcRoomingReport,
        normalizeService
    };
}
