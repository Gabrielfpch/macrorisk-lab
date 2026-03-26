Attribute VB_Name = "Module1"
' ============================================================
' MODULE1.BAS - Modulo principal de macros
' Sistema de Requerimientos de Mantenimiento
' Clinica Internacional San Francisco de Asis
'
' PONTIFICIA UNIVERSIDAD CATOLICA DEL PERU - INFOPUC
' Excel Avanzado: Macros - Trabajo Grupal 2
'
' INSTRUCCIONES DE IMPORTACION:
'   En Excel: Alt+F11 > Archivo > Importar archivo > seleccionar Module1.bas
' ============================================================

Option Explicit

' ============================================================
' MACRO PRINCIPAL: Abre el formulario de requerimientos
' Asignar esta macro al boton en la hoja "Formulario"
' ============================================================
Public Sub AbrirFormularioRequerimiento()
    ' Verificar que exista la hoja Registro con sus encabezados
    If Not HojaExiste("Registro") Then
        Dim resp As Integer
        resp = MsgBox("La hoja 'Registro' no existe." & Chr(13) & Chr(13) & _
                      "¿Desea crearla ahora con los encabezados correctos?", _
                      vbQuestion + vbYesNo, "Configuracion Inicial")
        If resp = vbYes Then
            Call ConfigurarHojaRegistro
        Else
            MsgBox "No se puede abrir el formulario sin la hoja 'Registro'.", _
                   vbCritical, "Error"
            Exit Sub
        End If
    End If

    ' Mostrar el formulario
    frmRequerimiento.Show
End Sub


' ============================================================
' Verifica si una hoja existe en el libro
' ============================================================
Private Function HojaExiste(nombreHoja As String) As Boolean
    Dim ws As Worksheet
    On Error Resume Next
    Set ws = ThisWorkbook.Sheets(nombreHoja)
    On Error GoTo 0
    HojaExiste = Not (ws Is Nothing)
End Function


' ============================================================
' Configura la hoja "Registro" con encabezados formateados
' Ejecutar UNA SOLA VEZ al inicializar el sistema
' ============================================================
Public Sub ConfigurarHojaRegistro()
    Dim ws As Worksheet

    ' Crear hoja si no existe
    If Not HojaExiste("Registro") Then
        Set ws = ThisWorkbook.Sheets.Add( _
            After:=ThisWorkbook.Sheets(ThisWorkbook.Sheets.Count))
        ws.Name = "Registro"
    Else
        Set ws = ThisWorkbook.Sheets("Registro")
        ' Verificar que la primera fila sea encabezado
        If ws.Cells(1, 1).Value = "N. REQ" Then
            MsgBox "La hoja 'Registro' ya tiene encabezados configurados.", _
                   vbInformation, "Informacion"
            Exit Sub
        End If
    End If

    ' --- Encabezados en el orden exacto requerido por el sistema ---
    Dim encabezados As Variant
    encabezados = Array( _
        "N. REQ", _
        "TIPO DE MANT.", _
        "TIPO DE TRABAJO", _
        "UBICACION", _
        "FECHA", _
        "JUSTIFICACION", _
        "PROVEEDOR", _
        "RUC", _
        "PRODUCTO", _
        "MARCA", _
        "MODELO", _
        "COD. ACT.", _
        "REFERENCIA" _
    )

    ' Aplicar encabezados con formato
    Dim col As Integer
    For col = 0 To UBound(encabezados)
        With ws.Cells(1, col + 1)
            .Value               = encabezados(col)
            .Font.Bold           = True
            .Font.Color          = RGB(255, 255, 255)
            .Interior.Color      = RGB(31, 78, 121)    ' Azul marino institucional
            .HorizontalAlignment = xlCenter
            .VerticalAlignment   = xlCenter
        End With
    Next col

    ' Ajustar alto de la fila de encabezado
    ws.Rows(1).RowHeight = 24

    ' Ajustar anchos de columna (en caracteres aproximados)
    Dim anchos As Variant
    anchos = Array(10, 14, 16, 22, 12, 35, 30, 14, 22, 15, 15, 14, 20)
    For col = 0 To UBound(anchos)
        ws.Columns(col + 1).ColumnWidth = anchos(col)
    Next col

    ' Congelar la primera fila (encabezados siempre visibles)
    ws.Activate
    ws.Rows(2).Select
    ActiveWindow.FreezePanes = True
    ws.Range("A2").Select

    ' Volver a la hoja Formulario
    On Error Resume Next
    ThisWorkbook.Sheets("Formulario").Activate
    On Error GoTo 0

    MsgBox "Hoja 'Registro' configurada correctamente." & Chr(13) & Chr(13) & _
           "Columnas creadas (en orden):" & Chr(13) & _
           "N. REQ | TIPO DE MANT. | TIPO DE TRABAJO | UBICACION | FECHA |" & Chr(13) & _
           "JUSTIFICACION | PROVEEDOR | RUC | PRODUCTO | MARCA | MODELO | COD. ACT. | REFERENCIA", _
           vbInformation, "Configuracion Exitosa"
