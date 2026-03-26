# Sistema de Requerimientos de Mantenimiento
## PONTIFICIA UNIVERSIDAD CATÓLICA DEL PERÚ - INFOPUC
### Excel Avanzado: Macros — Trabajo Grupal 2

---

## Descripción del proyecto

Sistema automatizado en Excel VBA para registrar y gestionar las solicitudes de
mantenimiento de equipos electromecánicos de la **Clínica Internacional San Francisco de Asís**.

El sistema permite:
- Registrar requerimientos de mantenimiento mediante un formulario visual (UserForm)
- Guardar cada solicitud en una base de datos (hoja "Registro") con número correlativo automático
- Generar e imprimir una ficha formal del requerimiento (hoja "Impresión") en formato A4

---

## Estructura del repositorio

```
/
├── VBA/
│   ├── frmRequerimiento.vba   ← Código completo del UserForm (todos los eventos)
│   └── Module1.bas            ← Módulo con macros auxiliares
├── setup_excel.py             ← Script Python para generar la estructura base .xlsx
└── INSTRUCCIONES.md           ← Este archivo
```

---

## Datos del sistema

### Ubicaciones (áreas de la clínica)
| N° | Área |
|----|------|
| 1 | UCI |
| 2 | UCI-COVID |
| 3 | Emergencia Pediátrica |
| 4 | Emergencia Adultos |
| 5 | Sala de Operaciones |
| 6 | Traumatología |
| 7 | Reumatología |
| 8 | Sala de Máquinas |

### Tipos de trabajo
`Mecánico` · `Eléctrico` · `Electrónico` · `Inspección`

### Productos / Equipos
`Ascensores` · `Bombas de agua` · `Bombas de succión` · `Grupos electrógenos` · `Equipos biomédicos`

### Proveedores (RUC ficticios — uso académico)
| Proveedor | RUC | Área responsable |
|-----------|-----|-----------------|
| Electrobombas Peruanas SA | 20100458560 | Motores y equipos de succión |
| COVIEM SA | 20501234567 | Grupos electrógenos |
| Ascensores Schindler del Perú SA | 20264853390 | Ascensores |
| HeathCare | 20378901234 | Equipos biomédicos |
| Proveedor General | — | General |

---

## Paso 1 — Generar la estructura base del archivo Excel

Requiere Python 3 y la librería `openpyxl`.

```bash
pip install openpyxl
python setup_excel.py
```

Esto genera `Requerimientos_Mantenimiento.xlsx` con las hojas:
- **Formulario** — Página de bienvenida con instrucciones
- **Registro** — Base de datos con encabezados ya formateados
- **Impresión** — Placeholder (se genera automáticamente por VBA)
- **Datos** — Hoja oculta con listas maestras de referencia

---

## Paso 2 — Convertir a libro habilitado para macros

1. Abra `Requerimientos_Mantenimiento.xlsx` en **Microsoft Excel**
2. `Archivo` → `Guardar como`
3. En "Tipo", seleccione: **Libro de Excel habilitado para macros (\*.xlsm)**
4. Guarde con el mismo nombre (cambiará la extensión a `.xlsm`)

---

## Paso 3 — Importar el módulo VBA

1. Abra el **Editor de Visual Basic**: `Alt + F11`
2. En el menú: `Archivo` → `Importar archivo...`
3. Navegue a la carpeta `/VBA/` y seleccione `Module1.bas`
4. Verifique que aparezca `Module1` en el explorador de proyectos

---

## Paso 4 — Crear el UserForm

### 4.1 — Insertar el formulario
1. En el VBE: `Insertar` → `UserForm`
2. En la ventana **Propiedades** (F4), cambie:
   - `(Name)` → `frmRequerimiento`
   - `Caption` → `Ficha de Requerimiento`
   - `Width` → `520`
   - `Height` → `420`

### 4.2 — Agregar controles al formulario

Abra el **Cuadro de herramientas** (`Ver` → `Cuadro de herramientas`) y agregue los
siguientes controles con exactamente los nombres indicados en la columna `(Name)`:

#### Área superior — N° de Requerimiento

| Control | Tipo | Name | Caption / Text | Posición aprox. |
|---------|------|------|----------------|-----------------|
| Etiqueta | Label | — | `Nº Requerimiento:` | Top: 12, Left: 16 |
| Campo texto | TextBox | `txtNReq` | — | Top: 10, Left: 120, Width: 90 |

> **Nota:** `txtNReq` queda bloqueado automáticamente por el código.

#### Frame izquierdo — Detalles del mantenimiento

Inserte un **Frame** con:
- `(Name)` → `fraDetalles`
- `Caption` → `Detalles del mantenimiento`
- Posición: Top: 36, Left: 8, Width: 240, Height: 200

