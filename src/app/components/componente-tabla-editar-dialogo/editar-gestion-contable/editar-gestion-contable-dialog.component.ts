import { ChangeDetectionStrategy, Component, OnInit, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { GestionContable } from '../tabla-gestion-contable/componente-tabla-gestion-contable.component';



/** === Mapa de métodos para mostrar etiqueta/icono === */
const METODOS_PAGO = [
  { value: 'consignacion', label: 'Consignación', icon: 'account_balance' },
  { value: 'entrega_reza', label: 'Entrega a Reza', icon: 'person' },
  { value: 'efectivo', label: 'Efectivo', icon: 'money' },
] as const;

@Component({
  selector: 'app-editar-gestion-contable-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCheckboxModule,
    MatSelectModule,
  ],
  templateUrl: './editar-gestion-contable-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditarGestionContableDialogComponent implements OnInit {
  metodosPago = METODOS_PAGO;

  form!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<EditarGestionContableDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: GestionContable
  ) {
    this.form = this.fb.group(
      {
        fechaRegistro: [new Date(), Validators.required],
        valorVentas: [0, [Validators.required, Validators.min(0)]],
        observacionVenta: [''],
        metodoPago: ['efectivo', Validators.required],
        valorPago: [0, [Validators.required, Validators.min(0)]],
        gastos: [0, [Validators.required, Validators.min(0)]],
        observacionGasto: [''],
        pagoDiaCarlos: [false],
        estado: ['activo', Validators.required],
      },
      { validators: [validarValorPago] }
    );
  }

  ngOnInit(): void {
    const fecha = toDate(this.data.fechaRegistro) ?? new Date();
    this.form.patchValue({ ...this.data, fechaRegistro: fecha });

    // Auto-ajuste para "entrega_reza"
    this.form.get('metodoPago')?.valueChanges.subscribe((m) => {
      if (m === 'entrega_reza') {
        const ventas = this.form.get('valorVentas')?.value;
        if (ventas != null) this.form.patchValue({ valorPago: ventas });
      }
    });
    this.form.get('valorVentas')?.valueChanges.subscribe((v) => {
      if (this.form.get('metodoPago')?.value === 'entrega_reza') {
        this.form.patchValue({ valorPago: v ?? 0 }, { emitEvent: false });
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.form.invalid) return;
    const value = this.form.value;

    // Normalizar fecha a Date (evita problemas de Timestamp)
    value.fechaRegistro = toDate(value.fechaRegistro) ?? new Date();

    this.dialogRef.close(value);
  }
}

/** === Validador: pago = ventas cuando metodo = entrega_reza === */
function validarValorPago(group: FormGroup) {
  const m = group.get('metodoPago')?.value;
  const ventas = Number(group.get('valorVentas')?.value ?? 0);
  const pago = Number(group.get('valorPago')?.value ?? 0);
  if (m === 'entrega_reza' && Math.abs(ventas - pago) > 0.01) {
    return { valorPagoInvalido: true };
  }
  return null;
}

/** === Util: convertir a Date robusto === */
function toDate(d: any): Date | null {
  if (!d) return null;
  if (d instanceof Date) return d;
  if (typeof d?.toDate === 'function') return d.toDate();
  if (typeof d === 'number') return new Date(d);
  return new Date(d);
}
