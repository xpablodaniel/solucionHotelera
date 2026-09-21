function buildRoomingReport(reservas) {

    if (!Array.isArray(reservas)) {
        throw new TypeError(
            "buildRoomingReport espera un array de reservas."
        );
    }

    const filas = [];
    const habitaciones = new Set();

    for (const reserva of reservas) {

        if (!reserva || !Array.isArray(reserva.pasajeros)) {
            continue;
        }

        for (const pasajero of reserva.pasajeros) {

            if (!pasajero || typeof pasajero !== "object") {
                continue;
            }

            const habitacion = pasajero.habitacion || {};
            const pax = pasajero.pax || {};
            const numeroHabitacion = habitacion.numero || null;

            if (numeroHabitacion !== null) {
                habitaciones.add(String(numeroHabitacion));
            }

            filas.push({
                habitacion: numeroHabitacion,
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
                voucher: reserva.voucher || null,
                servicio: pasajero.servicios || null,
                estado: pasajero.estado || null,
                paquete: pasajero.paquete || null,
                sede: pasajero.sede || null,
                observacionHabitacion:
                    pasajero.observacionHabitacion || null
            });
        }
    }

    filas.sort((filaA, filaB) => {

        const habitacionA = Number.parseInt(filaA.habitacion, 10);
        const habitacionB = Number.parseInt(filaB.habitacion, 10);

        const numeroA = Number.isNaN(habitacionA) ? Infinity : habitacionA;
        const numeroB = Number.isNaN(habitacionB) ? Infinity : habitacionB;

        if (numeroA !== numeroB) {
            return numeroA - numeroB;
        }

        const nombreA = filaA.nombre || "";
        const nombreB = filaB.nombre || "";

        return nombreA.localeCompare(nombreB, "es");
    });

    return {
        filas,
        estadisticas: {
            reservas: reservas.length,
            pasajeros: filas.length,
            habitaciones: habitaciones.size
        }
    };
}


if (typeof module !== "undefined" && module.exports) {

    module.exports = {
        buildRoomingReport
    };
}