Dentro del Frame, agregue:

| Control | Tipo | Name | Caption / Properties |
|---------|------|------|----------------------|
| Botón opción | OptionButton | `optPreventivo` | `Preventivo` |
| Botón opción | OptionButton | `optCorrectivo` | `Correctivo` |
| Etiqueta | Label | — | `Ubicación:` |
| ComboBox | ComboBox | `cboUbicacion` | Style: 2-fmStyleDropDownList |
| Etiqueta | Label | — | `Tipo de trabajo:` |
| ComboBox | ComboBox | `cboTipoTrabajo` | Style: 2-fmStyleDropDownList |
| Etiqueta | Label | — | `Justificación` |
| Campo texto | TextBox | `txtJustificacion` | MultiLine: True, ScrollBars: 2 |

#### Frame derecho — Sobre el producto

Inserte un **Frame** con:
- `(Name)` → `fraProducto`
- `Caption` → `Sobre el producto`
- Posición: Top: 36, Left: 256, Width: 250, Height: 200

Dentro del Frame, agregue:

| Control | Tipo | Name | Caption / Properties |
|---------|------|------|----------------------|
| Etiqueta | Label | — | `Producto:` |
| ComboBox | ComboBox | `cboProducto` | Style: 2-fmStyleDropDownList |
| Etiqueta | Label | — | `Marca:` |
| Campo texto | TextBox | `txtMarca` | — |
| Etiqueta | Label | — | `Modelo:` |
| Campo texto | TextBox | `txtModelo` | — |
| Etiqueta | Label | — | `Código Activo:` |
| Campo texto | TextBox | `txtCodActivo` | — |
| Etiqueta | Label | — | `Referencia:` |
| Campo texto | TextBox | `txtReferencia` | — |
| Etiqueta | Label | — | `Fecha de Abastecimiento:` |
| Campo texto | TextBox | `txtDia` | Width: 28, MaxLength: 2 |
| Etiqueta | Label | — | `/` |
| Campo texto | TextBox | `txtMes` | Width: 28, MaxLength: 2 |
| Etiqueta | Label | — | `/` |
| Campo texto | TextBox | `txtAnio` | Width: 40, MaxLength: 4 |

#### Frame inferior — Datos del Proveedor

Inserte un **Frame** con:
- `(Name)` → `fraProveedor`
- `Caption` → `Datos del Proveedor:`
- Posición: Top: 244, Left: 8, Width: 498, Height: 60

Dentro del Frame, agregue:

| Control | Tipo | Name | Caption / Properties |
|---------|------|------|----------------------|
| Etiqueta | Label | — | `Nombre del proveedor:` |
| ComboBox | ComboBox | `cboProveedor` | Style: 2-fmStyleDropDownList, Width: 160 |
| Etiqueta | Label | — | `RUC:` |
| Campo texto | TextBox | `txtRUC` | MaxLength: 11 |

#### Botones de acción (fuera de los frames)

| Control | Tipo | Name | Caption | Posición aprox. |
|---------|------|------|---------|-----------------|
| Botón | CommandButton | `btnSolicitar` | `Solicitar` | Top: 360, Left: 80 |
| Botón | CommandButton | `btnImprimir` | `Imprimir Formato` | Top: 360, Left: 200 |
| Botón | CommandButton | `btnCerrar` | `Cerrar` | Top: 360, Left: 360 |

### 4.3 — Pegar el código del UserForm
1. Haga **doble clic** sobre el UserForm (o clic derecho → "Ver código")
2. Seleccione **todo** el contenido del archivo `VBA/frmRequerimiento.vba`
3. Péguelo en el módulo del formulario (reemplazando cualquier contenido previo)

---

## Paso 5 — Configurar las hojas automáticamente

1. En Excel, presione `Alt + F8` para abrir el diálogo de macros
2. Seleccione `ConfiguracionCompleta` y haga clic en **Ejecutar**
3. Esto configura la hoja "Formulario" con título y la hoja "Registro" con encabezados formateados

---

## Paso 6 — Agregar el botón de acceso

1. En la hoja **Formulario**, vaya a `Insertar` → `Ilustraciones` → `Formas`
2. Seleccione un **Rectángulo redondeado** y dibújelo en la hoja
3. Escriba dentro del botón: `Abrir Formulario de Requerimiento`
4. Clic derecho sobre el botón → `Asignar macro`
5. Seleccione `AbrirFormularioRequerimiento` → **Aceptar**

---

## Paso 7 — Guardar y probar

1. Guarde el archivo `.xlsm` (`Ctrl + S`)
2. Haga clic en el botón para abrir el formulario
3. Verifique la lista de pruebas siguiente

