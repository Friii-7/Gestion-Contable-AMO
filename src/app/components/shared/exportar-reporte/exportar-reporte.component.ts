import { ChangeDetectionStrategy, Component, EventEmitter, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { FiltroReporte, ReportesService } from '../../../services/reportes.service';

@Component({
  selector: 'app-exportar-reporte',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    MatDividerModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="exportar-container">
      <!-- Botón principal de exportación -->
      <button
        mat-raised-button
        color="primary"
        [matMenuTriggerFor]="menu"
        class="exportar-btn">
        <mat-icon>download</mat-icon>
        Exportar Reporte
      </button>

      <!-- Menú desplegable -->
      <mat-menu #menu="matMenu" class="exportar-menu">
        <!-- Filtros predefinidos -->
        <div class="menu-section">
          <div class="menu-title">Filtros Predefinidos</div>
                     @for (filtro of filtrosPredefinidos; track filtro.tipo) {
            <div class="filtro-item">
              <span class="filtro-desc">{{ filtro.descripcion }}</span>
              <div class="filtro-actions">
                <button
                  mat-icon-button
                  color="warn"
                  (click)="exportarPDF(filtro)"
                  matTooltip="Exportar PDF">
                  <mat-icon>picture_as_pdf</mat-icon>
                </button>
                <button
                  mat-icon-button
                  color="accent"
                  (click)="exportarExcel(filtro)"
                  matTooltip="Exportar Excel">
                  <mat-icon>table_chart</mat-icon>
                </button>
              </div>
            </div>
          }
        </div>

        <mat-divider></mat-divider>

        <!-- Exportación personalizada -->
        <div class="menu-section">
          <div class="menu-title">Exportación Personalizada</div>
          <div class="filtro-item">
            <span class="filtro-desc">Rango personalizado</span>
            <div class="filtro-actions">
              <button
                mat-icon-button
                color="warn"
                (click)="exportarPDFPersonalizado()"
                matTooltip="Exportar PDF">
                <mat-icon>picture_as_pdf</mat-icon>
              </button>
              <button
                mat-icon-button
                color="accent"
                (click)="exportarExcelPersonalizado()"
                matTooltip="Exportar Excel">
                <mat-icon>table_chart</mat-icon>
              </button>
            </div>
          </div>
        </div>
      </mat-menu>
    </div>
  `,
  styles: [`
    .exportar-container {
      display: flex;
      align-items: center;
    }

    .exportar-btn {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .exportar-menu {
      min-width: 300px;
    }

    .menu-section {
      padding: 8px 0;
    }

    .menu-title {
      font-weight: 600;
      color: #666;
      padding: 8px 16px;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .filtro-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 16px;
      transition: background-color 0.2s;
    }

    .filtro-item:hover {
      background-color: #f5f5f5;
    }

    .filtro-desc {
      font-size: 14px;
      color: #333;
    }

    .filtro-actions {
      display: flex;
      gap: 4px;
    }

    .filtro-actions button {
      width: 32px;
      height: 32px;
      line-height: 32px;
    }
  `]
})
export class ExportarReporteComponent {
  // Inputs
  readonly titulo = input.required<string>();
  readonly datos = input.required<any[]>();
  readonly columnas = input.required<any[]>();

  // Outputs
  readonly exportarPDFEvent = output<FiltroReporte | null>();
  readonly exportarExcelEvent = output<FiltroReporte | null>();

  constructor(private reportesService: ReportesService) {}

  // Filtros predefinidos
  get filtrosPredefinidos() {
    return this.reportesService.calcularFiltrosPredefinidos();
  }

  exportarPDF(filtro?: FiltroReporte): void {
    this.exportarPDFEvent.emit(filtro || null);
  }

  exportarExcel(filtro?: FiltroReporte): void {
    this.exportarExcelEvent.emit(filtro || null);
  }

  exportarPDFPersonalizado(): void {
    this.exportarPDFEvent.emit(null);
  }

  exportarExcelPersonalizado(): void {
    this.exportarExcelEvent.emit(null);
  }
}
