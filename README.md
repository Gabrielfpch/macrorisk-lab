# Maintenance Request Management System

> Excel and VBA automation project for registering, validating, storing, and printing maintenance requests.

## Overview

This project implements a maintenance request management workflow in Microsoft Excel. A VBA UserForm captures request data, validates it, stores it in a structured worksheet, assigns a sequential request number, and generates an A4 printable form.

The workbook structure is generated with Python and `openpyxl`, while the operational workflow is handled with VBA.

## Key features

- Guided request entry through an Excel UserForm
- Automatic request numbering (`MNTO1`, `MNTO2`, ...)
- Structured storage across 13 standardized fields
- Validation of required fields, dates, and Peruvian RUC format
- Automatic provider and equipment reference data
- A4 print-ready maintenance request form
- Reusable Python setup script for the base workbook
- Modular VBA code for easier maintenance

## Tech stack

| Technology | Purpose |
|---|---|
| Microsoft Excel | User interface and data storage |
| VBA | Form logic, validation, registration, and printing |
| Python 3 | Reproducible workbook generation |
| openpyxl | Workbook structure, styles, and reference sheets |

## Repository structure

```text
.
├── VBA/
│   ├── frmRequerimiento.vba   # UserForm events and validation
│   └── Module1.bas            # Workbook setup and helper macros
├── setup_excel.py             # Generates the base .xlsx workbook
├── requirements.txt           # Python dependency
└── INSTRUCCIONES.md           # Detailed setup guide in Spanish
```

## Quick start

### 1. Create the base workbook

```bash
python -m venv .venv
```

Activate the environment:

```bash
# Windows
.venv\Scripts\activate

# macOS/Linux
source .venv/bin/activate
```

Install the dependency and generate the workbook:

```bash
pip install -r requirements.txt
python setup_excel.py
```

This creates `Requerimientos_Mantenimiento.xlsx`.

### 2. Enable the VBA workflow

1. Open the generated workbook in Microsoft Excel.
2. Save it as an Excel Macro-Enabled Workbook (`.xlsm`).
3. Open the Visual Basic Editor with `Alt + F11`.
4. Import `VBA/Module1.bas`.
5. Create the UserForm and add the controls listed in `INSTRUCCIONES.md`.
6. Paste the contents of `VBA/frmRequerimiento.vba` into the form module.
7. Run `ConfiguracionCompleta` and test the workflow.

For the complete configuration and validation checklist, see [INSTRUCCIONES.md](INSTRUCCIONES.md).

## Data validation

The system checks:

- Required selections for location, work type, product, and provider
- RUC values with exactly 11 digits and a valid `10` or `20` prefix
- Real calendar dates and valid day, month, and year ranges
- Numeric-only input in date and RUC fields
- Automatic and non-editable request identifiers

## Skills demonstrated

- Advanced Excel automation
- VBA UserForms and event-driven programming
- Input validation and error handling
- Structured data registration
- Python-based workbook generation
- Technical documentation and reproducible setup

## Project context

Academic automation project developed for an Advanced Excel and Macros course at PUCP–INFOPUC. The provider records included in the project are sample data for educational use.

## Author

**Gabriel Pérez Chávez**  
Economics student at Pontificia Universidad Católica del Perú (PUCP)