---

## Lista de verificación

| Prueba | Resultado esperado |
|--------|--------------------|
| Abrir formulario | El campo "Nº Requerimiento" muestra `MNTO1` y está en gris (bloqueado) |
| Seleccionar proveedor | El campo RUC se auto-completa con el RUC del proveedor |
| Clic "Solicitar" con RUC vacío | Mensaje de error: "Debe seleccionar el Proveedor" |
| Ingresar RUC con 10 dígitos | Al salir del campo: mensaje "RUC no válido" |
| Ingresar fecha `31/02/2024` | Al hacer clic en "Solicitar": mensaje "fecha no existe" |
| Completar todos los campos y clic "Solicitar" | Mensaje de éxito; registro aparece en hoja "Registro" |
| Verificar hoja "Registro" | Datos en el orden: N.REQ · TIPO MANT. · TIPO TRABAJO · UBICACIÓN · FECHA · JUSTIFICACIÓN · PROVEEDOR · RUC · PRODUCTO · MARCA · MODELO · COD.ACT. · REFERENCIA |
| Segundo registro | Nº Requerimiento muestra `MNTO2` automáticamente |
| Clic "Imprimir Formato" | Se crea la hoja "Impresión" con el diseño completo y se muestra la vista previa A4 |
| Clic "Cerrar" | Aparece cuadro de confirmación antes de cerrar |

---

## Estructura de la hoja Registro

Los datos se almacenan en el siguiente orden de columnas (13 columnas):

```
Col A  → N. REQ          (ej. MNTO1, MNTO2, MNTO3...)
Col B  → TIPO DE MANT.   (Preventivo / Correctivo)
Col C  → TIPO DE TRABAJO (Mecánico / Eléctrico / Electrónico / Inspección)
Col D  → UBICACIÓN       (área de la clínica)
Col E  → FECHA           (DD/MM/AAAA)
Col F  → JUSTIFICACIÓN   (texto libre)
Col G  → PROVEEDOR       (nombre completo)
Col H  → RUC             (11 dígitos)
Col I  → PRODUCTO        (equipo a mantener)
Col J  → MARCA
Col K  → MODELO
Col L  → COD. ACT.       (código de activo)
Col M  → REFERENCIA
```

---

## Diseño de la ficha de impresión (hoja "Impresión")

La hoja generada por el botón "Imprimir Formato" replica el modelo indicado en la consigna:

```
┌─────────────────────────────────────────────────┐
│  [LOGO]              │  Fecha: DD/MM/AAAA        │
├─────────────────────────────────────────────────┤
│ N. Requerimiento: MNTO#  │  Ubicación: xxxxxx    │
│ Tipo mantenimiento: xxx  │  Tipo Trabajo: xxxxx  │
│ Justificación:                                  │
│ ┌─────────────────────────────────────────────┐ │
│ │ (texto de justificación)                    │ │
│ └─────────────────────────────────────────────┘ │
│ Nombre del Proveedor: xxxxxx  │  RUC: xxxxxxxxxx │
│ Producto:    │ xxxxxx                            │
│ Marca:       │ xxxxxx                            │
│ Modelo:      │ xxxxxx                            │
│ Cod. Activo: │ xxxxxx                            │
│ Referencia:  │ xxxxxx                            │
│                                                 │
│  ___________________   ___________________      │
│  Firma del Jefe de     Firma del Proveedor      │
│  Mantenimiento                                  │
└─────────────────────────────────────────────────┘
```

---

## Validaciones implementadas

### Campo RUC
- Exactamente **11 dígitos numéricos**
- Debe comenzar con `10` (persona natural) o `20` (empresa / persona jurídica)
- Solo acepta teclas numéricas (validación `KeyPress`)
- Validación al salir del campo (`Exit`) con mensaje descriptivo

### Campo Fecha
- Los tres campos (Día / Mes / Año) solo aceptan dígitos numéricos
- Se verifica con `DateSerial()` que la fecha exista realmente en el calendario
  (por ejemplo, `31/02/2024` es rechazado porque febrero no tiene 31 días)
- Se valida el rango: mes 1-12, día 1-31, año 1900-2100

### Campo Nº Requerimiento
- **Completamente bloqueado** (`Locked = True`)
- Fondo gris para indicar visualmente que no es editable
- Valor generado automáticamente al abrir el formulario

### Campos obligatorios
Antes de guardar, se verifica que no estén vacíos:
Ubicación · Tipo de Trabajo · Producto · Proveedor

---

*Ing. Jayro Guerreros — Profesor del curso*
*San Miguel, 29 de abril del 2021*
