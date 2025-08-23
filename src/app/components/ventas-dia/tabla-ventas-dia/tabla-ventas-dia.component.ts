import { ChangeDetectionStrategy, Component, computed, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Firestore, collection, getDocs, doc, updateDoc, deleteDoc, query, where, orderBy, onSnapshot } from '@angular/fire/firestore';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';

import { ExportarReporteComponent } from '../../shared/exportar-reporte';
import { ReportesService, FiltroReporte, ColumnaReporte } from '../../../services/reportes.service';

interface VentaDia {
  id?: string;
  fecha: Date;
  hora: string;
  nombreProducto: string;
  valorProducto: number;
  tipo: 'venta-dia';
  fechaCreacion?: Date;
  fechaActualizacion?: Date;
}

interface VentaDiaTableItem extends VentaDia {
  id: string;
  fechaCreacion: Date;
  fechaActualizacion: Date;
}

@Component({
  selector: 'app-tabla-ventas-dia',
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
    MatTableModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatTooltipModule,
    MatPaginatorModule,
    MatSortModule,

    // Componentes compartidos
    ExportarReporteComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tabla-ventas-dia.component.html',
  styleUrls: ['./tabla-ventas-dia.component.css'],
})
export class TablaVentasDiaComponent implements OnInit, OnDestroy {
  private readonly firestore = inject(Firestore);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly reportesService = inject(ReportesService);

  // Estado (signals)
  private readonly _ventas = signal<VentaDiaTableItem[]>([]);
  private readonly _loading = signal(false);
  private readonly _editingVenta = signal<VentaDiaTableItem | null>(null);
  private readonly _showEditForm = signal(false);

  readonly ventas = this._ventas.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly editingVenta = this._editingVenta.asReadonly();
  readonly showEditForm = this._showEditForm.asReadonly();

  // Paginación
  readonly pageSize = 10;
  readonly pageSizeOptions = [5, 10, 25, 50];

  // Ordenamiento
  readonly sortData = signal<Sort>({ active: 'fecha', direction: 'desc' });

  // Columnas de la tabla
  readonly displayedColumns = ['fecha', 'hora', 'nombreProducto', 'valorProducto', 'acciones'];

  // Columnas para el reporte
  readonly columnasReporte: ColumnaReporte[] = [
    { header: 'Fecha', dataKey: 'fecha', width: 25 },
    { header: 'Hora', dataKey: 'hora', width: 20 },
    { header: 'Producto', dataKey: 'nombreProducto', width: 40 },
    { header: 'Valor', dataKey: 'valorProducto', width: 25 }
  ];

  // Formulario de edición
  readonly editForm: FormGroup;

  // Computed values
  readonly totalVentas = computed(() => this._ventas().length);
  readonly totalValor = computed(() =>
    this._ventas().reduce((sum, venta) => sum + venta.valorProducto, 0)
  );

  private unsubscribe: (() => void) | null = null;

  constructor(private fb: FormBuilder) {
    this.editForm = this.fb.group({
      fecha: ['', [Validators.required]],
      hora: ['', [Validators.required]],
      nombreProducto: ['', [Validators.required, Validators.minLength(3)]],
      valorProducto: [null, [Validators.required, Validators.min(0)]],
    });
  }

  ngOnInit(): void {
    this.cargarVentas();
  }

  ngOnDestroy(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }

