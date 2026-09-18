# Solucion Hotel Tools v2

## Especificación funcional

**Versión:** 0.1
**Estado:** Borrador inicial
**Propósito:** definir el comportamiento funcional de una aplicación web para procesar archivos CSV provenientes de un gestor de reservas y generar herramientas operativas para hoteles.

---

# 1. Objetivo del proyecto

Solucion Hotel Tools es una aplicación web destinada al procesamiento de información de reservas hoteleras.

La aplicación recibe como fuente de datos un archivo CSV generado por un gestor de reservas existente y transforma esa información en diferentes herramientas utilizadas durante la gestión operativa de los hoteles.

El sistema no reemplaza al gestor de reservas original.

Su función es actuar como una **capa de procesamiento, interpretación, normalización y generación de documentación** a partir de los datos recibidos.

El proyecto está pensado como una herramienta doméstica/local, sencilla de utilizar y fácil de mantener, pero con una estructura interna suficientemente clara para tolerar los problemas habituales de los datos de origen.

---

# 2. Contexto de uso

Las reservas son gestionadas originalmente desde diferentes seccionales o sedes.

El personal que carga las reservas puede hacerlo con diferentes niveles de precisión. Por este motivo, los archivos CSV pueden contener:

* datos completos y correctamente cargados;
* campos vacíos;
* diferencias de mayúsculas y minúsculas;
* datos escritos con formatos diferentes;
* nombres con errores;
* comas introducidas dentro del nombre de una persona;
* teléfonos o correos electrónicos omitidos;
* campos de cantidad de plazas y plazas ocupadas intercambiados o utilizados de manera inconsistente;
* información que puede ser ambigua cuando se analiza solamente una fila.

Por lo tanto, la aplicación debe ser **tolerante a errores humanos y a datos imperfectos**.

El objetivo no es simplemente leer el CSV, sino obtener una representación útil y coherente de las reservas sin destruir la información original.

---

# 3. Principio fundamental: el CSV es una fuente imperfecta

El archivo CSV constituye la fuente de datos recibida por la aplicación, pero no debe considerarse necesariamente una fuente perfecta.

Un valor individual puede ser incorrecto o estar incompleto.

Cuando exista una inconsistencia, el sistema debe intentar utilizar el contexto disponible para determinar qué información es razonable.

El contexto puede incluir:

* otras filas del mismo voucher;
* otras personas asociadas a una habitación;
* el tipo de habitación;
* la cantidad de filas relacionadas;
* el paquete o contingente;
* las fechas de ingreso y egreso;
* los servicios;
* otros datos presentes en el conjunto de registros.

Cuando una situación no pueda determinarse de manera razonablemente segura, el sistema debe preferir **advertir sobre la inconsistencia antes que inventar información**.

---

# 4. Conceptos fundamentales

## 4.1 Reserva

Una reserva representa una intención de alojarse en uno de los hoteles de Mar del Plata.

Puede corresponder a:

* una persona sola;
* un matrimonio;
* una pareja;
* dos familiares;
* dos amigos;
* un grupo familiar;
* dos matrimonios alojados en habitaciones diferentes;
* u otra combinación de pasajeros.

Una reserva individual puede contener uno o varios PAX y una o varias habitaciones.

---

## 4.2 Voucher

El voucher es el número que identifica la contratación realizada por el pasajero o grupo de pasajeros.

Se genera cuando el afiliado concurre a su seccional o ciudad para contratar y pagar su estadía para sí mismo y/o sus acompañantes.

El voucher permite relacionar las diferentes filas del CSV que pertenecen a una misma contratación.

Por lo tanto, el voucher es una de las principales claves para reconstruir una reserva a partir de las filas del CSV.

---

## 4.3 PAX

PAX representa la unidad mínima de visitantes/pasajeros alojados.

Cada persona que forma parte de una reserva constituye un PAX.

Un voucher puede contener uno o varios PAX.

La cantidad real de PAX asociados a un voucher debe determinarse a partir de las personas que efectivamente aparecen relacionadas con ese voucher y no únicamente a partir de la capacidad teórica de las habitaciones.

---

## 4.4 Titular / solicitante

En una reserva individual, el titular es el afiliado que solicitó la reserva en la seccional y realizó la contratación/pago de la estadía.

