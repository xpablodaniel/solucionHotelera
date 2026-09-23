# Solucion Hotel Tools v2

Herramientas para transformar registros de reservas hoteleras en un modelo de
datos procesado y reutilizable para rooming, vouchers, comidas y controles
operativos.

El proyecto recibe registros provenientes de un CSV generado por un sistema
externo. No reemplaza ese sistema: interpreta sus datos, conserva la
informacion original y agrega reglas de negocio e inventario fisico del hotel.

## Estado actual

La base funcional implementada incluye:

- parseo de filas CSV de 28 columnas;
- normalizacion basica de textos, numeros y habitaciones;
- agrupacion de pasajeros por voucher;
- clasificacion conservadora entre `INDIVIDUAL`, `CONTINGENTE` y
	`NO_CLASIFICADA`;
- agrupacion de pasajeros por habitacion;
- conservacion de asignaciones `A`, `B`, `C` para contingentes;
- inventario fisico del Hotel 23 de Mayo;
- integracion entre las habitaciones del CSV y el inventario fisico mediante
	`getRoom()`;
- construccion de un rooming logico por habitacion, voucher y pasajero;
- calculo independiente de plazas libres, porcentaje de ocupacion y estado de capacidad;
- catalogo explicito de configuraciones fisicas de camas por tipo de habitacion;
- conexion no destructiva entre Rooming, ocupacion y configuracion de camas;
- agrupacion fisica de habitaciones compartidas por varios vouchers.

Tambien se implementaron las salidas de Rooming MAP y Rooming PC, incluyendo
reportes, CSV, compatibilidad historica, escritura e integracion con fixtures.
La salida de Vouchers MAP/PC ya cuenta con modelo, renderer HTML, writer e
integracion completa con fixtures anonimizados.

Todavia no se implementaron fichas PAX ni el flujo separado de Vouchers
Alicante. El modulo `rooming.js` prepara los datos para las salidas, pero no
asigna habitaciones ni decide camas.

## Flujo de procesamiento

```text
CSV
	|
	v
Parser
	|
	v
Registros normalizados
	|
	+--> groupByVoucher()
	|          |
	|          +--> classifyReservation()
	|          |
	|          +--> groupByRoom()
	|                       |
	|                       +--> getRoom()
	|
	v
Reservas procesadas
```

Salidas
```text
Reservas procesadas
	|
	+--> buildRoomingReport() --> exportRoomingCsv() --> archivo CSV
	|
	+--> buildVoucherReport() --> renderVouchersHtml() --> writeVoucherHtml()
```

El modulo [src/business/rooming.js](src/business/rooming.js) transforma las
reservas procesadas en una lista plana de habitaciones. Cada entrada conserva
el voucher, la clasificacion, el inventario fisico, los pasajeros, la cantidad
de pasajeros y las asignaciones de contingente. La funcion
`calculateRoomOccupancy()` calcula informacion derivada sin modificar esa
entrada. La funcion `groupRoomsForRooming()` ofrece una segunda vista donde
una habitacion fisica puede contener varias reservas, sin fusionar sus
vouchers.

El modulo [src/business/bedConfiguration.js](src/business/bedConfiguration.js)
describe las camas fisicamente previstas para cada codigo de habitacion
(`II`, `X`, `III`, `XI` y `XII`). Todavia no asigna camas a pasajeros ni
interpreta relaciones entre ellos. La funcion `attachBedConfiguration()` agrega
esa configuracion y la ocupacion calculada a una copia del Rooming, sin
redistribuir pasajeros ni asignaciones.

## Estructura del resultado

`processReservations()` devuelve una reserva con esta forma general:

```javascript
{
		voucher,
		pasajeros,
		cantidadPasajeros,
		clasificacion: {
				tipo,
				consistente,
				advertencias
		},
		habitaciones: [
				{
						numero,
						inventario: {
								piso,
								codigoTipo,
								tipo,
								capacidad
						},
						capacidad,
						ocupadasInformadas,
						pasajeros,
						asignaciones
				}
		]
}
```

