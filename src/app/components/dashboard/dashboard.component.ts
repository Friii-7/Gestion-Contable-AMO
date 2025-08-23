import { Component, signal, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../../services/dashboard.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit {
  private readonly dashboardService = inject(DashboardService);

  protected readonly dashboardCards = signal([
    {
      title: 'Gestión Contable',
      description: 'Administra la contabilidad general del negocio',
      icon: '📊',
      path: '/gestion-contable',
      color: 'primary'
    },
    {
      title: 'Ventas del Día',
      description: 'Registra y visualiza las ventas diarias',
      icon: '💰',
      path: '/ventas-dia',
      color: 'success'
    },
    {
      title: 'Tabla Ventas',
      description: 'Consulta el historial de ventas',
      icon: '📋',
      path: '/tabla-ventas-dia',
      color: 'info'
    },
    {
      title: 'Tabla Contable',
      description: 'Revisa los registros contables',
      icon: '📈',
      path: '/tabla-gestion-contable',
      color: 'warning'
    }
  ]);

  // Usar el servicio para obtener datos reales
  protected readonly stats = this.dashboardService.stats;
  protected readonly ventasRecientes = this.dashboardService.ventasRecientes;
  protected readonly contabilidadReciente = this.dashboardService.contabilidadReciente;
  protected readonly totalVentasHoy = this.dashboardService.totalVentasHoy;
  protected readonly totalContableHoy = this.dashboardService.totalContableHoy;

  // Estado de carga
  protected readonly isLoading = signal(true);

  async ngOnInit(): Promise<void> {
    try {
      this.isLoading.set(true);
      await this.dashboardService.cargarDashboard();
    } catch (error) {
      console.error('Error inicializando dashboard:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Actualiza los datos del dashboard
   */
  async actualizarDatos(): Promise<void> {
    try {
      this.isLoading.set(true);
      await this.dashboardService.actualizarDashboard();
    } catch (error) {
      console.error('Error actualizando dashboard:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Formatea un número como moneda colombiana
   */
  protected formatearMoneda(valor: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(valor);
  }

  /**
   * Formatea una fecha de manera legible
   */
  protected formatearFecha(fecha: Date): string {
    return fecha.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
}
