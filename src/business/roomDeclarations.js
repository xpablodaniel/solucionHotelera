function getDeclarationStatus(values, {
    matchingStatus,
    differingStatus,
    conflictingStatus
}) {
    const presentValues = values.filter(value => value !== null);
    const distinctValues = new Set(presentValues);

    if (distinctValues.size > 1) {
        return conflictingStatus;
    }

    if (presentValues.length === 0) {
        return "SIN_DATO";
    }

    if (presentValues.length !== values.length) {
        return "DECLARACION_INCOMPLETA";
    }

    return {
        value: presentValues[0],
        distinctStatus: matchingStatus,
        differingStatus
    };
}

function diagnoseOccupancy(values, cantidadPasajeros) {
    const status = getDeclarationStatus(values, {
        matchingStatus: "COINCIDE",
        differingStatus: "DIFIERE",
        conflictingStatus: "DECLARACION_INCONSISTENTE"
    });

    if (typeof status === "string") {
        return {
            estado: status,
            valoresDeclarados: values,
            cantidadPasajeros
        };
    }

    return {
        estado: status.value === cantidadPasajeros
            ? status.distinctStatus
            : status.differingStatus,
        valoresDeclarados: values,
        cantidadPasajeros
    };
}

function diagnoseDeclaredCapacity(values, capacidadInventario) {
    const status = getDeclarationStatus(values, {
        matchingStatus: "COINCIDE",
        differingStatus: "DISCREPANCIA_DESCRIPTIVA",
        conflictingStatus: "CONFLICTO_DECLARATIVO"
    });

    const estadoDeclaracion = typeof status === "string"
        ? status
        : "UNIFORME";
    const estadoComparacionInventario =
        !Number.isFinite(capacidadInventario)
            ? "INVENTARIO_DESCONOCIDO"
            : typeof status === "string"
                ? "NO_COMPARABLE"
            : status.value === capacidadInventario
                ? status.distinctStatus
                : status.differingStatus;

    if (typeof status === "string") {
        return {
            estado: status,
            estadoDeclaracion,
            estadoComparacionInventario,
            valoresDeclarados: values,
            capacidadInventario
        };
    }

    if (!Number.isFinite(capacidadInventario)) {
        return {
            estado: "INVENTARIO_DESCONOCIDO",
            estadoDeclaracion,
            estadoComparacionInventario,
            valoresDeclarados: values,
            capacidadInventario: null
        };
    }

    return {
        estado: estadoComparacionInventario,
        estadoDeclaracion,
        estadoComparacionInventario,
        valoresDeclarados: values,
        capacidadInventario
    };
}

function hasIdentity(value) {
    return value !== undefined &&
        value !== null &&
        String(value).trim() !== "";
}

function diagnoseRoomDeclarations(reservations) {
    if (!Array.isArray(reservations)) {
        throw new TypeError(
            "diagnoseRoomDeclarations espera un array de reservas."
        );
    }

    const diagnostics = [];

    for (const reservation of reservations) {
        if (!reservation || !Array.isArray(reservation.habitaciones)) {
            throw new TypeError(
                "Cada reserva debe incluir un array de habitaciones."
            );
        }

        for (const room of reservation.habitaciones) {
            if (!room || !Array.isArray(room.pasajeros)) {
                throw new TypeError(
                    "Cada habitación debe incluir un array de pasajeros."
                );
            }

            if (
                !hasIdentity(reservation.voucher) ||
                !hasIdentity(room.alojamiento) ||
                !hasIdentity(room.numero)
            ) {
                continue;
            }

            const pasajeros = room.pasajeros;
            const valoresOcupadas = pasajeros.map(passenger =>
                passenger?.plazas?.ocupadas ?? null
            );
            const valoresCantidad = pasajeros.map(passenger =>
                passenger?.plazas?.cantidad ?? null
            );
            const capacidadInventario = Number.isFinite(
                room.inventario?.capacidad
            )
                ? room.inventario.capacidad
                : null;

            diagnostics.push({
                voucher: reservation.voucher,
                alojamiento: room.alojamiento,
                habitacion: room.numero,
                cantidadPasajeros: pasajeros.length,
                plazasOcupadas: diagnoseOccupancy(
                    valoresOcupadas,
                    pasajeros.length
                ),
                cantidadPlazas: diagnoseDeclaredCapacity(
                    valoresCantidad,
                    capacidadInventario
                )
            });
        }
    }

    return diagnostics;
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        diagnoseRoomDeclarations
    };
}