El titular puede no ser la persona de mayor edad del grupo.

Por ejemplo:

```text
PAX 1 → afiliada de 32 años
PAX 2 → pareja de 45 años
PAX 3 → hijo de 10 años
```

El primer PAX puede ser el titular aunque exista otro integrante de mayor edad.

### Regla funcional

Para reservas individuales:

> **El primer PAX que aparece para un voucher en el orden original del CSV se considera titular/solicitante.**

La edad no debe utilizarse para determinar el titular.

Tampoco debe utilizarse:

* el DNI menor;
* el DNI mayor;
* una selección aleatoria;
* el tipo de habitación;
* cualquier otra heurística no definida.

---

## 4.5 Acompañante

Los PAX posteriores al titular dentro del mismo voucher son considerados acompañantes de la reserva.

Ejemplo:

```text
Voucher 12345

PAX 1 → TITULAR
PAX 2 → ACOMPAÑANTE
PAX 3 → ACOMPAÑANTE
```

El acompañante continúa siendo un PAX y sus datos deben conservarse.

---

## 4.6 Habitación

La habitación representa el espacio físico donde se alojan los PAX correspondientes a la reserva.

Una reserva puede utilizar una o varias habitaciones.

Por lo tanto:

> Un voucher no debe considerarse equivalente a una única habitación.

Una misma contratación puede contener varias habitaciones.

---

## 4.7 Tipo de habitación

El tipo de habitación describe la modalidad de alojamiento indicada por el gestor.

Ejemplos:

* DOBLE;
* DOBLE MATRIMONIAL;
* TRIPLE;
* TRIPLE INDIVIDUAL;
* DBL IND;
* otros tipos definidos por el sistema de origen.

El tipo de habitación no determina por sí solo la cantidad de PAX alojados.

---

## 4.8 Capacidad y ocupación

Debe diferenciarse entre:

**Capacidad de la habitación**

y

**Ocupación real de la habitación.**

Una habitación de tipo triple puede alojar hasta tres personas, pero eso no significa que necesariamente esté ocupada por tres PAX.

Ejemplo:

```text
Habitación: 237
Tipo: TRIPLE INDIVIDUAL

Capacidad física: 3
Ocupación real: 1
```

Puede existir una situación en la que una única habitación triple sea la única disponible y se asigne a una persona sola.

Por lo tanto:

> La capacidad de una habitación no debe utilizarse para inventar PAX.

La ocupación real debe determinarse a partir de los PAX efectivamente asociados a la habitación y/o al voucher.

---

## 4.9 Cantidad de plazas y plazas ocupadas

El CSV contiene campos destinados a representar información relacionada con plazas.

Estos campos pueden encontrarse correctamente cargados o pueden presentar inconsistencias debido a errores de carga en las seccionales.

Por ejemplo, una reserva puede contener valores que no coincidan con la cantidad de personas que aparecen realmente en las filas asociadas.

Por este motivo:

> Los campos de plazas deben interpretarse conjuntamente con el resto de la información disponible.

No debe asumirse automáticamente que un valor aislado representa la ocupación real cuando existe evidencia contradictoria en las demás filas.

La aplicación debe conservar los valores originales y, cuando sea necesario, contrastarlos con:

* cantidad de filas;
* voucher;
* habitación;
* tipo de habitación;
* PAX asociados.

El significado exacto de cada campo debe documentarse de acuerdo con el formato real del gestor de reservas.

---

## 4.10 Estadía

La estadía representa la cantidad de noches que el pasajero o grupo permanecerá alojado.

Se determina a partir de:

* fecha de ingreso;
* fecha de egreso.

Ejemplo:

```text
Ingreso: 11/02/2026
Egreso:  20/02/2026

Estadía: 9 noches
```

La cantidad de noches será utilizada posteriormente para determinar determinados servicios o cantidades de comidas.

---

# 5. Reservas individuales

Una reserva individual puede corresponder a:

* una persona;
* una pareja;
* un grupo familiar;
* amigos;
* familiares;
* o cualquier combinación que no constituya un contingente.

Las reservas individuales utilizan:

* Rooming individual;
* Voucher;
* Ficha PAX.

Las fichas PAX se utilizan exclusivamente para pasajeros fuera de contingentes.

---

# 6. Titular y grupo familiar

