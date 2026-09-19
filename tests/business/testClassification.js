const {
	normalizeText,
	hasTransport,
	hasFullBoard,
	hasLunchAndDinner,
	hasGroupPackage,
	analyzeRecord,
    classifyRecord,
    classifyReservation
} = require("../../src/business/classification");


function assert(condition, message) {

	if (!condition) {
		throw new Error(
			`❌ TEST FALLIDO: ${message}`
		);
	}
}


console.log("\n=== Tests de clasificación de reservas ===\n");


console.log("Probando normalizeText()...");

assert(
	normalizeText(" pensión completa ") === "PENSION COMPLETA",
	"Debe normalizar espacios y acentos"
);

assert(
	normalizeText("ppj") === "PPJ",
	"Debe convertir a mayúsculas"
);

console.log("✅ normalizeText() OK");


console.log("Probando reserva individual...");

const individual = {
	servicios: "DESAYUNO",
	transporte: "Sin Transporte",
	paquete: null
};

assert(
	hasTransport(individual) === false,
	"La reserva individual no debería tener transporte"
);

assert(
	hasFullBoard(individual) === false,
	"DESAYUNO no debería ser pensión completa"
);

assert(
	hasGroupPackage(individual) === false,
	"La reserva individual no debería tener paquete de grupo"
);

const resultadoIndividual = classifyRecord(individual);

assert(
	resultadoIndividual.tipo === "INDIVIDUAL",
	"La reserva debería clasificarse como INDIVIDUAL"
);

console.log("✅ Reserva individual OK");


console.log("Probando contingente PPJ...");

const grupoPPJ = {
	servicios:
		"ACTIVIDAD RECREATI - COORDINADOR MDQ - PENSIÓN COMPLETA - SEGUROS - SERVICIOS PPJ",
	transporte: "PPJ MDQ BUS 2 - PPJ MDQ 2",
	paquete: "PPJ MAR DEL PLATA 23/10 2"
};

assert(
	hasTransport(grupoPPJ) === true,
	"El PPJ debería tener transporte"
);

assert(
	hasFullBoard(grupoPPJ) === true,
	"El PPJ debería tener pensión completa"
);

assert(
	hasGroupPackage(grupoPPJ) === true,
	"El PPJ debería ser detectado por el paquete"
);

const resultadoPPJ = classifyRecord(grupoPPJ);

assert(
	resultadoPPJ.tipo === "CONTINGENTE",
	"El PPJ debería clasificarse como CONTINGENTE"
);

console.log("✅ Contingente PPJ OK");


console.log("Probando datos insuficientes...");

const incompleto = {
	servicios: "",
	transporte: "",
	paquete: ""
};

const resultadoIncompleto = classifyRecord(incompleto);

assert(
	resultadoIncompleto.tipo === "NO_CLASIFICADA",
	"Los datos insuficientes no deberían clasificarse arbitrariamente"
);

console.log("✅ Datos insuficientes OK");


console.log("Probando almuerzo y cena...");

const grupoComidas = {
	servicios: "ALMUERZO Y CENA",
	transporte: "BUS GRUPO",
	paquete: ""
};

assert(
	hasLunchAndDinner(grupoComidas) === true,
	"Debe detectar almuerzo y cena"
);

const resultadoComidas = classifyRecord(grupoComidas);

assert(
	resultadoComidas.tipo === "CONTINGENTE",
	"Transporte + almuerzo/cena debería ser contingente"
);

console.log("✅ Almuerzo y cena OK");


console.log("Probando analyzeRecord()...");

const analisis = analyzeRecord(grupoPPJ);

assert(
	analisis.transporte === true,
	"El análisis debería detectar transporte"
);

assert(
	analisis.servicios.pensionCompleta === true,
	"El análisis debería detectar pensión completa"
);

assert(
	analisis.paquete.contingente === true,
	"El análisis debería detectar paquete de contingente"
);

// ---------------------------------------------------------
// Clasificación de una reserva completa
// ---------------------------------------------------------

console.log("Probando classifyReservation()...");


const reservaIndividual = [

    {
        voucher: "58000085",

        servicios: "DESAYUNO",

        transporte: "Sin Transporte",

        paquete: ""
    },

    {
        voucher: "58000085",

        servicios: "DESAYUNO",

        transporte: "Sin Transporte",

        paquete: ""
    }
];


const resultadoReservaIndividual =
    classifyReservation(reservaIndividual);


assert(
    resultadoReservaIndividual.tipo === "INDIVIDUAL",
    "La reserva completa debería ser INDIVIDUAL"
);

assert(
    resultadoReservaIndividual.consistente === true,
    "La reserva individual debería ser consistente"
);

assert(
    resultadoReservaIndividual.pasajeros === 2,
    "La reserva debería contener dos pasajeros"
);


console.log(
    "✅ classifyReservation() individual OK"
);


// ---------------------------------------------------------
// Reserva completa PPJ
// ---------------------------------------------------------

