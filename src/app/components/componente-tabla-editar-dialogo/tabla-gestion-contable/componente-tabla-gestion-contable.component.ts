import { ChangeDetectionStrategy, Component, ViewChild, inject, OnInit, AfterViewInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import {
  Firestore,
  collection,
  collectionData,
  deleteDoc,
  doc,
  updateDoc,
  query,
  orderBy,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { EditarGestionContableDialogComponent } from '../editar-gestion-contable/editar-gestion-contable-dialog.component';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';


/** === Interface compartida (misma del formulario) === */
export interface GestionContable {
  id?: string;
  fechaRegistro: any; // Firestore Timestamp | Date
  valorVentas: number;
  observacionVenta: string;
  metodoPago: 'consignacion' | 'entrega_reza' | 'efectivo';
  valorPago: number;
  gastos: number; // gastos operativos (NO incluye pago de Carlos)
  observacionGasto: string;
  pagoDiaCarlos: boolean;
  total: number;
  estado: string;
  fechaCreacion?: any;
  fechaActualizacion?: any;
}

/** === Mapa de métodos para mostrar etiqueta/icono === */
const METODOS_PAGO = [
  { value: 'consignacion', label: 'Consignación', icon: 'account_balance' },
  { value: 'entrega_reza', label: 'Entrega a Reza', icon: 'person' },
  { value: 'efectivo', label: 'Efectivo', icon: 'money' },
] as const;

@Component({
  selector: 'app-tabla-gestion-contable',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,

    // Material
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSelectModule,
    MatTooltipModule,
    MatDialogModule,
    MatDividerModule,
    MatCheckboxModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './componente-tabla-gestion-contable.component.html',
  styleUrls: ['./componente-tabla-gestion-contable.component.css']
})
export class TablaGestionContableComponent implements OnInit, AfterViewInit {
  private readonly firestore = inject(Firestore);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  metodosPago = METODOS_PAGO;
  displayedColumns: string[] = [
    'fechaRegistro',
    'valorVentas',
    'metodoPago',
    'valorPago',
    'gastos',
    'pagoDiaCarlos',
    'total',
    'observaciones',
    'estado',
    'acciones'
  ];

  dataSource = new MatTableDataSource<GestionContable>([]);
  original$: Observable<GestionContable[]> | undefined;

  filtros!: FormGroup;

  cargando = signal<boolean>(true);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private fb: FormBuilder) {
    this.filtros = this.fb.group({
      texto: new FormControl<string>('', { nonNullable: true }),
      metodoPago: new FormControl<string>('', { nonNullable: true }),
      desde: new FormControl<Date | null>(null),
      hasta: new FormControl<Date | null>(null),
    });
  }

  ngOnInit(): void {
    // Query base: ordenar por fecha (desc)
    const colRef = collection(this.firestore, 'gestion-contable');
    const q = query(colRef, orderBy('fechaRegistro', 'desc'));
    this.original$ = collectionData(q, { idField: 'id' }) as Observable<GestionContable[]>;

    this.original$.subscribe({
      next: (rows) => {
        this.dataSource.data = rows ?? [];
        this.cargando.set(false);
        this.aplicarPredicatePersonalizado();
        this.aplicarOrdenamiento();
        this.aplicarFiltro(); // aplicar filtros vigentes
      },
      error: () => {
        this.cargando.set(false);
        this.snackBar.open('Error cargando registros de Firestore.', 'Cerrar', { duration: 4000 });
      }
    });

    // Reaplicar filtros cuando cambien
    this.filtros.valueChanges.subscribe(() => this.aplicarFiltro());
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.aplicarOrdenamiento();
  }

  refrescar(): void {
    // Forzar re-evaluación de filtros/ordenamiento
    this.aplicarPredicatePersonalizado();
    this.aplicarOrdenamiento();
    this.aplicarFiltro();
    this.snackBar.open('Tabla actualizada.', 'Cerrar', { duration: 2000 });
  }

  aplicarOrdenamiento(): void {
    this.dataSource.sortingDataAccessor = (item, property) => {
      switch (property) {
        case 'fechaRegistro':
          return this.toDate(item.fechaRegistro)?.getTime() ?? 0;
        case 'valorVentas':
        case 'valorPago':
        case 'gastos':
        case 'total':
          // Asegurar número
          return (item as any)[property] ?? 0;
        case 'metodoPago':
        case 'estado':
          return ((item as any)[property] || '').toString();
        default:
          return (item as any)[property];
      }
    };
  }

  aplicarPredicatePersonalizado(): void {
    this.dataSource.filterPredicate = (row, filterJson) => {
      const f = JSON.parse(filterJson) as {
        texto: string; metodoPago: string; desde: number | null; hasta: number | null;
      };

      // Texto: busca en observaciones, estado y método
      const texto = (f.texto ?? '').trim().toLowerCase();
      const hayTexto = !texto || [
        row.observacionVenta,
        row.observacionGasto,
        row.estado,
        this.getMetodoPagoLabel(row.metodoPago),
      ].some(v => (v || '').toString().toLowerCase().includes(texto));

      if (!hayTexto) return false;

      // Método de pago
      if (f.metodoPago && row.metodoPago !== f.metodoPago) return false;

      // Rango de fechas
      const fecha = this.toDate(row.fechaRegistro)?.setHours(0, 0, 0, 0) ?? 0;
      if (f.desde && fecha < f.desde) return false;
      if (f.hasta && fecha > f.hasta) return false;

      return true;
    };
  }

  aplicarFiltro(): void {
    const { texto, metodoPago, desde, hasta } = this.filtros.value;
    const payload = {
      texto: (texto || '').toString(),
      metodoPago: (metodoPago || '').toString(),
      desde: desde ? new Date(desde.setHours(0, 0, 0, 0)).getTime() : null,
      hasta: hasta ? new Date(hasta.setHours(23, 59, 59, 999)).getTime() : null,
    };
    this.dataSource.filter = JSON.stringify(payload);
    if (this.dataSource.paginator) this.dataSource.paginator.firstPage();
  }

  limpiarFiltros(): void {
    this.filtros.reset({ texto: '', metodoPago: '', desde: null, hasta: null });
  }

  getMetodoPagoLabel(value: GestionContable['metodoPago']): string {
    return METODOS_PAGO.find(m => m.value === value)?.label ?? 'N/D';
  }
  getMetodoPagoIcon(value: GestionContable['metodoPago']): string {
    return METODOS_PAGO.find(m => m.value === value)?.icon ?? 'help';
  }

  toDate(d: any): Date | null {
    // Firestore Timestamp => Date
    if (!d) return null;
    if (d instanceof Date) return d;
    if (typeof d?.toDate === 'function') return d.toDate();
    // epoch number
    if (typeof d === 'number') return new Date(d);
    return new Date(d);
  }

  trackId = (_: number, row: GestionContable) => row.id;



  /** === Acciones === */
  editar(row: GestionContable): void {
    const dialogRef = this.dialog.open(EditarGestionContableDialogComponent, {
      width: '720px',
      data: { ...row }, // clonar
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe(async (result: Partial<GestionContable> | undefined) => {
      if (!result || !row.id) return;

      // Recalcular total por si cambió algo:
      const PAGO_CARLOS = 60000;
      const ventas = Number(result.valorVentas ?? row.valorVentas) || 0;
      const gastos = Number(result.gastos ?? row.gastos) || 0;
      const pagoCarlos = (result.pagoDiaCarlos ?? row.pagoDiaCarlos) ? PAGO_CARLOS : 0;
      const total = ventas - (gastos + pagoCarlos);

      try {
        await updateDoc(doc(this.firestore, 'gestion-contable', row.id), {
          ...result,
          total,
          fechaActualizacion: new Date(),
        });
        this.snackBar.open('Registro actualizado', 'Cerrar', { duration: 2500 });
      } catch (e) {
        this.snackBar.open('No fue posible actualizar. Reintenta.', 'Cerrar', { duration: 3500 });
      }
    });
  }

  async eliminar(row: GestionContable): Promise<void> {
    const ok = await this.confirmar(`¿Eliminar el registro del ${this.toDate(row.fechaRegistro)?.toLocaleDateString()}?`);
    if (!ok || !row.id) return;
    try {
      await deleteDoc(doc(this.firestore, 'gestion-contable', row.id));
      this.snackBar.open('Registro eliminado', 'Cerrar', { duration: 2500 });
    } catch {
      this.snackBar.open('No fue posible eliminar. Reintenta.', 'Cerrar', { duration: 3500 });
    }
  }

  /** Confirmación con diálogo */
  private confirmar(mensaje: string): Promise<boolean> {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: { titulo: 'Confirmar', mensaje },
      disableClose: true,
    });
    return ref.afterClosed().toPromise();
  }
}


