import { ChangeDetectionStrategy, Component, computed, signal, inject, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Firestore, collection, addDoc } from '@angular/fire/firestore';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

interface GestionContable {
  id?: string;
  fechaRegistro: Date;
  valorVentas: number;
  observacionVenta: string;
  metodoPago: string;
  gastos: number; // gastos operativos (NO incluye pago de Carlos)
  observacionGasto: string;
  pagoDiaCarlos: boolean;
  total: number;
  estado: string;
  fechaCreacion?: Date;
  fechaActualizacion?: Date;
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
    MatDatepickerModule,
    MatNativeDateModule,
    MatCheckboxModule,
    MatButtonModule,
    MatCardModule,
    MatDividerModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './gestion-contable.component.html',
  styleUrls: ['./gestion-contable.component.css'],
})
export class GestionContableComponent {
  private readonly firestore = inject(Firestore);
  private readonly ngZone = inject(NgZone);
  private readonly snackBar = inject(MatSnackBar);

  // Constantes
  readonly PAGO_DIARIO_CARLOS = 60_000;

  // Estado (signals)
  private readonly _isSubmitting = signal(false);
  private readonly _formData = signal<GestionContable | null>(null);

  readonly isSubmitting = this._isSubmitting.asReadonly();
  readonly formData = this._formData.asReadonly();

  // Formulario
  readonly form: FormGroup;

  // Habilitar botón Guardar cuando el form es válido y no está enviando
  readonly isFormValid = computed(() => this.form.valid && !this._isSubmitting());

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      fechaRegistro: [new Date(), [Validators.required]],
      valorVentas: [null, [Validators.required, Validators.min(0)]],
      observacionVenta: ['', [Validators.required, Validators.minLength(10)]],
      gastos: [null, [Validators.required, Validators.min(0)]],
      observacionGasto: ['', [Validators.required, Validators.minLength(10)]],
      pagoDiaCarlos: [false],
    });
  }

  // --- Cálculos ---
  getGastosSinCarlos(): number {
    return Number(this.form.get('gastos')?.value) || 0;
  }

  private getPagoCarlosActual(): number {
    return this.form.get('pagoDiaCarlos')?.value ? this.PAGO_DIARIO_CARLOS : 0;
  }

  getTotal(): number {
    const ventas = Number(this.form.get('valorVentas')?.value) || 0;
    const gastos = this.getGastosSinCarlos() + this.getPagoCarlosActual();
    return ventas - gastos;
  }

  // --- UI helpers ---
  hasError(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }

  getErrorMessage(field: string): string {
    const ctrl = this.form.get(field);
    if (!ctrl || !ctrl.errors) return '';
    if (ctrl.errors['required']) return 'Este campo es requerido';
    if (ctrl.errors['min']) return `El valor mínimo es ${ctrl.errors['min'].min}`;
    if (ctrl.errors['minlength']) return `Mínimo ${ctrl.errors['minlength'].requiredLength} caracteres`;
    return 'Campo inválido';
  }

  // --- Acciones ---
  async onSubmit(): Promise<void> {
    if (this.form.invalid) return;

    this._isSubmitting.set(true);

    try {
      // Crear el payload para Firebase
      const payload: Omit<GestionContable, 'id' | 'fechaCreacion' | 'fechaActualizacion'> = {
        fechaRegistro: this.form.get('fechaRegistro')?.value,
        valorVentas: Number(this.form.get('valorVentas')?.value) || 0,
        observacionVenta: this.form.get('observacionVenta')?.value,
        metodoPago: 'efectivo', // Por defecto, se puede cambiar después
        gastos: Number(this.form.get('gastos')?.value) || 0,
        observacionGasto: this.form.get('observacionGasto')?.value,
        pagoDiaCarlos: this.form.get('pagoDiaCarlos')?.value,
        total: this.getTotal(),
        estado: 'activo'
      };

      // Guardar en Firebase usando Angular Fire
      let docRef: any;
      await this.ngZone.runOutsideAngular(async () => {
        docRef = await addDoc(collection(this.firestore, 'gestion-contable'), payload);
      });

      // Mostrar mensaje de éxito
      this.snackBar.open(`Registro guardado exitosamente con ID: ${docRef.id}`, 'Cerrar', {
        duration: 5000
      });

      // Actualizar el estado local
      this._formData.set({
        ...payload,
        id: docRef.id,
        fechaCreacion: new Date(),
        fechaActualizacion: new Date()
      });

      // Reset elegante
      this.form.reset({
        fechaRegistro: new Date(),
        valorVentas: null,
        observacionVenta: '',
        gastos: null,
        observacionGasto: '',
        pagoDiaCarlos: false,
      });

    } catch (error) {
      console.error('Error al guardar:', error);
      this.snackBar.open('Error al guardar el registro. Inténtalo de nuevo.', 'Cerrar', {
        duration: 5000
      });
    } finally {
      this._isSubmitting.set(false);
    }
  }

  limpiarFormulario(): void {
    this.form.reset({
      fechaRegistro: new Date(),
      valorVentas: null,
      observacionVenta: '',
      gastos: null,
      observacionGasto: '',
      pagoDiaCarlos: false,
    });
    this._formData.set(null);
  }

  // Método para probar conexión a Firebase
  async testFirebaseConnection(): Promise<void> {
    try {
      // Crear un documento de prueba temporal
      const testDoc = { test: true, timestamp: new Date() };
      const docRef = await addDoc(collection(this.firestore, 'test-connection'), testDoc);

      // Eliminar el documento de prueba
      // await deleteDoc(doc(this.firestore, 'test-connection', docRef.id));

      this.snackBar.open('✅ Conexión a Firebase exitosa', 'Cerrar', {
        duration: 5000
      });
    } catch (error) {
      console.error('Error al probar conexión:', error);
      this.snackBar.open('❌ Error en conexión a Firebase', 'Cerrar', {
        duration: 5000
      });
    }
  }

  // Método para verificar configuración del proyecto
  async checkProjectConfiguration(): Promise<void> {
    try {
      // Verificar que Firestore esté disponible
      if (this.firestore) {
        this.snackBar.open('✅ Firestore configurado correctamente. Revisa la consola.', 'Cerrar', {
          duration: 5000
        });
        console.log('Firestore instance:', this.firestore);
      } else {
        this.snackBar.open('❌ Firestore no está configurado', 'Cerrar', {
          duration: 5000
        });
      }
    } catch (error) {
      console.error('Error al verificar configuración:', error);
      this.snackBar.open('❌ Error al verificar configuración del proyecto', 'Cerrar', {
        duration: 5000
      });
    }
  }
}
