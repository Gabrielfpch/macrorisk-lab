' ============================================================
' FICHA DE REQUERIMIENTO
' Clinica Internacional San Francisco de Asis
' Area de Mantenimiento de Equipos Electromecanicos
'
' PONTIFICIA UNIVERSIDAD CATOLICA DEL PERU - INFOPUC
' Excel Avanzado: Macros - Trabajo Grupal 2
'
' INSTRUCCIONES:
'   1. En Excel, abrir el Editor de Visual Basic (Alt+F11)
'   2. Insertar > UserForm
'   3. Renombrar el UserForm a "frmRequerimiento" (en la ventana Propiedades)
'   4. Agregar los controles segun la tabla en INSTRUCCIONES.md
'      con los nombres exactos indicados
'   5. Copiar TODO este codigo en el modulo del UserForm (doble clic en el form)
' ============================================================

Option Explicit

' ============================================================
' INICIALIZACION DEL FORMULARIO
' ============================================================
Private Sub UserForm_Initialize()

    Dim ws As Worksheet
    Set ws = ThisWorkbook.Sheets("Registro")

    ' --- Auto-generar N de Requerimiento (correlativo MNTO1, MNTO2...) ---
    Dim lastRow As Long
    lastRow = ws.Cells(ws.Rows.Count, 1).End(xlUp).Row
    ' lastRow = 1 significa que solo existe la fila de encabezados
    ' El numero correlativo = lastRow (fila 1=encabezado, fila 2=MNTO1, fila 3=MNTO2...)
    txtNReq.Value = "MNTO" & lastRow

    ' Bloquear el campo N de Requerimiento (no acepta escritura manual)
    txtNReq.Locked = True
    txtNReq.BackColor = RGB(200, 200, 200)   ' Color gris para indicar bloqueado
    txtNReq.ForeColor = RGB(80, 80, 80)

    ' --- Poblar ComboBox de Ubicacion ---
    With cboUbicacion
        .AddItem "UCI"
        .AddItem "UCI-COVID"
        .AddItem "Emergencia Pediatrica"
        .AddItem "Emergencia Adultos"
        .AddItem "Sala de Operaciones"
        .AddItem "Traumatologia"
        .AddItem "Reumatologia"
        .AddItem "Sala de Maquinas"
        .Style = fmStyleDropDownList   ' Solo permite seleccion (no escritura libre)
    End With

    ' --- Poblar ComboBox de Tipo de Trabajo ---
    With cboTipoTrabajo
        .AddItem "Mecanico"
        .AddItem "Electrico"
        .AddItem "Electronico"
        .AddItem "Inspeccion"
        .Style = fmStyleDropDownList
    End With

    ' --- Poblar ComboBox de Producto ---
    With cboProducto
        .AddItem "Ascensores"
        .AddItem "Bombas de agua"
        .AddItem "Bombas de succion"
        .AddItem "Grupos electrogenos"
        .AddItem "Equipos biomedicos"
        .Style = fmStyleDropDownList
    End With

    ' --- Poblar ComboBox de Proveedor ---
    With cboProveedor
        .AddItem "Electrobombas Peruanas SA"
        .AddItem "COVIEM SA"
        .AddItem "Ascensores Schindler del Peru SA"
        .AddItem "HeathCare"
        .AddItem "Proveedor General"
        .Style = fmStyleDropDownList
    End With

    ' --- Valores por defecto ---
    optPreventivo.Value = True         ' Preventivo seleccionado por defecto

    ' Inicializar campos de fecha con la fecha actual
    txtDia.Value = Format(Day(Now), "00")
    txtMes.Value = Format(Month(Now), "00")
    txtAnio.Value = CStr(Year(Now))

End Sub


' ============================================================
' AUTO-COMPLETAR RUC AL SELECCIONAR PROVEEDOR
' (RUC ficticios para uso academico)
' ============================================================
Private Sub cboProveedor_Change()
    Select Case cboProveedor.Value
        Case "Electrobombas Peruanas SA"
            txtRUC.Value = "20100458560"
        Case "COVIEM SA"
            txtRUC.Value = "20501234567"
        Case "Ascensores Schindler del Peru SA"
            txtRUC.Value = "20264853390"
        Case "HeathCare"
            txtRUC.Value = "20378901234"
        Case "Proveedor General"
            txtRUC.Value = ""
    End Select
