import { ChangeDetectionStrategy, Component, computed, signal, inject, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Firestore, collection, addDoc } from '@angular/fire/firestore';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';

interface VentaDia {
  id?: string;
  fecha: Date;
  hora: string;
  nombreProducto: string;
  valorProducto: number;
  tipo: 'venta-dia'; // Campo para identificar el tipo de registro
  fechaCreacion?: Date;
  fechaActualizacion?: Date;
}

@Component({
  selector: 'app-ventas-dia',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatCardModule,
    MatDividerModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSelectModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ventas-dia.component.html',
  styleUrls: ['./ventas-dia.component.css'],
})
export class VentasDiaComponent {
  private readonly firestore = inject(Firestore);
  private readonly ngZone = inject(NgZone);
  private readonly snackBar = inject(MatSnackBar);

  // Estado (signals)
  private readonly _isSubmitting = signal(false);
  private readonly _formData = signal<VentaDia | null>(null);

  readonly isSubmitting = this._isSubmitting.asReadonly();
  readonly formData = this._formData.asReadonly();

  // Formulario
  readonly form: FormGroup;

  // Habilitar botón Guardar cuando el form es válido y no está enviando
  readonly isFormValid = computed(() => this.form.valid && !this._isSubmitting());

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      fecha: [new Date(), [Validators.required]],
      hora: ['', [Validators.required]],
      nombreProducto: ['', [Validators.required, Validators.minLength(3)]],
      valorProducto: [null, [Validators.required, Validators.min(0)]],
    });

    // Establecer hora actual por defecto
    this.setHoraActual();
  }

  private setHoraActual(): void {
    const ahora = new Date();
    const hora = ahora.getHours().toString().padStart(2, '0');
    const minutos = ahora.getMinutes().toString().padStart(2, '0');
    this.form.patchValue({ hora: `${hora}:${minutos}` });
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
      const payload: Omit<VentaDia, 'id' | 'fechaCreacion' | 'fechaActualizacion'> = {
        fecha: this.form.get('fecha')?.value,
        hora: this.form.get('hora')?.value,
        nombreProducto: this.form.get('nombreProducto')?.value,
        valorProducto: Number(this.form.get('valorProducto')?.value) || 0,
        tipo: 'venta-dia',
      };

      // Guardar en Firebase usando Angular Fire
      // NOTA: Usamos 'gestion-contable' temporalmente hasta que se configuren las reglas para 'ventas-dia'
      let docRef: any;
      await this.ngZone.runOutsideAngular(async () => {
        docRef = await addDoc(collection(this.firestore, 'gestion-contable'), payload);
      });

      // Mostrar mensaje de éxito
      this.snackBar.open(`Venta del día registrada exitosamente con ID: ${docRef.id}`, 'Cerrar', {
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
        fecha: new Date(),
        hora: '',
        nombreProducto: '',
        valorProducto: null,
      });

      // Establecer hora actual nuevamente
      this.setHoraActual();

    } catch (error) {
      console.error('Error al guardar:', error);
      this.snackBar.open('Error al guardar la venta. Inténtalo de nuevo.', 'Cerrar', {
        duration: 5000
      });
    } finally {
      this._isSubmitting.set(false);
    }
  }

  limpiarFormulario(): void {
    this.form.reset({
      fecha: new Date(),
      hora: '',
      nombreProducto: '',
      valorProducto: null,
    });
    this._formData.set(null);
    this.setHoraActual();
  }
}
