var GroupMealVouchersCore = (() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __commonJS = (cb, mod) => function __require() {
    try {
      return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
    } catch (e) {
      throw mod = 0, e;
    }
  };

  // src/parser/csvParser.js
  var require_csvParser = __commonJS({
    "src/parser/csvParser.js"(exports, module) {
      function cleanText(value) {
        if (value === void 0 || value === null) {
          return null;
        }
        const text = String(value).trim();
        return text === "" ? null : text;
      }
      function parseInteger(value) {
        const text = cleanText(value);
        if (text === null) {
          return null;
        }
        const number = Number.parseInt(text, 10);
        return Number.isNaN(number) ? null : number;
      }
      function parseRoom(value) {
        const original = cleanText(value);
        if (original === null) {
          return {
            original: null,
            numero: null,
            asignacion: null
          };
        }
        const match = original.match(/^(\d+)\s*([A-Za-z])?$/);
        if (!match) {
          return {
            original,
            numero: original,
            asignacion: null
          };
        }
        return {
          original,
          numero: match[1],
          asignacion: match[2] ? match[2].toUpperCase() : null
        };
      }
      function parseRow(fields) {
        if (!Array.isArray(fields)) {
          throw new TypeError("parseRow espera un array de columnas.");
        }
        if (fields.length !== 28) {
          throw new Error(
            `Cantidad de columnas inesperada: ${fields.length}. Se esperaban 28.`
          );
        }
        return {
          alojamiento: cleanText(fields[0]),
          hotel: cleanText(fields[1]),
          habitacion: parseRoom(fields[2]),
          tipoHabitacion: cleanText(fields[3]),
          observacionHabitacion: cleanText(fields[4]),
          plazas: {
            cantidad: parseInteger(fields[5]),
            ocupadas: parseInteger(fields[10])
          },
          voucher: cleanText(fields[6]),
          sede: cleanText(fields[7]),
          estadia: {
            ingreso: cleanText(fields[8]),
            egreso: cleanText(fields[9])
          },
          pax: {
            tipoDocumento: cleanText(fields[11]),
            numeroDocumento: cleanText(fields[12]),
            nombre: cleanText(fields[13]),
            edad: parseInteger(fields[14]),
            fechaNacimiento: cleanText(fields[24])
          },
          entidad: cleanText(fields[15]),
          servicios: cleanText(fields[16]),
          paquete: cleanText(fields[17]),
          transporte: cleanText(fields[18]),
          viaje: {
            fecha: cleanText(fields[19]),
            hora: cleanText(fields[20]),
            parada: cleanText(fields[21])
          },
          contacto: {
            email: cleanText(fields[22]),
            telefono: cleanText(fields[25]),
            celular: cleanText(fields[26])
          },
          estado: cleanText(fields[23]),
          usuario: cleanText(fields[27])
        };
      }
      function parseCSVLine(line) {
        const fields = [];
        let field = "";
        let insideQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            if (insideQuotes && line[i + 1] === '"') {
              field += '"';
              i++;
            } else {
              insideQuotes = !insideQuotes;
            }
            continue;
          }
          if (char === "," && !insideQuotes) {
            fields.push(field);
            field = "";
            continue;
          }
          field += char;
        }
        fields.push(field);
        return fields;
      }
      function parseCSV(csvText) {
        if (typeof csvText !== "string") {
          throw new TypeError(
            "parseCSV espera un texto CSV."
          );
        }
        const lines = csvText.split(/\r?\n/).map((line) => line.trim()).filter((line) => line !== "");
        if (lines.length === 0) {
          return [];
        }
        const header = parseCSVLine(lines[0]);
        const dataRows = lines.slice(1);
        return dataRows.map((line) => parseCSVLine(line)).filter((fields) => fields.length === 28).map((fields) => parseRow(fields));
      }
      if (typeof module !== "undefined" && module.exports) {
        module.exports = {
          cleanText,
          parseInteger,
          parseRoom,
          parseRow,
          parseCSV,
          parseCSVLine
        };
      }
    }
  });

  // src/hotel/rooms.js
  var require_rooms = __commonJS({
    "src/hotel/rooms.js"(exports, module) {
      var ROOM_TYPES = Object.freeze({
        II: Object.freeze({
          codigo: "II",
          tipo: "DOBLE INDIVIDUAL",
          capacidad: 2
        }),
        X: Object.freeze({
          codigo: "X",
          tipo: "DOBLE MATRIMONIAL",
          capacidad: 2
        }),
        III: Object.freeze({
          codigo: "III",
          tipo: "TRIPLE INDIVIDUAL",
          capacidad: 3
        }),
        XI: Object.freeze({
          codigo: "XI",
          tipo: "TRIPLE MATRIMONIAL",
          capacidad: 3
        }),
        XII: Object.freeze({
          codigo: "XII",
          tipo: "CUADRUPLE",
          capacidad: 4
        })
      });
      var ROOMS_DATA = [
        // -----------------------------------------------------
        // PRIMER PISO
        // -----------------------------------------------------
        ["101", 1, "X"],
        ["102", 1, "X"],
        ["103", 1, "X"],
        ["104", 1, "II"],
        ["105", 1, "X"],
        ["106", 1, "X"],
        ["107", 1, "X"],
        ["108", 1, "II"],
        ["109", 1, "X"],
        ["110", 1, "X"],
        ["111", 1, "X"],
        ["112", 1, "X"],
        ["113", 1, "X"],
        ["114", 1, "II"],
        ["115", 1, "X"],
        ["116", 1, "III"],
        ["117", 1, "III"],
        ["118", 1, "X"],
        ["119", 1, "X"],
        ["120", 1, "X"],
        ["121", 1, "X"],
        // -----------------------------------------------------
        // SEGUNDO PISO
        // -----------------------------------------------------
        ["222", 2, "X"],
        ["223", 2, "II"],
        ["224", 2, "II"],
        ["225", 2, "X"],
        ["226", 2, "X"],
        ["227", 2, "X"],
        ["228", 2, "X"],
        ["229", 2, "X"],
        ["230", 2, "X"],
        ["231", 2, "II"],
        ["232", 2, "II"],
        ["233", 2, "X"],
        ["234", 2, "X"],
        ["235", 2, "X"],
        ["236", 2, "X"],
        ["237", 2, "III"],
        ["238", 2, "III"],
        ["239", 2, "X"],
        ["240", 2, "XII"],
        ["241", 2, "X"],
        ["242", 2, "X"],
        // -----------------------------------------------------
        // TERCER PISO
        // -----------------------------------------------------
        ["343", 3, "X"],
        ["344", 3, "X"],
        ["345", 3, "X"],
        ["346", 3, "X"],
        ["347", 3, "X"],
        ["348", 3, "X"],
        ["349", 3, "II"],
        ["350", 3, "II"],
        ["351", 3, "X"],
        ["352", 3, "X"],
        ["353", 3, "II"]
      ];
      var ROOMS = Object.freeze(
        ROOMS_DATA.map(([numero, piso, codigo]) => {
          const type = ROOM_TYPES[codigo];
          if (!type) {
            throw new Error(
              `C\xF3digo de habitaci\xF3n desconocido: ${codigo}`
            );
          }
          return Object.freeze({
            numero,
            piso,
            codigoTipo: type.codigo,
            tipo: type.tipo,
            capacidad: type.capacidad
          });
        })
      );
      var HOTEL_31_AGOSTO_ROOM_TYPES = Object.freeze({
        II: Object.freeze({
          codigo: "II",
          tipo: "DOBLE INDIVIDUAL",
          capacidad: 2
        }),
        X: Object.freeze({
          codigo: "X",
          tipo: "DOBLE MATRIMONIAL",
          capacidad: 2
        }),
        III: Object.freeze({
          codigo: "III",
          tipo: "TRIPLE INDIVIDUAL",
          capacidad: 3
        }),
        XI: Object.freeze({
          codigo: "XI",
          tipo: "TRIPLE MIXTA",
          capacidad: 3
        }),
        XIII: Object.freeze({
          codigo: "XIII",
          tipo: "QUINTUPLE FAMILIAR GRANDE",
          capacidad: 5
        })
      });
      var HOTEL_31_AGOSTO_ROOMS_DATA = [
        ["5", 0, "X"],
        ["6", 0, "X"],
        ["7", 0, "XI"],
        ["8", 0, "X"],
        ["9", 1, "X"],
        ["10", 1, "X"],
        ["11", 1, "XI"],
        ["12", 1, "XI"],
        ["13", 1, "III"],
        ["14", 1, "II"],
        ["15", 1, "X"],
        ["16", 1, "X"],
        ["17", 1, "X"],
        ["18", 2, "X"],
        ["19", 2, "X"],
        ["20", 2, "XI"],
        ["21", 2, "XI"],
        ["22", 2, "XI"],
        ["23", 2, "II"],
        ["24", 2, "X"],
        ["25", 2, "X"],
        ["26", 2, "X"],
        ["27", 3, "XIII"],
        ["28", 3, "XI"]
      ];
      var HOTEL_31_AGOSTO_ROOMS = Object.freeze(
        HOTEL_31_AGOSTO_ROOMS_DATA.map(([numero, piso, codigo]) => {
          const type = HOTEL_31_AGOSTO_ROOM_TYPES[codigo];
          if (!type) {
            throw new Error(
              `C\xF3digo de habitaci\xF3n desconocido para Hotel 31 de Agosto: ${codigo}`
            );
          }
          return Object.freeze({
            numero,
            piso,
            codigoTipo: type.codigo,
            tipo: type.tipo,
            capacidad: type.capacidad
          });
        })
      );
      var HOTEL_INVENTORIES = Object.freeze({
        "900": Object.freeze({
          alojamiento: "900",
          hotel: "HOTEL 23 DE MAYO",
          roomTypes: ROOM_TYPES,
          rooms: ROOMS
        }),
        "901": Object.freeze({
          alojamiento: "901",
          hotel: "HOTEL 31 DE AGOSTO",
          roomTypes: HOTEL_31_AGOSTO_ROOM_TYPES,
          rooms: HOTEL_31_AGOSTO_ROOMS
        })
      });
      function getHotelInventory(alojamiento) {
        return HOTEL_INVENTORIES[String(alojamiento).trim()] || null;
      }
      function getRoom(alojamientoOrNumero, numero) {
        const hasAccommodation = numero !== void 0;
        const inventory = getHotelInventory(
          hasAccommodation ? alojamientoOrNumero : "900"
        );
        if (!inventory) {
          return null;
        }
        const roomNumber = String(
          hasAccommodation ? numero : alojamientoOrNumero
        ).trim();
        return inventory.rooms.find(
          (room) => room.numero === roomNumber
        ) || null;
      }
      function getAllRooms(alojamiento = "900") {
        const inventory = getHotelInventory(alojamiento);
        return inventory ? inventory.rooms : [];
      }
      function getRoomsByFloor(alojamientoOrFloor, floor) {
        const hasAccommodation = floor !== void 0;
        const inventory = getHotelInventory(
          hasAccommodation ? alojamientoOrFloor : "900"
        );
        const targetFloor = hasAccommodation ? floor : alojamientoOrFloor;
        return (inventory ? inventory.rooms : []).filter(
          (room) => room.piso === targetFloor
        );
      }
      function getRoomsByType(alojamientoOrCode, code) {
        const hasAccommodation = code !== void 0;
        const inventory = getHotelInventory(
          hasAccommodation ? alojamientoOrCode : "900"
        );
        const targetCode = hasAccommodation ? code : alojamientoOrCode;
        return (inventory ? inventory.rooms : []).filter(
          (room) => room.codigoTipo === targetCode
        );
      }
      function getTotalCapacity(alojamiento = "900") {
        const inventory = getHotelInventory(alojamiento);
        if (!inventory) {
          return 0;
        }
        return inventory.rooms.reduce(
          (total, room) => total + room.capacidad,
          0
        );
      }
      function getRoomCount(alojamiento = "900") {
        const inventory = getHotelInventory(alojamiento);
        return inventory ? inventory.rooms.length : 0;
      }
      if (typeof module !== "undefined" && module.exports) {
        module.exports = {
          ROOM_TYPES,
          ROOMS,
          HOTEL_31_AGOSTO_ROOM_TYPES,
          HOTEL_31_AGOSTO_ROOMS,
          HOTEL_INVENTORIES,
          getRoom,
          getAllRooms,
          getRoomsByFloor,
          getRoomsByType,
          getTotalCapacity,
          getRoomCount
        };
      }
    }
  });

  // src/business/reservation.js
  var require_reservation = __commonJS({
    "src/business/reservation.js"(exports, module) {
      var {
        getRoom
      } = require_rooms();
      function groupByVoucher(records) {
        if (!Array.isArray(records)) {
          throw new TypeError(
            "groupByVoucher espera un array de registros."
          );
        }
        const reservations = /* @__PURE__ */ new Map();
        for (const record of records) {
          const voucher = record.voucher;
          if (!voucher) {
            continue;
          }
          if (!reservations.has(voucher)) {
            reservations.set(voucher, {
              voucher,
              pasajeros: []
            });
          }
          reservations.get(voucher).pasajeros.push(record);
        }
        return Array.from(reservations.values());
      }
      if (typeof module !== "undefined" && module.exports) {
        module.exports = {
          groupByVoucher
        };
      }
      function groupByRoom(records, esContingente = false) {
        if (!Array.isArray(records)) {
          throw new TypeError(
            "groupByRoom espera un array de registros."
          );
        }
        const rooms = /* @__PURE__ */ new Map();
        for (const record of records) {
          if (!record.habitacion) {
            continue;
          }
          const numero = record.habitacion.numero;
          if (!numero) {
            continue;
          }
          const alojamiento = record.alojamiento || null;
          const roomKey = JSON.stringify([alojamiento, numero]);
          if (!rooms.has(roomKey)) {
            rooms.set(roomKey, {
              alojamiento,
              numero,
              inventario: alojamiento ? getRoom(alojamiento, numero) : getRoom(numero),
              capacidad: record.plazas ? record.plazas.cantidad : null,
              ocupadasInformadas: record.plazas ? record.plazas.ocupadas : null,
              pasajeros: [],
              asignaciones: []
            });
          }
          const room = rooms.get(roomKey);
          room.pasajeros.push(record);
          if (esContingente && record.habitacion.asignacion) {
            room.asignaciones.push(
              record.habitacion.asignacion
            );
          }
        }
        return Array.from(rooms.values());
      }
      if (typeof module !== "undefined" && module.exports) {
        module.exports = {
          groupByVoucher,
          groupByRoom
        };
      }
    }
  });

  // src/business/classification.js
  var require_classification = __commonJS({
    "src/business/classification.js"(exports, module) {
      function normalizeText(value) {
        if (value === void 0 || value === null) {
          return "";
        }
        return String(value).trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      }
      function hasTransport(record) {
        const transporte = normalizeText(
          record?.transporte
        );
        if (!transporte) {
          return false;
        }
        return !(transporte === "SIN TRANSPORTE" || transporte === "SIN TRANSPORTE ");
      }
      function hasFullBoard(record) {
        const servicios = normalizeText(
          record?.servicios
        );
        return servicios.includes("PENSION COMPLETA");
      }
      function hasLunchAndDinner(record) {
        const servicios = normalizeText(
          record?.servicios
        );
        return servicios.includes("ALMUERZO Y CENA") || servicios.includes("ALMUERZO-CENA") || servicios.includes("ALMUERZO - CENA");
      }
      function hasGroupPackage(record) {
        const paquete = normalizeText(
          record?.paquete
        );
        if (!paquete) {
          return false;
        }
        return paquete.includes("PPJ") || paquete.includes("EGRESADO") || paquete.includes("JUEGOS BONAERENSES");
      }
      function analyzeRecord(record) {
        if (!record || typeof record !== "object") {
          throw new TypeError(
            "analyzeRecord espera un registro."
          );
        }
        const transporte = hasTransport(record);
        const pensionCompleta = hasFullBoard(record);
        const almuerzoCena = hasLunchAndDinner(record);
        const paqueteContingente = hasGroupPackage(record);
        return {
          transporte,
          servicios: {
            pensionCompleta,
            almuerzoCena
          },
          paquete: {
            contingente: paqueteContingente
          }
        };
      }
      function classifyRecord(record) {
        const evidencias = analyzeRecord(record);
        const transporte = normalizeText(record.transporte);
        const razones = [];
        let puntosContingente = 0;
        let puntosIndividual = 0;
        if (evidencias.transporte) {
          puntosContingente++;
          razones.push(
            "Tiene transporte"
          );
        } else if (transporte === "SIN TRANSPORTE") {
          puntosIndividual++;
          razones.push(
            "Sin transporte"
          );
        } else {
          razones.push(
            "Transporte no informado"
          );
        }
        if (evidencias.servicios.pensionCompleta) {
          puntosContingente++;
          razones.push(
            "Tiene pensi\xF3n completa"
          );
        }
        if (evidencias.servicios.almuerzoCena) {
          puntosContingente++;
          razones.push(
            "Tiene almuerzo y cena"
          );
        }
        if (evidencias.paquete.contingente) {
          puntosContingente++;
          razones.push(
            "El paquete contiene indicador de contingente"
          );
        }
        let tipo;
        if (puntosContingente >= 2 && puntosContingente > puntosIndividual) {
          tipo = "CONTINGENTE";
        } else if (puntosIndividual > puntosContingente) {
          tipo = "INDIVIDUAL";
        } else {
          tipo = "NO_CLASIFICADA";
        }
        return {
          tipo,
          puntos: {
            contingente: puntosContingente,
            individual: puntosIndividual
          },
          razones,
          evidencias
        };
      }
      function classifyReservation(records) {
        if (!Array.isArray(records)) {
          throw new TypeError(
            "classifyReservation espera un array de registros."
          );
        }
        if (records.length === 0) {
          return {
            tipo: "NO_CLASIFICADA",
            consistente: true,
            pasajeros: 0,
            resultados: [],
            advertencias: [
              "La reserva no contiene registros."
            ]
          };
        }
        const resultados = records.map(
          (record) => classifyRecord(record)
        );
        const tipos = new Set(
          resultados.map((resultado) => resultado.tipo)
        );
        const advertencias = [];
        if (tipos.size > 1) {
          advertencias.push(
            "Los pasajeros de la reserva presentan clasificaciones diferentes."
          );
        }
        let tipo;
        if (tipos.has("CONTINGENTE")) {
          tipo = "CONTINGENTE";
        } else if (tipos.has("NO_CLASIFICADA")) {
          tipo = "NO_CLASIFICADA";
        } else {
          tipo = "INDIVIDUAL";
        }
        return {
          tipo,
          consistente: tipos.size === 1,
          pasajeros: records.length,
          resultados,
          advertencias
        };
      }
      if (typeof module !== "undefined" && module.exports) {
        module.exports = {
          normalizeText,
          hasTransport,
          hasFullBoard,
          hasLunchAndDinner,
          hasGroupPackage,
          analyzeRecord,
          classifyRecord,
          classifyReservation
        };
      }
    }
  });

  // src/business/processReservations.js
  var require_processReservations = __commonJS({
    "src/business/processReservations.js"(exports, module) {
      var {
        groupByVoucher,
        groupByRoom
      } = require_reservation();
      var {
        classifyReservation
      } = require_classification();
      function processReservations(records) {
        if (!Array.isArray(records)) {
          throw new TypeError(
            "processReservations espera un array de registros."
          );
        }
        const grouped = groupByVoucher(records);
        return grouped.map((group) => {
          const pasajeros = group.pasajeros;
          const clasificacion = classifyReservation(pasajeros);
          const esContingente = clasificacion.tipo === "CONTINGENTE";
          const habitaciones = groupByRoom(pasajeros, esContingente);
          return {
            voucher: group.voucher,
            pasajeros,
            cantidadPasajeros: pasajeros.length,
            clasificacion: {
              tipo: clasificacion.tipo,
              consistente: clasificacion.consistente,
              advertencias: clasificacion.advertencias
            },
            habitaciones
          };
        });
      }
      if (typeof module !== "undefined" && module.exports) {
        module.exports = {
          processReservations
        };
      }
    }
  });

  // src/normalizer/dateKeys.js
  var require_dateKeys = __commonJS({
    "src/normalizer/dateKeys.js"(exports, module) {
      function parseDateKey(value) {
        if (typeof value !== "string") {
          return null;
        }
        const text = value.trim();
        const dayFirst = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
        const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (!dayFirst && !iso) {
          return null;
        }
        const year = Number(dayFirst ? dayFirst[3] : iso[1]);
        const month = Number(dayFirst ? dayFirst[2] : iso[2]);
        const day = Number(dayFirst ? dayFirst[1] : iso[3]);
        const timestamp = Date.UTC(year, month - 1, day);
        const parsed = new Date(timestamp);
        if (parsed.getUTCFullYear() !== year || parsed.getUTCMonth() !== month - 1 || parsed.getUTCDate() !== day) {
          return null;
        }
        return timestamp;
      }
      if (typeof module !== "undefined" && module.exports) {
        module.exports = {
          parseDateKey
        };
      }
    }
  });

  // src/business/outputSelection.js
  var require_outputSelection = __commonJS({
    "src/business/outputSelection.js"(exports, module) {
      var {
        parseDateKey
      } = require_dateKeys();
      function selectOutputRecords(reservations, selectedDate) {
        if (!Array.isArray(reservations)) {
          throw new TypeError(
            "selectOutputRecords espera un array de reservas."
          );
        }
        const selectedDateKey = parseDateKey(selectedDate);
        if (selectedDateKey === null) {
          return {
            affectedReservations: [],
            roomingPassengers: []
          };
        }
        const affectedReservations = [];
        const roomingPassengers = [];
        for (const reservation of reservations) {
          const passengers = Array.isArray(reservation?.pasajeros) ? reservation.pasajeros : [];
          let reservationIsAffected = false;
          for (const passenger of passengers) {
            if (parseDateKey(passenger?.estadia?.ingreso) !== selectedDateKey) {
              continue;
            }
            reservationIsAffected = true;
            roomingPassengers.push(passenger);
          }
          if (reservationIsAffected) {
            affectedReservations.push(reservation);
          }
        }
        return {
          affectedReservations,
          roomingPassengers
        };
      }
      if (typeof module !== "undefined" && module.exports) {
        module.exports = {
          selectOutputRecords
        };
      }
    }
  });

  // src/output/voucherReport.js
  var require_voucherReport = __commonJS({
    "src/output/voucherReport.js"(exports, module) {
      function parseDatePart(value) {
        if (typeof value !== "string") {
          return null;
        }
        const match = value.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
        if (!match) {
          return null;
        }
        const day = Number.parseInt(match[1], 10);
        const month = Number.parseInt(match[2], 10);
        const year = Number.parseInt(match[3], 10);
        const date = new Date(Date.UTC(year, month - 1, day));
        if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
          return null;
        }
        return date;
      }
      function calculateStayDays(ingreso, egreso) {
        const start = parseDatePart(ingreso);
        const end = parseDatePart(egreso);
        if (!start || !end) {
          return null;
        }
        const millisecondsPerDay = 24 * 60 * 60 * 1e3;
        return Math.round(
          (end.getTime() - start.getTime()) / millisecondsPerDay
        );
      }
      function compareDocuments(passengerA, passengerB) {
        const documentA = Number.parseInt(
          passengerA && passengerA.pax ? passengerA.pax.numeroDocumento : null,
          10
        );
        const documentB = Number.parseInt(
          passengerB && passengerB.pax ? passengerB.pax.numeroDocumento : null,
          10
        );
        return (Number.isNaN(documentA) ? 0 : documentA) - (Number.isNaN(documentB) ? 0 : documentB);
      }
      function getRoom(passenger) {
        const habitacion = passenger && passenger.habitacion;
        const numero = habitacion ? habitacion.numero : null;
        if (!numero) {
          return null;
        }
        return {
          alojamiento: habitacion.alojamiento ?? passenger.alojamiento ?? null,
          numero
        };
      }
      function getStayDays(passengers) {
        const days = passengers.map((passenger) => {
          const estadia = passenger && passenger.estadia;
          return estadia ? calculateStayDays(estadia.ingreso, estadia.egreso) : null;
        }).filter((value) => value !== null);
        return days.length > 0 ? Math.max(...days) : null;
      }
      function buildVoucherReport(reservas, mode) {
        if (!Array.isArray(reservas)) {
          throw new TypeError(
            "buildVoucherReport espera un array de reservas."
          );
        }
        if (mode !== "MAP" && mode !== "PC") {
          throw new Error(
            "buildVoucherReport espera el modo MAP o PC."
          );
        }
        const mealMultiplier = mode === "PC" ? 2 : 1;
        const reportes = reservas.filter((reserva) => reserva && reserva.voucher).map((reserva) => {
          const pasajerosOriginales = Array.isArray(reserva.pasajeros) ? [...reserva.pasajeros] : [];
          const pasajerosPorDocumento = [...pasajerosOriginales].sort(compareDocuments);
          const representative = pasajerosOriginales[0] || {};
          const representativePax = representative.pax || {};
          const metadataRepresentative = pasajerosPorDocumento[0] || {};
          const metadataStay = metadataRepresentative.estadia || {};
          const roomsByIdentity = /* @__PURE__ */ new Map();
          for (const passenger of pasajerosOriginales) {
            const room = getRoom(passenger);
            if (!room) {
              continue;
            }
            const identity = JSON.stringify([
              room.alojamiento,
              String(room.numero)
            ]);
            if (!roomsByIdentity.has(identity)) {
              roomsByIdentity.set(identity, room);
            }
          }
          const rooms = Array.from(roomsByIdentity.values());
          const diasEstadia = getStayDays(pasajerosPorDocumento);
          return {
            voucher: reserva.voucher,
            representante: representativePax.nombre || null,
            dni: representativePax.numeroDocumento ?? "",
            hotel: metadataRepresentative.hotel || null,
            fechaIngreso: metadataStay.ingreso || null,
            fechaEgreso: metadataStay.egreso || null,
            habitaciones: rooms.map((room) => room.numero),
            habitacionesDetalladas: rooms,
            cantidadPasajeros: pasajerosOriginales.length,
            diasEstadia,
            cantidadComidas: diasEstadia === null ? null : pasajerosOriginales.length * diasEstadia * mealMultiplier,
            modo: mode
          };
        });
        reportes.sort((reporteA, reporteB) => {
          const roomA = Number.parseInt(reporteA.habitaciones[0], 10);
          const roomB = Number.parseInt(reporteB.habitaciones[0], 10);
          const minRoomA = Number.isNaN(roomA) ? Infinity : roomA;
          const minRoomB = Number.isNaN(roomB) ? Infinity : roomB;
          return minRoomA - minRoomB;
        });
        return reportes;
      }
      if (typeof module !== "undefined" && module.exports) {
        module.exports = {
          buildVoucherReport,
          calculateStayDays
        };
      }
    }
  });

  // src/output/voucherHtml.js
  var require_voucherHtml = __commonJS({
    "src/output/voucherHtml.js"(exports, module) {
      function escapeHtml(value) {
        return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#39;");
      }
      function getVisualStayDays(voucher) {
        return voucher.diasEstadia === null ? 1 : voucher.diasEstadia;
      }
      function renderMealChecks(voucher) {
        const meals = voucher.modo === "PC" ? ["Almuerzo", "Cena"] : ["Cena"];
        const days = getVisualStayDays(voucher);
        return meals.map((meal) => {
          const checks = Array.from(
            { length: Math.max(0, days) },
            (_, index) => `
                    <div class="day-box">
                        <span class="day-label">D\xEDa ${index + 1}</span>
                        <span class="checkbox"></span>
                    </div>`
          ).join("");
          return `
                <section class="meal-section">
                    <h2 class="meal-title"><strong>${escapeHtml(meal)}</strong></h2>
                    <div class="days-grid">${checks}
                    </div>
                </section>`;
        }).join("");
      }
      function renderVoucher(voucher) {
        const rooms = Array.isArray(voucher.habitaciones) ? voucher.habitaciones.join(", ") : "";
        return `
        <article class="container">
            <div class="logo-container">
                <img src="../assets/suteba_logo_3.jpg" alt="Logo SUTEBA">
            </div>
            <h1 class="h1-container">${voucher.modo === "PC" ? "Voucher de Comidas PPJ" : "Voucher de Comidas"}</h1>
            <p class="p-cena">${voucher.modo === "PC" ? "Favor de brindar servicio de Pensi\xF3n Completa al siguiente afiliado:" : "Favor de brindar servicio de Cena al siguiente afiliado:"}</p>
            <div class="passengerName"><strong>Nombre:</strong> ${escapeHtml(voucher.representante)}</div>
            <div class="dni"><strong>Dni:</strong> ${escapeHtml(voucher.dni)}</div>
            <div class="hotel"><strong>U. Tur\xEDstica:</strong> ${escapeHtml(voucher.hotel)}</div>
            <div class="din"><strong>Ingreso:</strong> ${escapeHtml(voucher.fechaIngreso)}</div>
            <div class="dout"><strong>Egreso:</strong> ${escapeHtml(voucher.fechaEgreso)}</div>
            <div class="roomNumber"><strong>Habitaci\xF3n N\xBA:</strong> <span class="roomNumberContent">${escapeHtml(rooms)}</span></div>
            <div class="cantp"><strong>Cant. Pax:</strong> ${escapeHtml(voucher.cantidadPasajeros)}</div>
            <p class="p-servicios"><strong>Servicios a Tomar</strong></p>
            <div class="cantMap"><strong>Cant. Comidas:</strong> ${escapeHtml(voucher.cantidadComidas)}</div>
            <div class="check-container check-boxes-grid">
                ${renderMealChecks(voucher)}
            </div>
        </article>`;
      }
      function renderVouchersHtml(vouchers) {
        if (!Array.isArray(vouchers)) {
          throw new TypeError(
            "renderVouchersHtml espera un array de vouchers."
          );
        }
        const pages = [];
        for (let index = 0; index < vouchers.length; index += 4) {
          const pageVouchers = vouchers.slice(index, index + 4).map(renderVoucher).join("");
          pages.push(`
            <section class="voucher-page">
                ${pageVouchers}
            </section>`);
        }
        return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Vouchers</title>
    <link rel="stylesheet" href="../src/output/styles.css">
    <style>
        @page { size: A4; margin: 10mm; }
        * { box-sizing: border-box; }
        body { margin: 0; font-family: Arial, sans-serif; }
        .voucher-page {
            display: grid;
            grid-template-columns: 1fr;
            gap: 5mm;
        }
        .container {
            display: grid;
            grid-template-columns: repeat(6, 1fr);
            grid-template-rows: repeat(9, auto);
            gap: 2px;
            border: 1px solid #ccc;
            padding: 5mm;
            min-height: 62mm;
            margin: 5mm;
            background: #f4f4f4;
            font-size: 11px;
            page-break-inside: avoid;
        }
        .logo-container { grid-column: 4 / -1; grid-row: 1; text-align: right; }
        .logo-container img { width: 120px; }
        .h1-container { grid-column: 1 / span 4; grid-row: 1; font: bold 20px "Times New Roman", serif; text-align: center; text-transform: uppercase; }
        .p-cena { grid-column: 1 / span 6; grid-row: 2; margin: 0; }
        .passengerName { grid-column: 1 / span 4; grid-row: 3; font-weight: bold; }
        .dni { grid-column: 5 / -1; grid-row: 3; }
        .hotel { grid-column: 1 / span 6; grid-row: 4; }
        .din { grid-column: 3 / -2; grid-row: 5; }
        .dout { grid-column: 5 / -1; grid-row: 5; }
        .roomNumber { grid-column: 1 / span 2; grid-row: 5; }
        .roomNumberContent { font-size: 14px; font-weight: bold; }
        .cantp { grid-column: 5 / -1; grid-row: 6; }
        .p-servicios { grid-column: 1 / span 3; grid-row: 7; margin: 0; }
        .cantMap { grid-column: 5 / -1; grid-row: 7; }
        .check-container { grid-column: 1 / span 6; grid-row: 8; }
        .check-boxes-grid { display: flex; gap: 20px; padding: 8px 0; flex-wrap: wrap; }
        .meal-section { flex: 1; }
        .meal-title { font-size: 10px; text-align: left; text-decoration: underline; }
        .days-grid { display: flex; gap: 2mm; justify-content: flex-start; }
        .day-box { display: flex; flex-direction: column; align-items: center; font-size: 8px; }
        .checkbox { width: 4mm; height: 4mm; border: 1px solid #333; }
        @media print {
            .voucher-page { break-after: page; }
            .voucher-page:last-child { break-after: auto; }
        }
    </style>
</head>
<body>
${pages.join("")}
</body>
</html>`;
      }
      if (typeof module !== "undefined" && module.exports) {
        module.exports = {
          escapeHtml,
          renderVoucher,
          renderVouchersHtml
        };
      }
    }
  });

  // src/output/voucherHtmlForDate.js
  var require_voucherHtmlForDate = __commonJS({
    "src/output/voucherHtmlForDate.js"(exports, module) {
      var {
        selectOutputRecords
      } = require_outputSelection();
      var {
        parseDateKey
      } = require_dateKeys();
      var {
        buildVoucherReport
      } = require_voucherReport();
      var {
        renderVouchersHtml
      } = require_voucherHtml();
      function normalizeService(value) {
        return String(value ?? "").trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      }
      function getVoucherRegime(reservation) {
        const passengers = Array.isArray(reservation?.pasajeros) ? reservation.pasajeros : [];
        if (passengers.length === 0) {
          return null;
        }
        let voucherRegime = null;
        for (const passenger of passengers) {
          const service = normalizeService(passenger?.servicios);
          const passengerRegime = service.includes("PENSION COMPLETA") ? "PC" : service.includes("MEDIA PENSION") ? "MAP" : service.includes("DESAYUNO") ? "DESAYUNO" : null;
          if (passengerRegime === null) {
            return null;
          }
          if (voucherRegime !== null && voucherRegime !== passengerRegime) {
            return null;
          }
          voucherRegime = passengerRegime;
        }
        return voucherRegime;
      }
      function getStayPeriodStatus(reservation) {
        const passengers = Array.isArray(reservation?.pasajeros) ? reservation.pasajeros : [];
        if (passengers.length === 0) {
          return "MISSING_OR_INVALID_DATES";
        }
        let groupArrival = null;
        let groupDeparture = null;
        for (const passenger of passengers) {
          const arrival = parseDateKey(passenger?.estadia?.ingreso);
          const departure = parseDateKey(passenger?.estadia?.egreso);
          if (arrival === null || departure === null || departure <= arrival) {
            return "MISSING_OR_INVALID_DATES";
          }
          if (groupArrival === null) {
            groupArrival = arrival;
            groupDeparture = departure;
            continue;
          }
          if (arrival !== groupArrival || departure !== groupDeparture) {
            return "DIVERGENT_STAY_PERIODS";
          }
        }
        return null;
      }
      function escapeAttribute(value) {
        return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      }
      function addDocumentBase(html, baseUrl) {
        if (typeof baseUrl !== "string" || baseUrl.trim() === "") {
          throw new TypeError(
            "buildVoucherHtmlForDate espera una URL base valida."
          );
        }
        let parsedBaseUrl;
        try {
          parsedBaseUrl = new URL(baseUrl);
        } catch {
          throw new TypeError(
            "buildVoucherHtmlForDate espera una URL base absoluta."
          );
        }
        if (!["http:", "https:", "file:"].includes(parsedBaseUrl.protocol)) {
          throw new TypeError(
            "buildVoucherHtmlForDate espera una URL base http, https o file."
          );
        }
        return html.replace(
          "<head>",
          `<head>
    <base href="${escapeAttribute(parsedBaseUrl.href)}">`
        );
      }
      function buildVoucherHtmlForDate(reservations, selectedDate, mode, baseUrl) {
        if (mode !== "MAP" && mode !== "PC") {
          throw new Error(
            "buildVoucherHtmlForDate espera el modo MAP o PC."
          );
        }
        const { affectedReservations } = selectOutputRecords(
          reservations,
          selectedDate
        );
        const eligibleReservations = affectedReservations.filter(
          (reservation) => getVoucherRegime(reservation) === mode
        );
        const reviewRequired = [];
        const reportableReservations = [];
        for (const reservation of eligibleReservations) {
          const reason = getStayPeriodStatus(reservation);
          if (reason) {
            reviewRequired.push({
              voucher: reservation.voucher ?? null,
              reason
            });
          } else {
            reportableReservations.push(reservation);
          }
        }
        const reportes = buildVoucherReport(reportableReservations, mode);
        if (reportes.length === 0) {
          return {
            reportes,
            html: null,
            reviewRequired
          };
        }
        return {
          reportes,
          reviewRequired,
          html: addDocumentBase(
            renderVouchersHtml(reportes),
            baseUrl
          )
        };
      }
      if (typeof module !== "undefined" && module.exports) {
        module.exports = {
          buildVoucherHtmlForDate,
          getVoucherRegime,
          getStayPeriodStatus
        };
      }
    }
  });

  // src/browser/groupMealVouchers.js
  var require_groupMealVouchers = __commonJS({
    "src/browser/groupMealVouchers.js"(exports, module) {
      var {
        parseCSV,
        parseCSVLine
      } = require_csvParser();
      var {
        processReservations
      } = require_processReservations();
      var {
        parseDateKey
      } = require_dateKeys();
      var {
        buildVoucherHtmlForDate
      } = require_voucherHtmlForDate();
      module.exports = {
        parseCSV,
        parseCSVLine,
        processReservations,
        parseDateKey,
        buildVoucherHtmlForDate
      };
    }
  });
  return require_groupMealVouchers();
})();
