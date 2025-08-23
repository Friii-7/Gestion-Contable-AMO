import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent {
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

  protected readonly stats = signal([
    { label: 'Registros Contables', value: '150+', icon: '📊' },
    { label: 'Ventas del Mes', value: '$25,000', icon: '💰' },
    { label: 'Transacciones', value: '89', icon: '🔄' },
    { label: 'Reportes', value: '12', icon: '📋' }
  ]);
}