Una reserva familiar sigue siendo una reserva individual aunque contenga varios PAX.

Ejemplo:

```text
Voucher
│
├── Titular / solicitante
├── Pareja
├── Hijo
└── Hija
```

La existencia de varias personas no convierte automáticamente a la reserva en un contingente.

La clasificación entre reserva individual y contingente debe considerar el contexto de la reserva y especialmente la información correspondiente al paquete.

---

# 7. Contingentes

Existen períodos especiales en los que llegan grupos numerosos a los hoteles.

Entre ellos pueden encontrarse:

* Jubilados;
* Egresados;
* Juegos Bonaerenses;
* otros grupos organizados.

La información del campo **Paquete** constituye uno de los elementos utilizados para identificar el tipo de contingente.

Los contingentes pueden involucrar cantidades importantes de pasajeros y habitaciones.

---

# 8. PPJ — Programa de Jubilados

Los grupos de jubilados constituyen un caso específico de contingente.

Para estos grupos existe una herramienta de Rooming específica.

El tratamiento de un grupo PPJ no debe confundirse con el tratamiento de una reserva individual familiar.

En particular:

* no se deben generar fichas PAX individuales para todos los integrantes del contingente;
* el Rooming debe procesarse mediante la lógica específica del contingente;
* los servicios de alimentación deben procesarse de acuerdo con la modalidad correspondiente.

---

# 9. Fichas PAX

Las fichas de pasajeros constituyen documentación utilizada para el registro de huéspedes.

Para las reservas individuales, la ficha representa al titular/solicitante y su grupo familiar o de acompañantes.

La estructura conceptual es:

```text
FICHA
│
├── Datos personales
│     └── Titular
│
├── Datos acompañantes
│     ├── Acompañante 1
│     ├── Acompañante 2
│     └── ...
│
├── Alojamiento
│     ├── Habitación/es
│     ├── Fecha ingreso
│     └── Fecha egreso
│
└── Servicios
```

La ficha puede contener más de una habitación cuando la reserva así lo requiera.

---

# 10. Fichas PAX y contingentes

Las fichas PAX **no deben generarse para contingentes**.

Los integrantes de los contingentes ya completan la documentación correspondiente en sus respectivas seccionales/sedes.

Generar e imprimir posteriormente 50, 100 o más fichas durante el proceso de check-in sería contraproducente y duplicaría trabajo administrativo.

Por lo tanto:

```text
RESERVA INDIVIDUAL
→ generar ficha

CONTINGENTE
→ no generar fichas individuales
```

---

# 11. Rooming

El Rooming representa la distribución de pasajeros en las habitaciones.

Debe distinguir al menos entre:

* Rooming de reservas individuales;
* Rooming de contingentes/PPJ.

La información debe basarse en la asignación real de PAX a habitaciones.

El tipo de habitación indica la modalidad/capacidad, pero no debe utilizarse por sí solo para determinar cuántas personas están alojadas.

---

# 12. Alimentación

La aplicación contempla diferentes modalidades de servicios.

## MAP

MAP corresponde a **Media Pensión**.

Para este proyecto, la modalidad MAP se utiliza para la cena correspondiente a los afiliados.

Conceptualmente:

```text
MAP
→ CENA
```

---

## PC

PC corresponde a **Pensión Completa**.

Para el procesamiento utilizado en los contingentes:

```text
PC
→ ALMUERZO + CENA
```

La lógica de comidas debe mantenerse separada de la lógica de alojamiento.

---

# 13. Paquete

El campo **Paquete** es una información fundamental para identificar determinadas modalidades de grupos o contingentes.

Ejemplos:

```text
PPJ
MDP FEBRERO 2026
```

El valor exacto y su relación con un contingente deberán determinarse mediante el análisis conjunto de los registros.

No se debe asumir que la presencia de un texto determinado en una única fila es suficiente para clasificar toda la reserva cuando existen otros registros relacionados.

---

# 14. Orden original del CSV

El orden de las filas del CSV puede contener información de negocio.

Particularmente, dentro de una reserva individual:

```text
Fila 1 → Titular
Fila 2 → Acompañante
Fila 3 → Acompañante
...
```

Por lo tanto:

> **El procesamiento no debe alterar arbitrariamente el orden de los PAX asociados a un voucher.**