    private async cargarVentas(): Promise<void> {
    this._loading.set(true);

    try {
      const ventasRef = collection(this.firestore, 'ventas-dia');
      // Consulta para obtener todas las ventas del día
      const q = query(
        ventasRef,
        orderBy('fecha', 'desc')
      );

      this.unsubscribe = onSnapshot(q, (snapshot) => {
        const ventas: VentaDiaTableItem[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          ventas.push({
            id: doc.id,
            fecha: data['fecha'].toDate(),
            hora: data['hora'],
            nombreProducto: data['nombreProducto'],
            valorProducto: data['valorProducto'],
            tipo: data['tipo'],
            fechaCreacion: data['fechaCreacion']?.toDate() || new Date(),
            fechaActualizacion: data['fechaActualizacion']?.toDate() || new Date(),
          });
        });

        this._ventas.set(ventas);
        this._loading.set(false);
      }, (error) => {
        console.error('Error al cargar ventas:', error);
        this._loading.set(false);
        this.snackBar.open('Error al cargar las ventas', 'Cerrar', { duration: 3000 });
      });

    } catch (error) {
      console.error('Error al cargar ventas:', error);
      this._loading.set(false);
      this.snackBar.open('Error al cargar las ventas', 'Cerrar', { duration: 3000 });
    }
  }

  editarVenta(venta: VentaDiaTableItem): void {
    this._editingVenta.set(venta);
    this._showEditForm.set(true);

    this.editForm.patchValue({
      fecha: venta.fecha,
      hora: venta.hora,
      nombreProducto: venta.nombreProducto,
      valorProducto: venta.valorProducto,
    });
  }

  cancelarEdicion(): void {
    this._editingVenta.set(null);
    this._showEditForm.set(false);
    this.editForm.reset();
  }

  async guardarEdicion(): Promise<void> {
    if (this.editForm.invalid || !this._editingVenta()) return;

    const venta = this._editingVenta();
    if (!venta) return;

    try {
      const ventaRef = doc(this.firestore, 'ventas-dia', venta.id);
      const updateData = {
        ...this.editForm.value,
        fechaActualizacion: new Date(),
      };

      await updateDoc(ventaRef, updateData);

      this.snackBar.open('Venta actualizada exitosamente', 'Cerrar', { duration: 3000 });
      this.cancelarEdicion();

    } catch (error) {
      console.error('Error al actualizar venta:', error);
      this.snackBar.open('Error al actualizar la venta', 'Cerrar', { duration: 3000 });
    }
  }

  async eliminarVenta(venta: VentaDiaTableItem): Promise<void> {
    const confirmacion = confirm(`¿Estás seguro de que quieres eliminar la venta de "${venta.nombreProducto}"?`);

    if (!confirmacion) return;

    try {
      const ventaRef = doc(this.firestore, 'ventas-dia', venta.id);
      await deleteDoc(ventaRef);

      this.snackBar.open('Venta eliminada exitosamente', 'Cerrar', { duration: 3000 });

    } catch (error) {
      console.error('Error al eliminar venta:', error);
      this.snackBar.open('Error al eliminar la venta', 'Cerrar', { duration: 3000 });
    }
  }

  onSortChange(sort: Sort): void {
    this.sortData.set(sort);
    // TODO: Implementar ordenamiento del lado del cliente mientras se construye el índice
    // Después de crear el índice, cambiar a ordenamiento del lado del servidor
    console.log('Ordenamiento solicitado:', sort);
  }

  // Formateo de datos para la tabla
  formatearFecha(fecha: Date): string {
    return fecha.toLocaleDateString('es-ES');
  }

  formatearHora(hora: string): string {
    return hora;
  }

  formatearValor(valor: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(valor);
  }

  /** === Exportación de Reportes === */
  generarPDF(filtro?: FiltroReporte | null): void {
    let datos = this.ventas();

    if (filtro) {
      datos = this.reportesService.filtrarPorFechas(datos, filtro.fechaInicio, filtro.fechaFin);
    }

    // Preparar datos para el reporte
    const datosReporte = datos.map(item => ({
      ...item,
      fecha: this.formatearFecha(item.fecha),
      valorProducto: this.formatearValor(item.valorProducto)
    }));

    this.reportesService.generarPDF(
      'Reporte de Ventas del Día',
      datosReporte,
      this.columnasReporte,
      filtro || undefined
    );
  }

  generarExcel(filtro?: FiltroReporte | null): void {
    let datos = this.ventas();

    if (filtro) {
      datos = this.reportesService.filtrarPorFechas(datos, filtro.fechaInicio, filtro.fechaFin);
    }

    // Preparar datos para el reporte
    const datosReporte = datos.map(item => ({
      ...item,
      fecha: this.formatearFecha(item.fecha),
      valorProducto: this.formatearValor(item.valorProducto)
    }));

    this.reportesService.generarExcel(
      'Reporte de Ventas del Día',
      datosReporte,
      this.columnasReporte,
      filtro || undefined
    );
  }

  /** === Ver Detalle de Venta === */
  verDetalleVenta(venta: VentaDiaTableItem): void {
    const mensaje = `
      Detalles de la Venta:

      Fecha: ${this.formatearFecha(venta.fecha)}
      Hora: ${venta.hora}
      Producto: ${venta.nombreProducto}
      Valor: ${this.formatearValor(venta.valorProducto)}
      Fecha de Creación: ${venta.fechaCreacion.toLocaleDateString('es-CO')}
      Última Actualización: ${venta.fechaActualizacion.toLocaleDateString('es-CO')}
    `;

    alert(mensaje);
  }
}
