import { Component, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

interface GestionContable {
  fechaRegistro: Date;
  valorVentas: number;
  observacionVenta: string;
  metodoPago: string;
  gastos: number;
  observacionGasto: string;
  pagoDiaCarlos: boolean;
}

@Component({
  selector: 'app-gestion-contable',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCheckboxModule,
    MatButtonModule,
    MatCardModule,
    MatDividerModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './gestion-contable.component.html',
  styleUrls: ['./gestion-contable.component.css']
})
export class GestionContableComponent {
  // Signals para el estado del componente
  private readonly _isSubmitting = signal(false);
  private readonly _formData = signal<GestionContable | null>(null);

  // Computed values
  readonly isSubmitting = this._isSubmitting.asReadonly();
  readonly formData = this._formData.asReadonly();
  readonly isFormValid = computed(() => this.formulario.valid && !this._isSubmitting());

  // Formulario reactivo
  formulario: FormGroup;

  // Constante para el pago diario a Carlos
  readonly PAGO_DIARIO_CARLOS = 60000;

  // Opciones para el selector de método de pago
  readonly metodosPago = [
    { value: 'transferencia', label: 'Transferencia' },
    { value: 'efectivo', label: 'Efectivo' },
    { value: 'tarjeta-credito', label: 'Tarjeta de Crédito' },
    { value: 'debito', label: 'Débito' }
  ];

  constructor(private fb: FormBuilder) {
    this.formulario = this.fb.group({
      fechaRegistro: [new Date(), [Validators.required]],
      valorVentas: ['', [Validators.required, Validators.min(0)]],
      observacionVenta: ['', [Validators.required, Validators.minLength(10)]],
      metodoPago: ['', [Validators.required]],
      gastos: ['', [Validators.required, Validators.min(0)]],
      observacionGasto: ['', [Validators.required, Validators.minLength(10)]],
      pagoDiaCarlos: [false]
    });

    // Suscribirse a cambios en el checkbox para actualizar gastos automáticamente
    this.formulario.get('pagoDiaCarlos')?.valueChanges.subscribe(checked => {
      if (checked) {
        this.actualizarGastosConPagoCarlos();
      }
    });
  }

  // Método para actualizar gastos incluyendo el pago a Carlos
  private actualizarGastosConPagoCarlos(): void {
    const gastosActuales = this.formulario.get('gastos')?.value || 0;
    const gastosSinCarlos = gastosActuales - this.PAGO_DIARIO_CARLOS;

    if (gastosSinCarlos < 0) {
      // Si no hay suficientes gastos, establecer solo el pago a Carlos
      this.formulario.patchValue({
        gastos: this.PAGO_DIARIO_CARLOS,
        observacionGasto: 'Pago del día a Carlos - $60,000'
      });
    } else {
      // Agregar el pago a Carlos a los gastos existentes
      this.formulario.patchValue({
        gastos: gastosSinCarlos + this.PAGO_DIARIO_CARLOS
      });
    }
  }

  // Método para enviar el formulario
  onSubmit(): void {
    if (this.formulario.valid) {
      this._isSubmitting.set(true);

      // Simular envío de datos
      setTimeout(() => {
        const formValue = this.formulario.value;
        this._formData.set(formValue);
        this._isSubmitting.set(false);

        // Resetear formulario después del envío exitoso
        this.formulario.reset();
        this.formulario.patchValue({
          fechaRegistro: new Date(),
          pagoDiaCarlos: false
        });

        console.log('Datos enviados:', formValue);
      }, 1000);
    }
  }

  // Método para limpiar el formulario
  limpiarFormulario(): void {
    this.formulario.reset();
    this.formulario.patchValue({
      fechaRegistro: new Date(),
      pagoDiaCarlos: false
    });
    this._formData.set(null);
  }

  // Método para obtener el total (ventas - gastos)
  getTotal(): number {
    const ventas = this.formulario.get('valorVentas')?.value || 0;
    const gastos = this.formulario.get('gastos')?.value || 0;
    return ventas - gastos;
  }

  // Método para obtener el total de gastos sin incluir el pago a Carlos
  getGastosSinCarlos(): number {
    const gastos = this.formulario.get('gastos')?.value || 0;
    const pagoCarlos = this.formulario.get('pagoDiaCarlos')?.value ? this.PAGO_DIARIO_CARLOS : 0;
    return gastos - pagoCarlos;
  }

  // Método para validar si el campo tiene errores
  hasError(fieldName: string): boolean {
    const field = this.formulario.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  // Método para obtener el mensaje de error
  getErrorMessage(fieldName: string): string {
    const field = this.formulario.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return 'Este campo es requerido';
      if (field.errors['min']) return `El valor mínimo es ${field.errors['min'].min}`;
      if (field.errors['minlength']) return `Mínimo ${field.errors['minlength'].requiredLength} caracteres`;
    }
    return '';
  }
}