End Sub


' ============================================================
' FUNCIONES DE VALIDACION
' ============================================================

' --- Valida RUC peruano: 11 digitos numericos, inicia en "10" o "20" ---
Private Function ValidarRUC(ruc As String) As Boolean
    Dim rucLimpio As String
    rucLimpio = Trim(ruc)

    ' Verificar longitud exacta de 11 caracteres
    If Len(rucLimpio) <> 11 Then
        ValidarRUC = False
        Exit Function
    End If

    ' Verificar que sean solo digitos numericos
    If Not IsNumeric(rucLimpio) Then
        ValidarRUC = False
        Exit Function
    End If

    ' Verificar que empiece con "10" (persona natural) o "20" (empresa/persona juridica)
    Dim prefijo As String
    prefijo = Left(rucLimpio, 2)
    If prefijo <> "10" And prefijo <> "20" Then
        ValidarRUC = False
        Exit Function
    End If

    ValidarRUC = True
End Function


' --- Valida que la fecha sea real (dia valido para el mes y anio dados) ---
Private Function ValidarFecha(dia As String, mes As String, anio As String) As Boolean
    On Error GoTo ErrorFecha

    ' Verificar que los tres campos sean numericos
    If Not IsNumeric(dia) Or Not IsNumeric(mes) Or Not IsNumeric(anio) Then
        ValidarFecha = False
        Exit Function
    End If

    Dim d As Integer, m As Integer, a As Integer
    d = CInt(dia)
    m = CInt(mes)
    a = CInt(anio)

    ' Rangos basicos
    If m < 1 Or m > 12 Then
        ValidarFecha = False
        Exit Function
    End If
    If d < 1 Or d > 31 Then
        ValidarFecha = False
        Exit Function
    End If
    If a < 1900 Or a > 2100 Then
        ValidarFecha = False
        Exit Function
    End If

    ' Comprobacion exacta: DateSerial ajusta fechas invalidas (ej. 31/02 -> 03/03)
    ' Si el resultado difiere del input, la fecha no existe en el calendario
    Dim fechaTest As Date
    fechaTest = DateSerial(a, m, d)

    If Day(fechaTest) <> d Or Month(fechaTest) <> m Or Year(fechaTest) <> a Then
        ValidarFecha = False
        Exit Function
    End If

    ValidarFecha = True
    Exit Function

ErrorFecha:
    ValidarFecha = False
End Function