No debe utilizarse un ordenamiento por DNI, nombre, edad u otro campo para seleccionar al titular.

El sistema debe conservar el orden original del archivo al agrupar los registros.

---

# 15. Normalización de datos

La aplicación podrá normalizar determinados valores para facilitar la generación de documentos.

Ejemplos:

```text
gomez juan carlos
```

puede presentarse como:

```text
GOMEZ JUAN CARLOS
```

La normalización no debe destruir el dato original.

Conceptualmente se debe distinguir entre:

```text
DATO ORIGINAL
```

y:

```text
DATO NORMALIZADO
```

El dato original debe permanecer disponible para poder revisar posteriormente la información recibida.

---

# 16. Datos faltantes

El CSV puede no contener información que sería útil para la documentación.

Por ejemplo:

* teléfono;
* correo electrónico;
* otros datos de contacto.

Cuando un dato no esté presente, la aplicación no debe inventarlo.

En una futura etapa podrá evaluarse la posibilidad de completar determinados datos a partir de información previamente conocida del mismo afiliado, utilizando una identificación confiable como el DNI.

Esta funcionalidad no forma parte de la primera versión del sistema.

---

# 17. CSV con nombres que contienen comas

Los nombres pueden contener accidentalmente caracteres que afecten la separación de columnas del CSV.

Ejemplo conceptual:

```text
APELLIDO, NOMBRE
```

Si el archivo no está correctamente escapado, una coma puede provocar que la información sea interpretada como dos columnas diferentes.

Este problema pertenece a la etapa de análisis y parsing del CSV y deberá ser tratado de manera independiente de la normalización de nombres.

La aplicación debe intentar detectar este tipo de anomalías cuando sea posible.

---

# 18. Datos originales, normalizados e interpretados

El sistema deberá diferenciar conceptualmente tres niveles de información.

## 18.1 Datos originales

Información recibida directamente del CSV.

```text
RAW DATA
```

No debe modificarse.

---

## 18.2 Datos normalizados

Información que fue adaptada a un formato uniforme sin modificar su significado.

Ejemplos:

```text
gomez juan
```

→

```text
GOMEZ JUAN
```

o normalización de formatos de fecha.

---

## 18.3 Datos interpretados

Información obtenida mediante el análisis de varias partes del archivo.

Ejemplo:

```text
Voucher 12345

Fila 1 → Juan
Fila 2 → María
Fila 3 → Pedro
```

Interpretación:

```text
PAX: 3
Titular: Juan
Acompañantes: María, Pedro
```

La interpretación debe poder diferenciarse de los datos originales.

---

# 19. Validación

La aplicación deberá intentar detectar inconsistencias antes de generar documentación.

Ejemplos:

* cantidad de PAX incompatible con los registros;
* información de plazas inconsistente;
* habitación sin PAX;
* PAX sin habitación;
* voucher incompleto;
* datos de fechas faltantes;
* campos que parecen desplazados;
* paquete ambiguo;
* CSV con cantidad incorrecta de columnas.

Las validaciones deberán evolucionar a medida que se incorporen casos reales.

---

# 20. Niveles de resultado

Se propone trabajar conceptualmente con tres estados:

### 🟢 Correcto

Los datos son coherentes y pueden procesarse directamente.

### 🟡 Interpretado

Existe una inconsistencia o ausencia de información, pero el contexto permite obtener un resultado razonable.

### 🔴 Revisar

La información disponible no permite determinar de manera segura el resultado.

En este último caso, el sistema debe evitar inventar información y mostrar una advertencia al usuario.

---

# 21. Herramientas de la aplicación

La aplicación deberá contemplar diferentes herramientas independientes.

## 21.1 Rooming individual

Procesa las reservas que no pertenecen a contingentes.

Debe mostrar la distribución de los PAX en las habitaciones.

---

## 21.2 Rooming PPJ / contingentes

Procesa los grupos organizados.

Debe utilizar reglas específicas para contingentes y no generar fichas individuales.

---

## 21.3 Voucher

Genera la documentación correspondiente a las reservas.

Para reservas individuales:

```text
Primer PAX del voucher
→ Titular
```

Los restantes:

```text
→ Acompañantes
```

---

## 21.4 Ficha PAX

Genera la ficha correspondiente a una reserva individual.

Debe incluir:

