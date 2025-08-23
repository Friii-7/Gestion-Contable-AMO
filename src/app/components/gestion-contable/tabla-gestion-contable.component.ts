import { ChangeDetectionStrategy, Component, computed, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { Firestore, collection, query, orderBy, limit, startAfter, getDocs, QueryDocumentSnapshot, DocumentData, where, Timestamp } from '@angular/fire/firestore';

interface GestionContable {
  id?: string;
  fechaRegistro: Date;
  valorVentas: number;
  observacionVenta: string;
  metodoPago: string;
  valorPago: number;
  gastos: number;
  observacionGasto: string;
  pagoDiaCarlos: boolean;
  total: number;
  estado: string;
  fechaCreacion?: Date;
  fechaActualizacion?: Date;
}

interface TableData {
  data: GestionContable[];
  total: number;
  hasMore: boolean;
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
    MatCardModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTooltipModule,
    MatSnackBarModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="container-fluid py-4">
      <div class="row justify-content-center">
        <div class="col-12">

          <!-- Header -->
          <div class="text-center mb-4">
            <h1 class="display-5 fw-bold text-primary">
              <mat-icon class="me-3">table_chart</mat-icon>
              Tabla de Registros Contables
            </h1>
            <p class="lead text-muted">Visualización de todos los registros guardados en el sistema</p>

            <div class="mt-3">
              <a routerLink="/gestion-contable" class="btn btn-outline-primary me-2">
                <mat-icon class="me-2">add</mat-icon>
                Nuevo Registro
              </a>
              <button mat-stroked-button (click)="refreshData()" [disabled]="isLoading()">
                <mat-icon class="me-2">refresh</mat-icon>
                Actualizar
              </button>
            </div>
          </div>

          <!-- Estadísticas -->
          @if (stats()) {
          <div class="row mb-4">
            <div class="col-12 col-md-3">
              <div class="card bg-primary text-white border-0">
                <div class="card-body text-center">
                  <h6 class="card-title">Total Registros</h6>
                  <h4 class="mb-0">{{ stats()?.totalRegistros || 0 }}</h4>
                </div>
              </div>
            </div>
            <div class="col-12 col-md-3">
              <div class="card bg-success text-white border-0">
                <div class="card-body text-center">
                  <h6 class="card-title">Total Ventas</h6>
                  <h4 class="mb-0">{{ stats()?.totalVentas | currency:'COP':'symbol':'1.0-0' }}</h4>
                </div>
              </div>
            </div>
            <div class="col-12 col-md-3">
              <div class="card bg-warning text-white border-0">
                <div class="card-body text-center">
                  <h6 class="card-title">Total Gastos</h6>
                  <h4 class="mb-0">{{ stats()?.totalGastos | currency:'COP':'symbol':'1.0-0' }}</h4>
                </div>
              </div>
            </div>
            <div class="col-12 col-md-3">
              <div class="card bg-info text-white border-0">
                <div class="card-body text-center">
                  <h6 class="card-title">Balance Total</h6>
                  <h4 class="mb-0">{{ stats()?.balanceTotal | currency:'COP':'symbol':'1.0-0' }}</h4>
                </div>
              </div>
            </div>
          </div>
          }

          <!-- Tabla -->
          <mat-card class="shadow-lg border-0">
            <mat-card-content class="p-0">
              @if (isLoading() && !(tableData().data.length || 0)) {
              <div class="text-center py-5">
                <mat-spinner diameter="50"></mat-spinner>
                <p class="mt-3 text-muted">Cargando registros...</p>
              </div>
              } @else if (!(tableData().data.length || 0)) {
              <div class="text-center py-5">
                <mat-icon class="text-muted" style="font-size: 64px; width: 64px; height: 64px;">inbox</mat-icon>
                <h5 class="text-muted mt-3">No hay registros</h5>
                <p class="text-muted">Aún no se han guardado registros contables.</p>
                <a routerLink="/gestion-contable" class="btn btn-primary">
                  <mat-icon class="me-2">add</mat-icon>
                  Crear Primer Registro
                </a>
              </div>
              } @else {
              <div class="table-responsive">
                <table mat-table [dataSource]="tableData().data || []" matSort class="w-100">

                  <!-- Fecha -->
                  <ng-container matColumnDef="fechaRegistro">
                    <th mat-header-cell *matHeaderCellDef mat-sort-header> Fecha </th>
                    <td mat-cell *matCellDef="let row"> {{ row.fechaRegistro | date:'dd/MM/yyyy' }} </td>
                  </ng-container>

                  <!-- Valor Ventas -->
                  <ng-container matColumnDef="valorVentas">
                    <th mat-header-cell *matHeaderCellDef mat-sort-header> Ventas </th>
                    <td mat-cell *matCellDef="let row"> {{ row.valorVentas | currency:'COP':'symbol':'1.0-0' }} </td>
                  </ng-container>

                  <!-- Método Pago -->
                  <ng-container matColumnDef="metodoPago">
                    <th mat-header-cell *matHeaderCellDef> Método Pago </th>
                    <td mat-cell *matCellDef="let row">
                      <span class="badge" [class]="getMetodoPagoClass(row.metodoPago)">
                        {{ getMetodoPagoLabel(row.metodoPago) }}
                      </span>
                    </td>
                  </ng-container>

                  <!-- Valor Pago -->
                  <ng-container matColumnDef="valorPago">
                    <th mat-header-cell *matHeaderCellDef> Valor Pago </th>
                    <td mat-cell *matCellDef="let row"> {{ row.valorPago | currency:'COP':'symbol':'1.0-0' }} </td>
                  </ng-container>

                  <!-- Gastos -->
                  <ng-container matColumnDef="gastos">
                    <th mat-header-cell *matHeaderCellDef> Gastos </th>
                    <td mat-cell *matCellDef="let row"> {{ row.gastos | currency:'COP':'symbol':'1.0-0' }} </td>
                  </ng-container>

                  <!-- Pago Carlos -->
                  <ng-container matColumnDef="pagoCarlos">
                    <th mat-header-cell *matHeaderCellDef> Pago Carlos </th>
                    <td mat-cell *matCellDef="let row">
                      @if (row.pagoDiaCarlos) {
                      <span class="badge bg-success">Sí</span>
                      } @else {
                      <span class="badge bg-secondary">No</span>
                      }
                    </td>
                  </ng-container>

                  <!-- Total -->
                  <ng-container matColumnDef="total">
                    <th mat-header-cell *matHeaderCellDef mat-sort-header> Total </th>
                    <td mat-cell *matCellDef="let row">
                      <span [class]="row.total >= 0 ? 'text-success' : 'text-danger'">
                        {{ row.total | currency:'COP':'symbol':'1.0-0' }}
                      </span>
                    </td>
                  </ng-container>

                  <!-- Estado -->
                  <ng-container matColumnDef="estado">
                    <th mat-header-cell *matHeaderCellDef> Estado </th>
                    <td mat-cell *matCellDef="let row">
                      <span class="badge" [class]="getEstadoClass(row.estado)">
                        {{ row.estado }}
                      </span>
                    </td>
                  </ng-container>

                  <!-- Acciones -->
                  <ng-container matColumnDef="acciones">
                    <th mat-header-cell *matHeaderCellDef> Acciones </th>
                    <td mat-cell *matCellDef="let row">
                      <button mat-icon-button matTooltip="Ver detalles" (click)="verDetalles(row)">
                        <mat-icon>visibility</mat-icon>
                      </button>
                      <button mat-icon-button matTooltip="Editar" (click)="editarRegistro(row)">
                        <mat-icon>edit</mat-icon>
                      </button>
                    </td>
                  </ng-container>

                  <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
                </table>
              </div>

              <!-- Paginación -->
              <div class="d-flex justify-content-between align-items-center p-3 border-top">
                <div class="text-muted">
                  Mostrando {{ currentPageInfo().start }} - {{ currentPageInfo().end }}
                  de {{ currentPageInfo().total }} registros
                </div>

                <div class="d-flex gap-2">
                  <button mat-stroked-button
                          [disabled]="currentPage() === 0 || isLoading()"
                          (click)="previousPage()">
                    <mat-icon>navigate_before</mat-icon>
                    Anterior
                  </button>

                  <button mat-stroked-button
                          [disabled]="!tableData().hasMore || isLoading()"
                          (click)="nextPage()">
                    Siguiente
                    <mat-icon>navigate_next</mat-icon>
                  </button>
                </div>
              </div>
              }
            </mat-card-content>
          </mat-card>

        </div>
      </div>
    </div>
  `,
})
export class TablaGestionContableComponent implements OnInit, OnDestroy {
  private readonly firestore = inject(Firestore);
  private readonly snackBar = inject(MatSnackBar);

  // Estado
  private readonly _isLoading = signal(false);
  private readonly _tableData = signal<TableData>({ data: [], total: 0, hasMore: false });
  private readonly _currentPage = signal(0);
  private readonly _stats = signal<{
    totalRegistros: number;
    totalVentas: number;
    totalGastos: number;
    balanceTotal: number;
  } | null>(null);

  readonly isLoading = this._isLoading.asReadonly();
  readonly tableData = this._tableData.asReadonly();
  readonly currentPage = this._currentPage.asReadonly();
  readonly stats = this._stats.asReadonly();

  // Computed properties para la paginación
  readonly currentPageInfo = computed(() => {
    const current = this.currentPage();
    const total = this.tableData().total || 0;
    const start = (current * this.pageSize) + 1;
    const end = Math.min((current + 1) * this.pageSize, total);
    return { start, end, total };
  });

  // Configuración de la tabla
  readonly pageSize = 20;
  readonly displayedColumns = [
    'fechaRegistro',
    'valorVentas',
    'metodoPago',
    'valorPago',
    'gastos',
    'pagoCarlos',
    'total',
    'estado',
    'acciones'
  ];

  // Referencias para paginación
  private lastDoc: QueryDocumentSnapshot<DocumentData> | null = null;
  private firstDoc: QueryDocumentSnapshot<DocumentData> | null = null;

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    // Cleanup si es necesario
  }

  async loadData(): Promise<void> {
    this._isLoading.set(true);

    try {
      const collectionRef = collection(this.firestore, 'gestion-contable');
      const q = query(
        collectionRef,
        orderBy('fechaRegistro', 'desc'),
        limit(this.pageSize)
      );

      const querySnapshot = await getDocs(q);
      const data: GestionContable[] = [];

      querySnapshot.forEach((doc) => {
        const docData = doc.data();
        data.push({
          id: doc.id,
          ...docData,
          fechaRegistro: (docData['fechaRegistro'] as Timestamp)?.toDate() || new Date(),
          fechaCreacion: (docData['fechaCreacion'] as Timestamp)?.toDate(),
          fechaActualizacion: (docData['fechaActualizacion'] as Timestamp)?.toDate()
        } as GestionContable);
      });

      // Guardar referencias para paginación
      if (querySnapshot.docs.length > 0) {
        this.firstDoc = querySnapshot.docs[0];
        this.lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
      }

      // Contar total de documentos
      const totalQuery = query(collectionRef);
      const totalSnapshot = await getDocs(totalQuery);
      const total = totalSnapshot.size;

      this._tableData.set({
        data,
        total,
        hasMore: querySnapshot.docs.length === this.pageSize
      });

      // Calcular estadísticas
      this.calcularEstadisticas(data, total);

    } catch (error) {
      console.error('Error al cargar datos:', error);
      this.snackBar.open('Error al cargar los datos. Inténtalo de nuevo.', 'Cerrar', {
        duration: 5000
      });
    } finally {
      this._isLoading.set(false);
    }
  }

  private calcularEstadisticas(data: GestionContable[], totalRegistros: number): void {
    const totalVentas = data.reduce((sum, item) => sum + (item.valorVentas || 0), 0);
    const totalGastos = data.reduce((sum, item) => {
      const gastosOperativos = item.gastos || 0;
      const pagoCarlos = item.pagoDiaCarlos ? 60000 : 0; // PAGO_DIARIO_CARLOS
      return sum + gastosOperativos + pagoCarlos;
    }, 0);
    const balanceTotal = totalVentas - totalGastos;

    this._stats.set({
      totalRegistros,
      totalVentas,
      totalGastos,
      balanceTotal
    });
  }

  async nextPage(): Promise<void> {
    if (!this.lastDoc || this.isLoading()) return;

    this._isLoading.set(true);
    this._currentPage.update(page => page + 1);

    try {
      const collectionRef = collection(this.firestore, 'gestion-contable');
      const q = query(
        collectionRef,
        orderBy('fechaRegistro', 'desc'),
        startAfter(this.lastDoc),
        limit(this.pageSize)
      );

      const querySnapshot = await getDocs(q);
      const data: GestionContable[] = [];

      querySnapshot.forEach((doc) => {
        const docData = doc.data();
        data.push({
          id: doc.id,
          ...docData,
          fechaRegistro: (docData['fechaRegistro'] as Timestamp)?.toDate() || new Date(),
          fechaCreacion: (docData['fechaCreacion'] as Timestamp)?.toDate(),
          fechaActualizacion: (docData['fechaActualizacion'] as Timestamp)?.toDate()
        } as GestionContable);
      });

      if (querySnapshot.docs.length > 0) {
        this.lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
      }

      this._tableData.update(current => ({
        ...current,
        data: [...current.data, ...data],
        hasMore: querySnapshot.docs.length === this.pageSize
      }));

    } catch (error) {
      console.error('Error al cargar siguiente página:', error);
      this.snackBar.open('Error al cargar más datos.', 'Cerrar', { duration: 3000 });
    } finally {
      this._isLoading.set(false);
    }
  }

  async previousPage(): Promise<void> {
    if (this.currentPage() === 0 || this.isLoading()) return;

    this._currentPage.update(page => page - 1);
    // Para simplificar, recargamos desde el inicio
    // En una implementación más avanzada se podría implementar cache de páginas
    await this.loadData();
  }

  async refreshData(): Promise<void> {
    this._currentPage.set(0);
    this.lastDoc = null;
    this.firstDoc = null;
    await this.loadData();
  }

  getMetodoPagoLabel(metodo: string): string {
    const metodos = {
      'consignacion': 'Consignación',
      'entrega_reza': 'Entrega a Reza',
      'efectivo': 'Efectivo'
    };
    return metodos[metodo as keyof typeof metodos] || metodo;
  }

  getMetodoPagoClass(metodo: string): string {
    const clases = {
      'consignacion': 'bg-primary',
      'entrega_reza': 'bg-success',
      'efectivo': 'bg-info'
    };
    return clases[metodo as keyof typeof clases] || 'bg-secondary';
  }

  getEstadoClass(estado: string): string {
    const clases = {
      'activo': 'bg-success',
      'inactivo': 'bg-secondary',
      'pendiente': 'bg-warning'
    };
    return clases[estado as keyof typeof clases] || 'bg-secondary';
  }

  verDetalles(registro: GestionContable): void {
    // Implementar modal o navegación a vista de detalles
    this.snackBar.open(`Viendo detalles de registro: ${registro.id}`, 'Cerrar', { duration: 2000 });
  }

  editarRegistro(registro: GestionContable): void {
    // Implementar navegación a formulario de edición
    this.snackBar.open(`Editando registro: ${registro.id}`, 'Cerrar', { duration: 2000 });
  }
}