' ============================================================
' BOTON SOLICITAR - Guardar requerimiento en hoja Registro
' ============================================================
Private Sub btnSolicitar_Click()

    ' ---- BLOQUE DE VALIDACIONES ----

    ' 1) Tipo de mantenimiento seleccionado
    If Not optPreventivo.Value And Not optCorrectivo.Value Then
        MsgBox "Debe seleccionar el Tipo de Mantenimiento" & Chr(13) & _
               "(Preventivo o Correctivo).", _
               vbCritical + vbOKOnly, "Error de Validacion"
        Exit Sub
    End If

    ' 2) Ubicacion
    If Trim(cboUbicacion.Value) = "" Then
        MsgBox "Debe seleccionar una Ubicacion.", _
               vbCritical + vbOKOnly, "Error de Validacion"
        cboUbicacion.SetFocus
        Exit Sub
    End If

    ' 3) Tipo de Trabajo
    If Trim(cboTipoTrabajo.Value) = "" Then
        MsgBox "Debe seleccionar el Tipo de Trabajo.", _
               vbCritical + vbOKOnly, "Error de Validacion"
        cboTipoTrabajo.SetFocus
        Exit Sub
    End If

    ' 4) Producto
    If Trim(cboProducto.Value) = "" Then
        MsgBox "Debe seleccionar el Producto (equipo a mantener).", _
               vbCritical + vbOKOnly, "Error de Validacion"
        cboProducto.SetFocus
        Exit Sub
    End If

    ' 5) Proveedor
    If Trim(cboProveedor.Value) = "" Then
        MsgBox "Debe seleccionar el Proveedor.", _
               vbCritical + vbOKOnly, "Error de Validacion"
        cboProveedor.SetFocus
        Exit Sub
    End If

    ' 6) RUC
    If Not ValidarRUC(txtRUC.Value) Then
        MsgBox "El RUC ingresado no es valido." & Chr(13) & Chr(13) & _
               "El RUC peruano debe:" & Chr(13) & _
               "  - Tener exactamente 11 digitos numericos" & Chr(13) & _
               "  - Comenzar con '10' (persona natural)" & Chr(13) & _
               "  - O comenzar con '20' (empresa / persona juridica)", _
               vbCritical + vbOKOnly, "Error de Validacion - RUC"
        txtRUC.SetFocus
        Exit Sub
    End If

    ' 7) Fecha
    If Trim(txtDia.Value) = "" Or Trim(txtMes.Value) = "" Or Trim(txtAnio.Value) = "" Then
        MsgBox "Debe completar los tres campos de la Fecha (Dia / Mes / Anio).", _
               vbCritical + vbOKOnly, "Error de Validacion - Fecha"
        txtDia.SetFocus
        Exit Sub
    End If

    If Not ValidarFecha(txtDia.Value, txtMes.Value, txtAnio.Value) Then
        MsgBox "La fecha ingresada no existe en el calendario." & Chr(13) & Chr(13) & _
               "Por favor verifique que el dia sea valido" & Chr(13) & _
               "para el mes y anio indicados.", _
               vbCritical + vbOKOnly, "Error de Validacion - Fecha"
        txtDia.SetFocus
        Exit Sub
    End If

    ' ---- GUARDAR EN HOJA REGISTRO ----
    Dim ws As Worksheet
    Set ws = ThisWorkbook.Sheets("Registro")

    ' Siguiente fila disponible (debajo del ultimo registro)
    Dim nextRow As Long
    nextRow = ws.Cells(ws.Rows.Count, 1).End(xlUp).Row + 1

    ' Determinar tipo de mantenimiento en texto
    Dim tipoMant As String
    If optPreventivo.Value Then
        tipoMant = "Preventivo"
    Else
        tipoMant = "Correctivo"
    End If

    ' Fecha con formato DD/MM/AAAA
    Dim fechaStr As String
    fechaStr = Format(CInt(txtDia.Value), "00") & "/" & _
               Format(CInt(txtMes.Value), "00") & "/" & _
               txtAnio.Value

    ' Grabacion en el orden exacto requerido:
    ' N. REQ | TIPO DE MANT. | TIPO DE TRABAJO | UBICACION | FECHA |
    ' JUSTIFICACION | PROVEEDOR | RUC | PRODUCTO | MARCA | MODELO | COD. ACT. | REFERENCIA
    With ws
        .Cells(nextRow, 1).Value  = txtNReq.Value          ' N. REQ
        .Cells(nextRow, 2).Value  = tipoMant               ' TIPO DE MANT.
        .Cells(nextRow, 3).Value  = cboTipoTrabajo.Value   ' TIPO DE TRABAJO
        .Cells(nextRow, 4).Value  = cboUbicacion.Value     ' UBICACION
        .Cells(nextRow, 5).Value  = fechaStr               ' FECHA
        .Cells(nextRow, 6).Value  = txtJustificacion.Value ' JUSTIFICACION
        .Cells(nextRow, 7).Value  = cboProveedor.Value     ' PROVEEDOR
        .Cells(nextRow, 8).Value  = txtRUC.Value           ' RUC
        .Cells(nextRow, 9).Value  = cboProducto.Value      ' PRODUCTO
        .Cells(nextRow, 10).Value = txtMarca.Value         ' MARCA
        .Cells(nextRow, 11).Value = txtModelo.Value        ' MODELO
        .Cells(nextRow, 12).Value = txtCodActivo.Value     ' COD. ACT.
        .Cells(nextRow, 13).Value = txtReferencia.Value    ' REFERENCIA
    End With

    ' Confirmar al usuario
    MsgBox "Requerimiento " & txtNReq.Value & " registrado exitosamente." & Chr(13) & Chr(13) & _
           "Tipo: " & tipoMant & " | Ubicacion: " & cboUbicacion.Value, _
           vbInformation + vbOKOnly, "Registro Exitoso"

    ' Actualizar N de Requerimiento al siguiente numero correlativo
    txtNReq.Value = "MNTO" & nextRow   ' nextRow es ahora la ultima fila con datos

    ' Limpiar todos los campos para nuevo ingreso
    Call LimpiarFormulario

