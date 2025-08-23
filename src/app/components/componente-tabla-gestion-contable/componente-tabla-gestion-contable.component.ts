import { ChangeDetectionStrategy, Component, ViewChild, inject, OnInit, AfterViewInit, signal, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
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
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

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
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
<div class="container-fluid py-4">
  <div class="row justify-content-center">
    <div class="col-12 col-xxl-10">

      <!-- Header -->
      <div class="text-center mb-3">
        <h2 class="fw-bold text-primary m-0">
          <mat-icon class="me-2">table_view</mat-icon>
          Gestión Contable - Registros
        </h2>
        <p class="text-muted mb-0">Listado en tiempo real, con filtros, edición y eliminación</p>
      </div>

      <!-- Filtros -->
      <div class="card border-0 shadow-sm mb-3">
        <div class="card-body">
          <form [formGroup]="filtros" class="row g-3">
            <div class="col-12 col-md-4">
              <mat-form-field appearance="outline" class="w-100">
                <mat-label>Búsqueda (observaciones, estado, método)</mat-label>
                <input matInput placeholder="Escribe para filtrar..." formControlName="texto">
                <mat-icon matSuffix>search</mat-icon>
              </mat-form-field>
            </div>

            <div class="col-12 col-md-3">
              <mat-form-field appearance="outline" class="w-100">
                <mat-label>Método de pago</mat-label>
                <mat-select formControlName="metodoPago">
                  <mat-option value="">Todos</mat-option>
                  <mat-option *ngFor="let m of metodosPago" [value]="m.value">
                    <div class="d-flex align-items-center">
                      <mat-icon class="me-2">{{ m.icon }}</mat-icon>
                      <span>{{ m.label }}</span>
                    </div>
                  </mat-option>
                </mat-select>
              </mat-form-field>
            </div>

            <div class="col-12 col-md-2">
              <mat-form-field appearance="outline" class="w-100">
                <mat-label>Desde</mat-label>
                <input matInput [matDatepicker]="dp1" formControlName="desde">
                <mat-datepicker-toggle matSuffix [for]="dp1"></mat-datepicker-toggle>
                <mat-datepicker #dp1></mat-datepicker>
              </mat-form-field>
            </div>

            <div class="col-12 col-md-2">
              <mat-form-field appearance="outline" class="w-100">
                <mat-label>Hasta</mat-label>
                <input matInput [matDatepicker]="dp2" formControlName="hasta">
                <mat-datepicker-toggle matSuffix [for]="dp2"></mat-datepicker-toggle>
                <mat-datepicker #dp2></mat-datepicker>
              </mat-form-field>
            </div>

            <div class="col-12 col-md-1 d-grid">
              <button mat-stroked-button type="button" (click)="limpiarFiltros()" matTooltip="Limpiar filtros">
                <mat-icon>filter_alt_off</mat-icon>
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Tabla -->
      <div class="card border-0 shadow-sm">
        <div class="card-body">

          <div class="d-flex justify-content-between align-items-center mb-2">
            <div class="small text-muted">
              {{ dataSource.data.length }} registro(s)
            </div>
            <div class="d-flex gap-2">
              <button mat-stroked-button color="primary" (click)="refrescar()">
                <mat-icon class="me-1">refresh</mat-icon> Refrescar
              </button>
            </div>
          </div>

          <div class="table-responsive">
            <table mat-table [dataSource]="dataSource" matSort class="mat-elevation-z0 w-100">

              <!-- Fecha -->
              <ng-container matColumnDef="fechaRegistro">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Fecha</th>
                <td mat-cell *matCellDef="let row">
                  {{ toDate(row.fechaRegistro) | date:'yyyy-MM-dd' }}
                </td>
              </ng-container>

              <!-- Valor Ventas -->
              <ng-container matColumnDef="valorVentas">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Ventas</th>
                <td mat-cell *matCellDef="let row">
                  {{ row.valorVentas || 0 | currency:'COP':'symbol':'1.0-0' }}
                </td>
              </ng-container>

              <!-- Método Pago -->
              <ng-container matColumnDef="metodoPago">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Método</th>
                <td mat-cell *matCellDef="let row">
                  <mat-icon class="me-1" [matTooltip]="getMetodoPagoLabel(row.metodoPago)">
                    {{ getMetodoPagoIcon(row.metodoPago) }}
                  </mat-icon>
                  {{ getMetodoPagoLabel(row.metodoPago) }}
                </td>
              </ng-container>

              <!-- Valor Pago -->
              <ng-container matColumnDef="valorPago">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Pago</th>
                <td mat-cell *matCellDef="let row">
                  {{ row.valorPago || 0 | currency:'COP':'symbol':'1.0-0' }}
                </td>
              </ng-container>

              <!-- Gastos -->
              <ng-container matColumnDef="gastos">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Gastos</th>
                <td mat-cell *matCellDef="let row">
                  {{ row.gastos || 0 | currency:'COP':'symbol':'1.0-0' }}
                </td>
              </ng-container>

              <!-- Pago Carlos -->
              <ng-container matColumnDef="pagoDiaCarlos">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Carlos</th>
                <td mat-cell *matCellDef="let row">
                  <mat-icon [ngClass]="row.pagoDiaCarlos ? 'text-primary' : 'text-muted'">person</mat-icon>
                </td>
              </ng-container>

              <!-- Total -->
              <ng-container matColumnDef="total">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Total</th>
                <td mat-cell *matCellDef="let row">
                  <span [ngClass]="row.total >= 0 ? 'text-success' : 'text-danger'">
                    {{ row.total || (row.valorVentas - (row.gastos || 0) - (row.pagoDiaCarlos ? 60000 : 0)) | currency:'COP':'symbol':'1.0-0' }}
                  </span>
                </td>
              </ng-container>

              <!-- Observaciones -->
              <ng-container matColumnDef="observaciones">
                <th mat-header-cell *matHeaderCellDef>Observaciones</th>
                <td mat-cell *matCellDef="let row" class="small text-muted">
                  <div><strong>Venta:</strong> {{ row.observacionVenta }}</div>
                  <div><strong>Gasto:</strong> {{ row.observacionGasto }}</div>
                </td>
              </ng-container>

              <!-- Estado -->
              <ng-container matColumnDef="estado">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Estado</th>
                <td mat-cell *matCellDef="let row">
                  <span class="badge"
                        [ngClass]="row.estado === 'activo' ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-secondary'">
                    {{ row.estado || 'N/D' }}
                  </span>
                </td>
              </ng-container>

              <!-- Acciones -->
              <ng-container matColumnDef="acciones">
                <th mat-header-cell *matHeaderCellDef class="text-end">Acciones</th>
                <td mat-cell *matCellDef="let row" class="text-end">
                  <button mat-icon-button color="primary" (click)="editar(row)" matTooltip="Editar">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button color="warn" (click)="eliminar(row)" matTooltip="Eliminar">
                    <mat-icon>delete</mat-icon>
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns; trackBy: trackId"></tr>
            </table>
          </div>

          <mat-divider class="my-2"></mat-divider>

          <mat-paginator [pageSizeOptions]="[5,10,25,50]" [pageSize]="10" showFirstLastButtons></mat-paginator>
        </div>
      </div>
    </div>
  </div>
</div>
  `,
  styles: [`
    .badge { border-radius: 999px; padding: .25rem .6rem; font-weight: 600; }
    .bg-success-subtle { background: #e6f4ea; }
    .bg-secondary-subtle { background: #eee; }
    .text-success { color: #188038 !important; }
    .text-danger { color: #c13221 !important; }
    .text-muted { color: #6c757d !important; }
  `]
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

/* ===================== D I Á L O G O   E D I T A R ===================== */
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
  template: `
  <h3 mat-dialog-title class="d-flex align-items-center gap-2 m-0">
    <mat-icon>edit</mat-icon> Editar registro
  </h3>

  <div mat-dialog-content class="pt-2">
    <form [formGroup]="form" class="row g-3">
      <div class="col-12 col-md-6">
        <mat-form-field appearance="outline" class="w-100">
          <mat-label>Fecha de registro</mat-label>
          <input matInput [matDatepicker]="dp" formControlName="fechaRegistro">
          <mat-datepicker-toggle matSuffix [for]="dp"></mat-datepicker-toggle>
          <mat-datepicker #dp></mat-datepicker>
          <mat-error *ngIf="form.get('fechaRegistro')?.invalid">Requerido</mat-error>
        </mat-form-field>
      </div>

      <div class="col-12 col-md-6">
        <mat-form-field appearance="outline" class="w-100">
          <mat-label>Método de pago</mat-label>
          <mat-select formControlName="metodoPago">
            <mat-option *ngFor="let m of metodosPago" [value]="m.value">
              <div class="d-flex align-items-center">
                <mat-icon class="me-2">{{ m.icon }}</mat-icon> {{ m.label }}
              </div>
            </mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <div class="col-12 col-md-4">
        <mat-form-field appearance="outline" class="w-100">
          <mat-label>Valor ventas</mat-label>
          <input matInput type="number" formControlName="valorVentas" min="0">
        </mat-form-field>
      </div>

      <div class="col-12 col-md-4">
        <mat-form-field appearance="outline" class="w-100">
          <mat-label>Valor pago</mat-label>
          <input matInput type="number" formControlName="valorPago" min="0">
          <mat-error *ngIf="form.errors?.['valorPagoInvalido']">
            Para "Entrega a Reza" el pago debe igualar a las ventas.
          </mat-error>
        </mat-form-field>
      </div>

      <div class="col-12 col-md-4">
        <mat-form-field appearance="outline" class="w-100">
          <mat-label>Gastos (sin Carlos)</mat-label>
          <input matInput type="number" formControlName="gastos" min="0">
        </mat-form-field>
      </div>

      <div class="col-12">
        <mat-form-field appearance="outline" class="w-100">
          <mat-label>Obs. venta</mat-label>
          <textarea matInput rows="2" formControlName="observacionVenta"></textarea>
        </mat-form-field>
      </div>

      <div class="col-12">
        <mat-form-field appearance="outline" class="w-100">
          <mat-label>Obs. gasto</mat-label>
          <textarea matInput rows="2" formControlName="observacionGasto"></textarea>
        </mat-form-field>
      </div>

      <div class="col-12">
        <mat-checkbox formControlName="pagoDiaCarlos">
          <mat-icon class="me-2">person</mat-icon> Pago del día a Carlos (60,000)
        </mat-checkbox>
      </div>

      <div class="col-12">
        <div class="small text-muted">
          Total (referencial): {{
            (form.value.valorVentas || 0) - ((form.value.gastos || 0) + (form.value.pagoDiaCarlos ? 60000 : 0))
            | currency:'COP':'symbol':'1.0-0'
          }}
        </div>
      </div>
    </form>
  </div>

  <div mat-dialog-actions class="d-flex justify-content-end gap-2">
    <button mat-stroked-button (click)="onCancel()">
      <mat-icon class="me-1">close</mat-icon> Cancelar
    </button>
    <button mat-raised-button color="primary" (click)="onSave()" [disabled]="form.invalid">
      <mat-icon class="me-1">save</mat-icon> Guardar
    </button>
  </div>
  `,
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

/* ===================== D I Á L O G O   C O N F I R M A R ===================== */
@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <h3 mat-dialog-title class="m-0 d-flex align-items-center gap-2">
      <mat-icon>help</mat-icon> {{ data.titulo || 'Confirmar' }}
    </h3>
    <div mat-dialog-content class="pt-2">
      <p class="mb-0">{{ data.mensaje || '¿Confirma la acción?' }}</p>
    </div>
    <div mat-dialog-actions class="d-flex justify-content-end gap-2">
      <button mat-stroked-button mat-dialog-close="false">
        <mat-icon class="me-1">close</mat-icon> Cancelar
      </button>
      <button mat-raised-button color="warn" [mat-dialog-close]="true">
        <mat-icon class="me-1">delete</mat-icon> Eliminar
      </button>
    </div>
  `
})
export class ConfirmDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: { titulo?: string; mensaje?: string }) { }
}