La capacidad del inventario fisico y los valores de plazas informados por el
CSV se conservan por separado. La capacidad no se utiliza para inventar
pasajeros: la ocupacion real surge de los registros asociados.

## Inventario del hotel

El inventario se encuentra en [src/hotel/rooms.js](src/hotel/rooms.js).

Actualmente contiene 53 habitaciones:

- Piso 1: `101` a `121`;
- Piso 2: `222` a `242`;
- Piso 3: `343` a `353`.

Cada habitacion registra numero, piso, codigo de tipo, descripcion y
capacidad fisica.

## Ejecutar las pruebas

Desde la raiz del proyecto:

```bash
node tests/parser/testParser.js
node tests/business/testReservation.js
node tests/business/testClassification.js
node tests/business/testProcessReservations.js
node tests/business/testRooming.js
node tests/business/testBedConfiguration.js
node tests/hotel/rooms.js

# Suite completa
for test in $(find tests -type f -name '*.js' | sort); do node "$test" || exit 1; done
```

Los tests utilizan Node.js y no requieren dependencias externas.

## Documentacion

- [Especificacion funcional](docs/ESPECIFICACION_FUNCIONAL.md): reglas y
	comportamiento esperado.
- [Modelo de datos CSV](docs/MODELO_DATOS_CSV.MD): columnas y problemas
	conocidos del archivo de origen.
- [Modelo de objetos JavaScript](docs/MODELO_OBJETOS_JS.MD): estructura
	conceptual del modelo interno.
- [paso.txt](paso.txt): registro del avance incremental de la implementacion.
- [tests/business/prueba.txt](tests/business/prueba.txt): proxima evolucion
	operativa del modelo procesado.

Los documentos de `docs/` son especificaciones vivas. Algunas secciones siguen
siendo propuestas y deben confirmarse con nuevos casos reales.

## Principios del proyecto

- conservar los datos originales recibidos;
- no inventar pasajeros ni datos faltantes;
- interpretar los campos en el contexto del conjunto de registros;
- separar datos del CSV, reglas de negocio e inventario fisico;
- advertir ante inconsistencias en lugar de ocultarlas;
- no publicar CSV reales con datos personales.

## Salidas de Vouchers MAP/PC

El flujo de vouchers esta separado en capas:

```text
reservas procesadas
	|
	v
buildVoucherReport(reservas, "MAP" | "PC")
	|
	v
renderVouchersHtml(vouchers)
	|
	v
writeVoucherHtml(html, ruta)
```

`buildVoucherReport()` conserva un voucher por grupo, calcula la cantidad real
de pasajeros a partir de sus filas y combina las habitaciones sin fusionar
vouchers diferentes. El representante de la salida historica se obtiene del
primer pasajero despues de ordenar por DNI. El reporte se ordena por la
habitacion minima del voucher.

Las reglas de comidas son:

- `MAP`: una comida por dia, correspondiente a la cena;
- `PC`: dos comidas por dia, correspondientes a almuerzo y cena.

`renderVouchersHtml()` no vuelve a agrupar ni ordenar. Representa los datos que
recibe, escapa los valores externos y genera una pagina imprimible cada cuatro
vouchers. Si `diasEstadia` es `null`, la duracion visual historica es un dia;
el modelo conserva `null` sin inventar datos.

La escritura se realiza unicamente mediante `writeVoucherHtml()`. Los tests de
integracion usan los fixtures de `tests/fixtures/`, escriben un archivo
temporal y lo eliminan al finalizar.

## Proximos pasos

1. Comparar visualmente el HTML de vouchers con la salida historica.
2. Completar validaciones de inconsistencias entre CSV, PAX e inventario.
3. Definir como se informara una disposicion operativa de camas sin inventar
	relaciones entre pasajeros.
4. Implementar fichas PAX para reservas individuales.
5. Auditar y reconstruir el flujo separado de Vouchers Alicante.