End Sub


' ============================================================
' SUBRUTINA: Limpiar campos del formulario tras registrar
' ============================================================
Private Sub LimpiarFormulario()
    cboUbicacion.Value   = ""
    cboTipoTrabajo.Value = ""
    cboProducto.Value    = ""
    cboProveedor.Value   = ""
    txtMarca.Value       = ""
    txtModelo.Value      = ""
    txtCodActivo.Value   = ""
    txtReferencia.Value  = ""
    txtRUC.Value         = ""
    txtJustificacion.Value = ""
    optPreventivo.Value  = True          ' Volver a Preventivo por defecto

    ' Restaurar fecha con la fecha actual
    txtDia.Value  = Format(Day(Now), "00")
    txtMes.Value  = Format(Month(Now), "00")
    txtAnio.Value = CStr(Year(Now))
End Sub


' ============================================================
' BOTON IMPRIMIR FORMATO - Genera hoja de impresion y la imprime
' ============================================================
Private Sub btnImprimir_Click()

    ' Verificar que haya datos cargados
    If Trim(txtNReq.Value) = "" Then
        MsgBox "No hay datos para imprimir.", vbWarning, "Sin Datos"
        Exit Sub
    End If

    ' Verificar que la fecha sea valida antes de imprimir
    If Not ValidarFecha(txtDia.Value, txtMes.Value, txtAnio.Value) Then
        MsgBox "La fecha no es valida. Por favor corrija antes de imprimir.", _
               vbWarning, "Fecha Invalida"
        txtDia.SetFocus
        Exit Sub
    End If

    ' --- Eliminar hoja Impresion previa (si existe) ---
    Application.DisplayAlerts = False
    On Error Resume Next
    ThisWorkbook.Sheets("Impresion").Delete
    On Error GoTo 0
    Application.DisplayAlerts = True

    ' --- Crear nueva hoja "Impresion" al final del libro ---
    Dim wsImp As Worksheet
    Set wsImp = ThisWorkbook.Sheets.Add( _
        After:=ThisWorkbook.Sheets(ThisWorkbook.Sheets.Count))
    wsImp.Name = "Impresion"

    ' --- Configurar pagina A4 vertical ---
    With wsImp.PageSetup
        .PaperSize          = xlPaperA4
        .Orientation        = xlPortrait
        .LeftMargin         = Application.CentimetersToPoints(2.5)
        .RightMargin        = Application.CentimetersToPoints(2.5)
        .TopMargin          = Application.CentimetersToPoints(2.5)
        .BottomMargin       = Application.CentimetersToPoints(2.5)
        .CenterHorizontally = True
        .FitToPagesWide     = 1
        .FitToPagesTall     = 1
    End With

    ' --- Preparar variables de datos ---
    Dim tipoMant As String
    If optPreventivo.Value Then
        tipoMant = "Preventivo"
    Else
        tipoMant = "Correctivo"
    End If

    Dim fechaStr As String
    fechaStr = Format(CInt(txtDia.Value), "00") & "/" & _
               Format(CInt(txtMes.Value), "00") & "/" & txtAnio.Value

    ' --- Configurar anchos de columnas ---
    wsImp.Columns("A").ColumnWidth = 20
    wsImp.Columns("B").ColumnWidth = 22
    wsImp.Columns("C").ColumnWidth = 4
    wsImp.Columns("D").ColumnWidth = 15
    wsImp.Columns("E").ColumnWidth = 20

    ' --- Configurar altos de filas ---
    Dim i As Integer
    For i = 1 To 30
        wsImp.Rows(i).RowHeight = 20
    Next i

    ' Colores
    Dim colorFondo As Long
    Dim colorBorde As Long
    colorFondo = RGB(240, 240, 228)   ' Beige claro (como en el modelo)
    colorBorde = RGB(0, 0, 0)

    ' Aplicar color de fondo a toda el area del documento
    wsImp.Range("A1:E26").Interior.Color = colorFondo

    ' ==========================================================
    ' ENCABEZADO: Logo (placeholder) | Fecha
    ' ==========================================================
    wsImp.Rows(1).RowHeight = 40
    wsImp.Rows(2).RowHeight = 40

    ' Celda de logo (A1:B2 combinadas)
    With wsImp.Range("A1:B2")
        .Merge
        .Value              = "[LOGO CLINICA]"
        .HorizontalAlignment = xlCenter
        .VerticalAlignment  = xlCenter
        .Font.Size          = 9
        .Font.Italic        = True
        .Font.Color         = RGB(100, 100, 100)
        .Interior.Color     = RGB(180, 200, 220)
        .Borders.LineStyle  = xlContinuous
        .Borders.Weight     = xlMedium
    End With

    ' Etiqueta "Fecha:" (D1)
    With wsImp.Cells(1, 4)
        .Value     = "Fecha:"
        .Font.Bold = True
        .VerticalAlignment = xlCenter
    End With

    ' Valor de la fecha (E1:E2 combinadas)
    With wsImp.Range("E1:E2")
        .Merge
        .Value              = fechaStr
        .HorizontalAlignment = xlCenter
        .VerticalAlignment  = xlCenter
        .Font.Size          = 11
        .Borders.LineStyle  = xlContinuous
        .Borders.Weight     = xlMedium
    End With

    ' Fila separadora (fila 3)
    wsImp.Rows(3).RowHeight = 6

    ' ==========================================================
    ' FILA 4: N. Requerimiento | Ubicacion
    ' ==========================================================
    With wsImp.Cells(4, 1)
        .Value     = "N. Requerimiento"
        .Font.Bold = True
        .VerticalAlignment = xlCenter
    End With
    With wsImp.Cells(4, 2)
        .Value              = txtNReq.Value
        .HorizontalAlignment = xlCenter
        .VerticalAlignment  = xlCenter
        .Font.Bold          = True
        .Borders.LineStyle  = xlContinuous
        .Borders.Weight     = xlMedium
    End With
    With wsImp.Cells(4, 4)
        .Value     = "Ubicacion:"
        .Font.Bold = True
        .VerticalAlignment = xlCenter
    End With
    With wsImp.Cells(4, 5)
        .Value              = cboUbicacion.Value
        .HorizontalAlignment = xlCenter
        .VerticalAlignment  = xlCenter
        .Borders.LineStyle  = xlContinuous
        .Borders.Weight     = xlMedium
    End With

    ' ==========================================================
    ' FILA 5: Tipo de mantenimiento | Tipo de Trabajo
    ' ==========================================================
    With wsImp.Cells(5, 1)
        .Value     = "Tipo de mantenimiento:"
        .Font.Bold = True
        .VerticalAlignment = xlCenter
    End With
    With wsImp.Cells(5, 2)
        .Value              = tipoMant
        .HorizontalAlignment = xlCenter
        .VerticalAlignment  = xlCenter
        .Borders.LineStyle  = xlContinuous
        .Borders.Weight     = xlMedium
    End With
    With wsImp.Cells(5, 4)
        .Value     = "Tipo de Trabajo:"
        .Font.Bold = True
        .VerticalAlignment = xlCenter
    End With
    With wsImp.Cells(5, 5)
        .Value              = cboTipoTrabajo.Value
        .HorizontalAlignment = xlCenter
        .VerticalAlignment  = xlCenter
        .Borders.LineStyle  = xlContinuous
        .Borders.Weight     = xlMedium
    End With

    ' ==========================================================
    ' FILA 6-8: Justificacion (area grande)
    ' ==========================================================
    With wsImp.Cells(6, 1)
        .Value     = "Justificacion:"
        .Font.Bold = True
        .VerticalAlignment = xlCenter
    End With

    wsImp.Rows(7).RowHeight = 55
    With wsImp.Range("A7:E7")
        .Merge
        .Value              = txtJustificacion.Value
        .VerticalAlignment  = xlTop
        .WrapText           = True
        .IndentLevel        = 1
        .Borders.LineStyle  = xlContinuous
        .Borders.Weight     = xlMedium
    End With

    ' Fila separadora (fila 8)
    wsImp.Rows(8).RowHeight = 6

    ' ==========================================================
    ' FILA 9: Nombre del Proveedor | RUC
    ' ==========================================================
    With wsImp.Cells(9, 1)
        .Value     = "Nombre del Proveedor:"
        .Font.Bold = True
        .VerticalAlignment = xlCenter
    End With
    With wsImp.Cells(9, 2)
        .Value              = cboProveedor.Value
        .HorizontalAlignment = xlCenter
        .VerticalAlignment  = xlCenter
        .Borders.LineStyle  = xlContinuous
        .Borders.Weight     = xlMedium
    End With
    With wsImp.Cells(9, 4)
        .Value     = "RUC:"
        .Font.Bold = True
        .VerticalAlignment = xlCenter
    End With
    With wsImp.Cells(9, 5)
        .Value              = txtRUC.Value
        .HorizontalAlignment = xlCenter
        .VerticalAlignment  = xlCenter
        .Borders.LineStyle  = xlContinuous
        .Borders.Weight     = xlMedium
    End With

    ' Fila separadora (fila 10)
    wsImp.Rows(10).RowHeight = 6

    ' ==========================================================
    ' FILAS 11-15: Datos del producto
    ' ==========================================================
    Dim datosProd(0 To 4, 0 To 1) As String
    datosProd(0, 0) = "Producto:"    : datosProd(0, 1) = cboProducto.Value
    datosProd(1, 0) = "Marca:"       : datosProd(1, 1) = txtMarca.Value
    datosProd(2, 0) = "Modelo:"      : datosProd(2, 1) = txtModelo.Value
    datosProd(3, 0) = "Cod. Activo:" : datosProd(3, 1) = txtCodActivo.Value
    datosProd(4, 0) = "Referencia:"  : datosProd(4, 1) = txtReferencia.Value

    Dim fila As Integer
    For fila = 0 To 4
        With wsImp.Cells(11 + fila, 1)
            .Value     = datosProd(fila, 0)
            .Font.Bold = True
            .VerticalAlignment = xlCenter
        End With
        With wsImp.Cells(11 + fila, 2)
            .Value             = datosProd(fila, 1)
            .VerticalAlignment = xlCenter
            .Borders.LineStyle = xlContinuous
            .Borders.Weight    = xlMedium
        End With
    Next fila

    ' ==========================================================
    ' FILAS 20-22: Area de firmas
    ' ==========================================================
    wsImp.Rows(18).RowHeight = 6
    wsImp.Rows(19).RowHeight = 30  ' Espacio para firma fisica

    ' Lineas de firma
    With wsImp.Range("A20:B20")
        .Merge
        .Value              = "___________________________"
        .HorizontalAlignment = xlCenter
        .VerticalAlignment  = xlCenter
    End With
    With wsImp.Range("D20:E20")
        .Merge
        .Value              = "___________________________"
        .HorizontalAlignment = xlCenter
        .VerticalAlignment  = xlCenter
    End With

    ' Etiquetas de firma
    wsImp.Rows(21).RowHeight = 28
    With wsImp.Range("A21:B21")
        .Merge
        .Value              = "Firma del Jefe de Mantenimiento"
        .HorizontalAlignment = xlCenter
        .VerticalAlignment  = xlCenter
        .Font.Bold          = True
        .Font.Size          = 9
    End With
    With wsImp.Range("D21:E21")
        .Merge
        .Value              = "Firma del Proveedor"
        .HorizontalAlignment = xlCenter
        .VerticalAlignment  = xlCenter
        .Font.Bold          = True
        .Font.Size          = 9
    End With

    ' ==========================================================
    ' BORDE EXTERIOR del documento completo
    ' ==========================================================
    With wsImp.Range("A1:E21").Borders(xlEdgeLeft)
        .LineStyle = xlContinuous : .Weight = xlMedium
    End With
    With wsImp.Range("A1:E21").Borders(xlEdgeRight)
        .LineStyle = xlContinuous : .Weight = xlMedium
    End With
    With wsImp.Range("A1:E21").Borders(xlEdgeTop)
        .LineStyle = xlContinuous : .Weight = xlMedium
    End With
    With wsImp.Range("A1:E21").Borders(xlEdgeBottom)
        .LineStyle = xlContinuous : .Weight = xlMedium
    End With

    ' ==========================================================
    ' MOSTRAR VISTA PREVIA y luego imprimir en A4
    ' ==========================================================
    wsImp.PrintPreview
    ' Nota: Si desea imprimir directamente sin vista previa, comente
    ' la linea anterior y descomente la siguiente:
    ' wsImp.PrintOut Copies:=1

    MsgBox "La ficha de requerimiento ha sido generada en la hoja 'Impresion'." & Chr(13) & _
           "Se ha mostrado la vista previa de impresion.", _
           vbInformation, "Impresion Lista"