* titular;
* acompañantes;
* alojamiento;
* habitaciones;
* fechas;
* servicios.

No debe utilizarse para contingentes.

---

## 21.5 MAP

Procesa las reservas correspondientes a Media Pensión.

Servicio principal considerado:

```text
Cena
```

---

## 21.6 PC

Procesa las reservas correspondientes a Pensión Completa.

Servicios:

```text
Almuerzo
+
Cena
```

---

# 22. Separación entre lógica de negocio y presentación

La aplicación deberá evitar que las reglas de negocio estén mezcladas directamente con HTML.

Se propone separar conceptualmente:

```text
PARSER
   ↓
NORMALIZADOR
   ↓
AGRUPADOR
   ↓
REGLAS DE NEGOCIO
   ↓
VALIDADOR
   ↓
RENDERIZADOR
```

Cada etapa tendrá una responsabilidad específica.

---

# 23. Parser

El parser será responsable de:

* leer el CSV;
* interpretar correctamente sus columnas;
* detectar problemas estructurales;
* conservar el orden original;
* obtener los datos originales.

No deberá tomar decisiones complejas sobre cómo presentar una reserva.

---

# 24. Normalizador

El normalizador será responsable de:

* uniformar nombres;
* normalizar fechas;
* tratar valores vacíos;
* normalizar determinadas representaciones;
* preparar los datos para las etapas posteriores.

No deberá eliminar los datos originales.

---

# 25. Agrupador

El agrupador será responsable de relacionar las filas que pertenecen a:

* un voucher;
* una habitación;
* un paquete;
* un contingente.

El agrupamiento deberá conservar el orden original de los PAX.

---

# 26. Reglas de negocio

La lógica de negocio será responsable de interpretar:

* titular;
* acompañantes;
* PAX;
* habitaciones;
* capacidad;
* ocupación;
* estadía;
* contingentes;
* paquetes;
* servicios;
* modalidades MAP y PC.

Las reglas deberán estar documentadas y no permanecer ocultas dentro de funciones de presentación.

---

# 27. Validación

La validación deberá comprobar la coherencia del modelo obtenido antes de generar los documentos.

Cuando una inconsistencia pueda resolverse mediante información contextual, deberá registrarse como una interpretación.

Cuando no pueda resolverse, deberá marcarse para revisión.

---

# 28. Renderizado

El renderizado será responsable únicamente de presentar los datos ya procesados.

Los generadores de documentos no deberían volver a decidir:

* quién es el titular;
* cuántos PAX tiene un voucher;
* si una reserva es contingente;
* cuántas comidas corresponden.

Esas decisiones deben producirse antes.

---

# 29. Principio de no destrucción de datos

El sistema no debe sobrescribir silenciosamente los datos originales recibidos.

Cuando sea necesario corregir o interpretar un valor:

```text
DATO ORIGINAL
      +
INTERPRETACIÓN
      ↓
DATO UTILIZABLE
```

debe conservarse la posibilidad de conocer qué información fue recibida originalmente.

---

# 30. Casos especiales conocidos

La primera versión deberá contemplar, como mínimo, los siguientes casos:

### Caso 1 — Persona sola

```text
1 voucher
1 PAX
1 habitación
```

---

### Caso 2 — Grupo familiar

```text
1 voucher
1 titular
varios acompañantes
1 o varias habitaciones
```

---

### Caso 3 — Titular menor que un acompañante

```text
PAX 1 → titular, 32 años
PAX 2 → acompañante, 45 años
```

Debe mantenerse como titular el primer PAX.

---

### Caso 4 — Habitación triple ocupada por una persona

```text
Tipo: TRIPLE
Ocupación real: 1 PAX
```

No deben generarse tres pasajeros.

---

### Caso 5 — Campos de plazas inconsistentes

Los valores de cantidad de plazas y plazas ocupadas pueden no coincidir con la información que surge del conjunto de filas.

Debe utilizarse información contextual para intentar interpretar el caso.

---

### Caso 6 — Datos de contacto ausentes

Teléfono y/o correo electrónico pueden faltar.

La aplicación no debe inventar esos datos.

---

### Caso 7 — Diferencias de mayúsculas

```text
gomez juan
GOMEZ JUAN
Gomez Juan
```

Deben poder normalizarse para la presentación.