End Sub


' ============================================================
' Configura la hoja principal "Formulario" con titulo y boton
' Ejecutar UNA SOLA VEZ al inicializar el sistema
' ============================================================
Public Sub ConfigurarHojaFormulario()
    Dim ws As Worksheet

    ' Renombrar la primera hoja como "Formulario"
    On Error Resume Next
    ThisWorkbook.Sheets(1).Name = "Formulario"
    On Error GoTo 0

    Set ws = ThisWorkbook.Sheets("Formulario")

    ' Limpiar contenido previo
    ws.Cells.Clear

    ' Titulo principal
    With ws.Range("A1:F1")
        .Merge
        .Value               = "SISTEMA DE REQUERIMIENTOS DE MANTENIMIENTO"
        .Font.Bold           = True
        .Font.Size           = 16
        .Font.Color          = RGB(255, 255, 255)
        .Interior.Color      = RGB(31, 78, 121)
        .HorizontalAlignment = xlCenter
        .VerticalAlignment   = xlCenter
    End With
    ws.Rows(1).RowHeight = 36

    ' Subtitulo
    With ws.Range("A2:F2")
        .Merge
        .Value               = "Clinica Internacional San Francisco de Asis"
        .Font.Size           = 13
        .Font.Italic         = True
        .Interior.Color      = RGB(189, 215, 238)
        .HorizontalAlignment = xlCenter
        .VerticalAlignment   = xlCenter
    End With
    ws.Rows(2).RowHeight = 24

    ' Instrucciones
    With ws.Range("A4:F4")
        .Merge
        .Value               = "Haga clic en el boton para abrir el formulario de requerimientos"
        .Font.Size           = 11
        .HorizontalAlignment = xlCenter
    End With

    ' Instruccion para crear el boton
    With ws.Range("A6:F12")
        .Merge
        .Value = "INSTRUCCION:" & Chr(13) & Chr(13) & _
                 "1. Vaya a: Insertar > Ilustraciones > Formas > Rectangulo" & Chr(13) & _
                 "2. Dibuje un boton en esta hoja" & Chr(13) & _
                 "3. Escriba el texto: 'Abrir Formulario de Requerimiento'" & Chr(13) & _
                 "4. Clic derecho sobre el boton > 'Asignar macro'" & Chr(13) & _
                 "5. Seleccione la macro: AbrirFormularioRequerimiento"
        .WrapText            = True
        .VerticalAlignment   = xlTop
        .Font.Size           = 10
        .Interior.Color      = RGB(255, 255, 204)
    End With
    ws.Rows(6).RowHeight = 18

    ' Ajustar columnas
    Dim c As Integer
    For c = 1 To 6
        ws.Columns(c).ColumnWidth = 20
    Next c

    ws.Range("A1").Select

    MsgBox "Hoja 'Formulario' configurada." & Chr(13) & Chr(13) & _
           "Siga las instrucciones en la hoja para agregar el boton.", _
           vbInformation, "Listo"
End Sub


' ============================================================
' MACRO DE CONFIGURACION COMPLETA (ejecutar todo de una vez)
' Llama a ConfigurarHojaFormulario y ConfigurarHojaRegistro
' ============================================================
Public Sub ConfiguracionCompleta()
    Call ConfigurarHojaFormulario
    Call ConfigurarHojaRegistro
    MsgBox "Configuracion completa del sistema finalizada." & Chr(13) & Chr(13) & _
           "Recuerde:" & Chr(13) & _
           "1. Agregar el boton en la hoja 'Formulario'" & Chr(13) & _
           "2. Asignarle la macro 'AbrirFormularioRequerimiento'", _
           vbInformation, "Sistema Configurado"
End Sub