End Sub


' ============================================================
' BOTON CERRAR
' ============================================================
Private Sub btnCerrar_Click()
    Dim respuesta As Integer
    respuesta = MsgBox("¿Desea cerrar el formulario de Requerimiento?" & Chr(13) & Chr(13) & _
                       "Los datos no guardados se perderan.", _
                       vbQuestion + vbYesNo, "Confirmar Cierre")
    If respuesta = vbYes Then
        Unload Me
    End If
End Sub


' ============================================================
' VALIDACION EN TIEMPO REAL - RUC (al salir del campo)
' ============================================================
Private Sub txtRUC_Exit(ByVal Cancel As MSForms.ReturnBoolean)
    If Trim(txtRUC.Value) <> "" Then
        If Not ValidarRUC(txtRUC.Value) Then
            MsgBox "El RUC '" & txtRUC.Value & "' no es valido." & Chr(13) & Chr(13) & _
                   "Debe tener 11 digitos y comenzar con '10' o '20'.", _
                   vbWarning, "RUC Invalido"
            Cancel = True   ' Mantiene el foco en el campo hasta que se corrija
        End If
    End If
End Sub


' ============================================================
' VALIDACION DE ENTRADA - Solo acepta digitos en campos numericos
' ============================================================
Private Sub txtRUC_KeyPress(ByVal KeyAscii As MSForms.ReturnInteger)
    ' ASCII 48-57 = digitos '0'-'9' | ASCII 8 = Backspace
    If (KeyAscii < 48 Or KeyAscii > 57) And KeyAscii <> 8 Then
        KeyAscii = 0   ' Cancelar la tecla presionada
    End If
End Sub

Private Sub txtDia_KeyPress(ByVal KeyAscii As MSForms.ReturnInteger)
    If (KeyAscii < 48 Or KeyAscii > 57) And KeyAscii <> 8 Then
        KeyAscii = 0
    End If
End Sub

Private Sub txtMes_KeyPress(ByVal KeyAscii As MSForms.ReturnInteger)
    If (KeyAscii < 48 Or KeyAscii > 57) And KeyAscii <> 8 Then
        KeyAscii = 0
    End If
End Sub

Private Sub txtAnio_KeyPress(ByVal KeyAscii As MSForms.ReturnInteger)
    If (KeyAscii < 48 Or KeyAscii > 57) And KeyAscii <> 8 Then
        KeyAscii = 0
    End If
End Sub
