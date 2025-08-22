import { Component, signal, computed, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

interface RegistroContable {
  id: string;
  fechaRegistro: Date;
  valorVentas: number;
  observacionVenta: string;
  metodoPago: string;
  gastos: number;
  observacionGasto: string;
  pagoDiaCarlos: boolean;
  total: number;
  estado: 'activo' | 'eliminado';
}

interface FiltrosTabla {
  fechaDesde: Date | null;
  fechaHasta: Date | null;
  metodoPago: string;
  estado: string;
}

@Component({
  selector: 'app-tabla-gestion-contable',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatDialogModule,
    MatMenuModule,
    MatChipsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tabla-gestion-contable.component.html',
  styleUrls: ['./tabla-gestion-contable.component.css']
})
export class TablaGestionContableComponent {
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly fb = inject(FormBuilder);

  // Signals para el estado del componente
  private readonly _registros = signal<RegistroContable[]>([]);
  private readonly _registrosFiltrados = signal<RegistroContable[]>([]);
  private readonly _isLoading = signal(false);
  private readonly _filtros = signal<FiltrosTabla>({
    fechaDesde: null,
    fechaHasta: null,
    metodoPago: '',
    estado: 'activo'
  });

  // Computed values
  readonly registros = this._registros.asReadonly();
  readonly registrosFiltrados = this._registrosFiltrados.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly filtros = this._filtros.asReadonly();
  readonly totalRegistros = computed(() => this._registrosFiltrados().length);
  readonly totalVentas = computed(() =>
    this._registrosFiltrados().reduce((sum, reg) => sum + reg.valorVentas, 0)
  );
  readonly totalGastos = computed(() =>
    this._registrosFiltrados().reduce((sum, reg) => sum + reg.gastos, 0)
  );
  readonly totalNeto = computed(() => this.totalVentas() - this.totalGastos());

  // Columnas de la tabla
  readonly displayedColumns = [
    'fechaRegistro',
    'valorVentas',
    'metodoPago',
    'gastos',
    'total',
    'estado',
    'acciones'
  ];

  // Formulario de filtros
  filtrosForm: FormGroup;

  constructor() {
    this.filtrosForm = this.fb.group({
      fechaDesde: [null],
      fechaHasta: [null],
      metodoPago: [''],
      estado: ['activo']
    });

    // Cargar datos iniciales
    this.cargarDatosIniciales();

    // Suscribirse a cambios en los filtros
    this.filtrosForm.valueChanges.subscribe(filtros => {
      this._filtros.set(filtros);
      this.aplicarFiltros();
    });
  }

  // Cargar datos de ejemplo
  private cargarDatosIniciales(): void {
    this._isLoading.set(true);

    // Simular carga de datos
    setTimeout(() => {
      const datosEjemplo: RegistroContable[] = [
        {
          id: '1',
          fechaRegistro: new Date('2024-01-15'),
          valorVentas: 1500000,
          observacionVenta: 'Venta de productos varios',
          metodoPago: 'transferencia',
          gastos: 300000,
          observacionGasto: 'Gastos operativos del día',
          pagoDiaCarlos: true,
          total: 1200000,
          estado: 'activo'
        },
        {
          id: '2',
          fechaRegistro: new Date('2024-01-16'),
          valorVentas: 2200000,
          observacionVenta: 'Venta mayorista',
          metodoPago: 'efectivo',
          gastos: 450000,
          observacionGasto: 'Gastos de transporte y logística',
          pagoDiaCarlos: true,
          total: 1750000,
          estado: 'activo'
        },
        {
          id: '3',
          fechaRegistro: new Date('2024-01-17'),
          valorVentas: 1800000,
          observacionVenta: 'Venta minorista',
          metodoPago: 'tarjeta-credito',
          gastos: 280000,
          observacionGasto: 'Gastos administrativos',
          pagoDiaCarlos: false,
          total: 1520000,
          estado: 'activo'
        }
      ];

      this._registros.set(datosEjemplo);
      this.aplicarFiltros();
      this._isLoading.set(false);
    }, 1000);
  }

  // Aplicar filtros a los registros
  private aplicarFiltros(): void {
    let registrosFiltrados = [...this._registros()];

    const filtros = this._filtros();

    if (filtros.fechaDesde) {
      registrosFiltrados = registrosFiltrados.filter(reg =>
        reg.fechaRegistro >= filtros.fechaDesde!
      );
    }

    if (filtros.fechaHasta) {
      registrosFiltrados = registrosFiltrados.filter(reg =>
        reg.fechaRegistro <= filtros.fechaHasta!
      );
    }

    if (filtros.metodoPago) {
      registrosFiltrados = registrosFiltrados.filter(reg =>
        reg.metodoPago === filtros.metodoPago
      );
    }

    if (filtros.estado) {
      registrosFiltrados = registrosFiltrados.filter(reg =>
        reg.estado === filtros.estado
      );
    }

    this._registrosFiltrados.set(registrosFiltrados);
  }

  // Editar registro
  editarRegistro(registro: RegistroContable): void {
    console.log('Editando registro:', registro);
    this.snackBar.open(`Editando registro ${registro.id}`, 'Cerrar', {
      duration: 2000
    });
    // Aquí se abriría el modal de edición
  }

  // Eliminar registro
  eliminarRegistro(registro: RegistroContable): void {
    if (confirm(`¿Está seguro de eliminar el registro ${registro.id}?`)) {
      const registrosActuales = this._registros();
      const registrosFiltrados = registrosActuales.map(reg =>
        reg.id === registro.id ? { ...reg, estado: 'eliminado' as const } : reg
      );

      this._registros.set(registrosFiltrados);
      this.aplicarFiltros();

      this.snackBar.open(`Registro ${registro.id} eliminado`, 'Cerrar', {
        duration: 3000
      });
    }
  }

  // Observar registro (ver detalles)
  observarRegistro(registro: RegistroContable): void {
    console.log('Observando registro:', registro);
    this.snackBar.open(`Mostrando detalles del registro ${registro.id}`, 'Cerrar', {
      duration: 2000
    });
    // Aquí se abriría el modal de observación
  }

  // Generar reporte Excel
  generarReporteExcel(): void {
    this._isLoading.set(true);

    // Simular generación de Excel
    setTimeout(() => {
      this._isLoading.set(false);
      this.snackBar.open('Reporte Excel generado exitosamente', 'Cerrar', {
        duration: 3000
      });
      console.log('Generando reporte Excel...');
    }, 2000);
  }

  // Generar reporte PDF
  generarReportePDF(): void {
    this._isLoading.set(true);

    // Simular generación de PDF
    setTimeout(() => {
      this._isLoading.set(false);
      this.snackBar.open('Reporte PDF generado exitosamente', 'Cerrar', {
        duration: 3000
      });
      console.log('Generando reporte PDF...');
    }, 2000);
  }

  // Limpiar filtros
  limpiarFiltros(): void {
    this.filtrosForm.reset({
      fechaDesde: null,
      fechaHasta: null,
      metodoPago: '',
      estado: 'activo'
    });
  }

  // Formatear fecha para mostrar
  formatearFecha(fecha: Date): string {
    return fecha.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  // Formatear moneda
  formatearMoneda(valor: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(valor);
  }

  // Obtener clase CSS para el estado
  getEstadoClass(estado: string): string {
    return estado === 'activo' ? 'estado-activo' : 'estado-eliminado';
  }

  // Obtener texto del estado
  getEstadoText(estado: string): string {
    return estado === 'activo' ? 'Activo' : 'Eliminado';
  }

  // Obtener icono del método de pago
  getMetodoPagoIcon(metodo: string): string {
    const iconos: { [key: string]: string } = {
      'transferencia': 'account_balance',
      'efectivo': 'payments',
      'tarjeta-credito': 'credit_card',
      'debito': 'credit_card'
    };
    return iconos[metodo] || 'payment';
  }

  // Obtener texto del método de pago
  getMetodoPagoText(metodo: string): string {
    const textos: { [key: string]: string } = {
      'transferencia': 'Transferencia',
      'efectivo': 'Efectivo',
      'tarjeta-credito': 'Tarjeta Crédito',
      'debito': 'Débito'
    };
    return textos[metodo] || metodo;
  }
}
