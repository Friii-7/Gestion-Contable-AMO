import { ChangeDetectionStrategy, Component, computed, signal, inject, NgZone, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Firestore, collection, addDoc, query, where, getDocs } from '@angular/fire/firestore';
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
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TablaGestionContableComponent } from '../componente-tabla-editar-dialogo/tabla-gestion-contable/componente-tabla-gestion-contable.component';
import { DashboardService } from '../../services/dashboard.service';

interface GestionContable {
  id?: string;
  fechaRegistro: Date;
  valorVentas: number;
  metodoPago: string;
  valorPago: number;
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
    MatSelectModule,
    MatTooltipModule,
],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './gestion-contable.component.html',
  styleUrls: ['./gestion-contable.component.css'],
})
export class GestionContableComponent implements OnInit {
  private readonly firestore = inject(Firestore);
  private readonly ngZone = inject(NgZone);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dashboardService = inject(DashboardService);

  // Constantes
  readonly PAGO_DIARIO_CARLOS = 60_000;

  // Opciones de método de pago
  readonly METODOS_PAGO = [
    { value: 'consignacion', label: 'Consignación', icon: 'account_balance' },
    { value: 'entrega_reza', label: 'Entrega a Reza', icon: 'person' },
    { value: 'efectivo', label: 'Efectivo', icon: 'money' }
  ];

  // Estado (signals)
  private readonly _isSubmitting = signal(false);
  private readonly _formData = signal<GestionContable | null>(null);
  private readonly _isLoadingVentas = signal(false);

  readonly isSubmitting = this._isSubmitting.asReadonly();
  readonly formData = this._formData.asReadonly();
  readonly isLoadingVentas = this._isLoadingVentas.asReadonly();

  // Formulario
  readonly form: FormGroup;

  // Habilitar botón Guardar cuando el form es válido y no está enviando
  readonly isFormValid = computed(() => this.form.valid && !this._isSubmitting());

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      fechaRegistro: [new Date(), [Validators.required]],
      valorVentas: [null, [Validators.required, Validators.min(0)]],
      metodoPago: ['efectivo', [Validators.required]],
      valorPago: [null, [Validators.required, Validators.min(0)]],
      gastos: [null, [Validators.required, Validators.min(0)]],
      observacionGasto: ['', [Validators.required, Validators.minLength(10)]],
      pagoDiaCarlos: [false],
    }, { validators: this.validarValorPago });

    // Listener para actualizar automáticamente el valor del pago
    this.form.get('metodoPago')?.valueChanges.subscribe(metodo => {
      if (metodo === 'entrega_reza') {
        const valorVentas = this.form.get('valorVentas')?.value;
        if (valorVentas) {
          this.form.patchValue({ valorPago: valorVentas });
        }
      }
    });

    // Listener para validar cuando cambie el valor de ventas
    this.form.get('valorVentas')?.valueChanges.subscribe(valor => {
      const metodoPago = this.form.get('metodoPago')?.value;
      if (metodoPago === 'entrega_reza' && valor) {
        this.form.patchValue({ valorPago: valor });
      }
    });
  }

  ngOnInit(): void {
    // Cargar el total de ventas del día actual al inicializar
    this.cargarTotalVentasDia();

    // Suscribirse a cambios en la fecha para recalcular ventas
    this.form.get('fechaRegistro')?.valueChanges.subscribe(fecha => {
      if (fecha) {
        // Limpiar el campo de valor de ventas antes de cargar el nuevo total
        this.form.patchValue({ valorVentas: null });
        // Cargar el total de ventas para la nueva fecha
        this.cargarTotalVentasDia(fecha);
      }
    });
  }

  /**
   * Carga el total de ventas del día especificado (o del día actual si no se especifica)
   */
  async cargarTotalVentasDia(fecha?: Date): Promise<void> {
    this._isLoadingVentas.set(true);

    try {
      const fechaBuscar = fecha || new Date();
      const inicioDia = new Date(fechaBuscar.getFullYear(), fechaBuscar.getMonth(), fechaBuscar.getDate(), 0, 0, 0, 0);
      const finDia = new Date(fechaBuscar.getFullYear(), fechaBuscar.getMonth(), fechaBuscar.getDate(), 23, 59, 59, 999);

      // Consultar ventas del día en Firestore
      const ventasRef = collection(this.firestore, 'ventas-dia');
      const ventasQuery = query(
        ventasRef,
        where('fecha', '>=', inicioDia),
        where('fecha', '<=', finDia)
      );

      const ventasSnapshot = await getDocs(ventasQuery);
      let totalVentas = 0;

      ventasSnapshot.forEach(doc => {
        const data = doc.data();
        totalVentas += data['valorProducto'] || 0;
      });

      // Actualizar el campo valorVentas con el total real
      this.form.patchValue({ valorVentas: totalVentas });

      // Si el método de pago es 'entrega_reza', también actualizar el valorPago
      const metodoPago = this.form.get('metodoPago')?.value;
      if (metodoPago === 'entrega_reza') {
        this.form.patchValue({ valorPago: totalVentas });
      }

      console.log(`Total de ventas del día ${fechaBuscar.toLocaleDateString()}: $${totalVentas.toLocaleString()}`);

      // Mostrar mensaje de éxito si se cargó manualmente
      if (!fecha) {
        this.snackBar.open(`Total de ventas del día cargado: $${totalVentas.toLocaleString()}`, 'Cerrar', {
          duration: 3000
        });
      }
    } catch (error) {
      console.error('Error al cargar total de ventas del día:', error);
      this.snackBar.open('Error al cargar el total de ventas del día', 'Cerrar', {
        duration: 3000
      });
    } finally {
      this._isLoadingVentas.set(false);
    }
  }

  // Validación personalizada para el valor del pago
  private validarValorPago(group: FormGroup): { [key: string]: any } | null {
    const metodoPago = group.get('metodoPago')?.value;
    const valorVentas = group.get('valorVentas')?.value;
    const valorPago = group.get('valorPago')?.value;

    if (metodoPago === 'entrega_reza' && valorVentas && valorPago) {
      if (Math.abs(valorVentas - valorPago) > 0.01) { // Tolerancia para decimales
        return { valorPagoInvalido: true };
      }
    }

    return null;
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
    if (ctrl.errors['valorPagoInvalido']) return 'El valor del pago debe coincidir con el valor de ventas para "Entrega a Reza"';
    return 'Campo inválido';
  }

  getMetodoPagoLabel(): string {
    const metodoSeleccionado = this.form.get('metodoPago')?.value;
    const metodo = this.METODOS_PAGO.find(m => m.value === metodoSeleccionado);
    return metodo ? metodo.label : 'No seleccionado';
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
        metodoPago: this.form.get('metodoPago')?.value,
        valorPago: Number(this.form.get('valorPago')?.value) || 0,
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
        metodoPago: 'efectivo',
        valorPago: null,
        gastos: null,
        observacionGasto: '',
        pagoDiaCarlos: false,
      });

      // Cargar automáticamente el total de ventas del día actual
      this.cargarTotalVentasDia();

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
      metodoPago: 'efectivo',
      valorPago: null,
      gastos: null,
      observacionGasto: '',
      pagoDiaCarlos: false,
    });
    this._formData.set(null);

    // Cargar automáticamente el total de ventas del día actual
    this.cargarTotalVentasDia();
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