const reservaGrupo = [

    {
        voucher: "30188721",

        servicios:
            "ACTIVIDAD RECREATI - COORDINADOR MDQ - PENSIÓN COMPLETA - SEGUROS - SERVICIOS PPJ",

        transporte:
            "PPJ MDQ BUS 2 - PPJ MDQ 2",

        paquete:
            "PPJ MAR DEL PLATA 23/10 2"
    },

    {
        voucher: "30188721",

        servicios:
            "ACTIVIDAD RECREATI - COORDINADOR MDQ - PENSIÓN COMPLETA - SEGUROS - SERVICIOS PPJ",

        transporte:
            "PPJ MDQ BUS 2 - PPJ MDQ 2",

        paquete:
            "PPJ MAR DEL PLATA 23/10 2"
    },

    {
        voucher: "30188721",

        servicios:
            "ACTIVIDAD RECREATI - COORDINADOR MDQ - PENSIÓN COMPLETA - SEGUROS - SERVICIOS PPJ",

        transporte:
            "PPJ MDQ BUS 2 - PPJ MDQ 2",

        paquete:
            "PPJ MAR DEL PLATA 23/10 2"
    }
];


const resultadoReservaGrupo =
    classifyReservation(reservaGrupo);


assert(
    resultadoReservaGrupo.tipo === "CONTINGENTE",
    "La reserva PPJ debería ser CONTINGENTE"
);

assert(
    resultadoReservaGrupo.consistente === true,
    "La reserva PPJ debería ser consistente"
);

assert(
    resultadoReservaGrupo.pasajeros === 3,
    "El grupo debería contener tres pasajeros"
);


console.log(
    "✅ classifyReservation() contingente OK"
);


// ---------------------------------------------------------
// Reserva inconsistente
// ---------------------------------------------------------

console.log(
    "Probando reserva con datos inconsistentes..."
);


const reservaInconsistente = [

    {
        voucher: "99999999",

        servicios: "PENSIÓN COMPLETA",

        transporte: "BUS GRUPO",

        paquete: "PPJ"
    },

    {
        voucher: "99999999",

        servicios: "DESAYUNO",

        transporte: "Sin Transporte",

        paquete: ""
    }
];


const resultadoInconsistente =
    classifyReservation(reservaInconsistente);


assert(
    resultadoInconsistente.tipo === "CONTINGENTE",
    "Debe conservar la evidencia de contingente"
);

assert(
    resultadoInconsistente.consistente === false,
    "La reserva debería marcarse como inconsistente"
);

assert(
    resultadoInconsistente.advertencias.length > 0,
    "La reserva debería generar una advertencia"
);


console.log(
    "✅ Reserva inconsistente OK"
);

console.log("✅ classifyReservation() OK");


// ---------------------------------------------------------
// Reserva vacía
// ---------------------------------------------------------

console.log("Probando reserva vacía...");


const resultadoReservaVacia = classifyReservation([]);


assert(
    resultadoReservaVacia.tipo === "NO_CLASIFICADA",
    "Una reserva vacía no debería clasificarse"
);

assert(
    resultadoReservaVacia.consistente === true &&
    resultadoReservaVacia.pasajeros === 0,
    "Una reserva vacía debería ser consistente y tener cero pasajeros"
);

assert(
    resultadoReservaVacia.advertencias.length === 1,
    "Una reserva vacía debería generar una advertencia"
);


console.log("✅ Reserva vacía OK");


// ---------------------------------------------------------
// Reserva con evidencia fuerte e información incompleta
// ---------------------------------------------------------

console.log("Probando prioridad de contingente...");


const reservaConRegistroIncompleto = [

    {
        servicios: "PENSIÓN COMPLETA",
        transporte: "BUS GRUPO",
        paquete: "PPJ"
    },

    {
        servicios: "",
        transporte: "",
        paquete: ""
    }
];


const resultadoPrioridad = classifyReservation(
    reservaConRegistroIncompleto
);


assert(
    resultadoPrioridad.tipo === "CONTINGENTE",
    "Una evidencia fuerte de contingente debería conservar la clasificación"
);

assert(
    resultadoPrioridad.consistente === false,
    "La mezcla de registros debería marcarse como inconsistente"
);

assert(
    resultadoPrioridad.advertencias.length > 0,
    "La mezcla de clasificaciones debería generar una advertencia"
);


console.log("✅ Prioridad de contingente OK");


// ---------------------------------------------------------
// Validaciones de entrada
// ---------------------------------------------------------

console.log("Probando validaciones de clasificación...");


let errorAnalyzeRecord = false;

try {
    analyzeRecord(null);
}
catch (error) {
    errorAnalyzeRecord = error instanceof TypeError;
}


assert(
    errorAnalyzeRecord,
    "analyzeRecord() debería rechazar registros inválidos"
);


let errorClassifyReservation = false;

try {
    classifyReservation(null);
}
catch (error) {
    errorClassifyReservation = error instanceof TypeError;
}


assert(
    errorClassifyReservation,
    "classifyReservation() debería rechazar entradas que no sean arrays"
);


console.log("✅ Validaciones de clasificación OK");

console.log("\n🎉 Todos los tests de clasificación pasaron.\n");