---

### Caso 8 — Nombre con coma

Debe detectarse la posibilidad de que una coma introducida dentro de un nombre haya desplazado las columnas del CSV.

---

### Caso 9 — Contingente PPJ

Debe utilizar Rooming específico y no generar fichas PAX individuales.

---

### Caso 10 — MAP

Debe procesar la alimentación correspondiente a Media Pensión.

```text
Cena
```

---

### Caso 11 — PC

Debe procesar la alimentación correspondiente a Pensión Completa.

```text
Almuerzo + Cena
```

---

# 31. Casos de prueba

Se deberá construir progresivamente una colección de archivos de prueba que represente situaciones reales.

Ejemplos iniciales:

```text
tests/
└── casos/
    ├── reserva-individual.csv
    ├── grupo-familiar.csv
    ├── titular-menor-que-acompanante.csv
    ├── triple-con-un-pax.csv
    ├── plazas-inconsistentes.csv
    ├── nombre-con-coma.csv
    ├── datos-incompletos.csv
    └── ppj.csv
```

Cada caso deberá documentar:

```text
ENTRADA
↓
INTERPRETACIÓN ESPERADA
↓
RESULTADO ESPERADO
```

Los datos personales reales deberán anonimizarse cuando los archivos sean publicados en un repositorio público.

---

# 32. Privacidad

El repositorio es público.

Por lo tanto:

> **No deben incorporarse al repositorio archivos CSV reales que contengan datos personales de afiliados o pasajeros.**

Los casos de prueba deberán utilizar datos ficticios o anonimizar completamente:

* nombres;
* documentos;
* teléfonos;
* correos electrónicos;
* vouchers;
* cualquier otro dato que permita identificar a una persona.

Los archivos reales podrán utilizarse localmente durante el desarrollo, pero no deberán formar parte del repositorio público.

---

# 33. Evolución futura

Una vez estabilizada la primera versión podrán evaluarse funcionalidades adicionales.

Entre ellas:

* histórico local de afiliados;
* recuperación de teléfono y correo electrónico;
* mayor detección automática de inconsistencias;
* panel de advertencias;
* exportación de datos;
* nuevas herramientas hoteleras;
* configuración de hoteles;
* configuración de servicios;
* soporte para nuevas estructuras de CSV.

Estas funcionalidades no forman parte del núcleo inicial.

---

# 34. Principios generales del proyecto

Solucion Hotel Tools v2 seguirá los siguientes principios:

1. **El código debe adaptarse al funcionamiento real del hotel.**
2. **El CSV es una fuente imperfecta y debe tratarse como tal.**
3. **No se deben inventar datos faltantes.**
4. **Los datos originales deben conservarse.**
5. **El contexto de varias filas puede ser más confiable que un campo aislado.**
6. **El voucher es una clave fundamental para reconstruir una contratación.**
7. **El orden original de los PAX dentro de un voucher tiene significado.**
8. **El primer PAX de una reserva individual es el titular/solicitante.**
9. **La edad no determina al titular.**
10. **La capacidad de una habitación no equivale a su ocupación real.**
11. **Las reservas individuales y los contingentes requieren tratamientos diferentes.**
12. **Las fichas PAX se generan únicamente para reservas individuales.**
13. **MAP y PC son procesos de alimentación diferenciados.**
14. **La lógica de negocio debe estar separada de la presentación.**
15. **Las inconsistencias deben detectarse y, cuando sea posible, explicarse.**
16. **Cuando una situación sea ambigua, el sistema debe solicitar revisión en lugar de inventar una respuesta.**
17. **Los casos reales deben transformarse en casos de prueba para evitar regresiones.**
18. **Los datos personales reales no deben publicarse en el repositorio.**

---

# 35. Estado de esta especificación

Este documento representa la primera versión de la especificación funcional.

No todas las reglas están consideradas definitivas.

Las reglas deberán validarse progresivamente mediante:

* ejemplos reales de CSV;
* documentos generados actualmente;
* funcionamiento operativo del hotel;
* casos especiales;
* pruebas de la nueva aplicación.

Las modificaciones futuras deberán actualizar primero esta especificación cuando impliquen cambios en las reglas de negocio y posteriormente reflejarse en el código.

**Versión actual: 0.1 — borrador funcional inicial.**
