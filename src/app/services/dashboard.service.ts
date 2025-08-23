import { Injectable, inject } from '@angular/core';
import { Firestore, collection, getDocs, query, where, orderBy, limit } from '@angular/fire/firestore';
import { signal, computed } from '@angular/core';

export interface DashboardStats {
  registrosContables: number;
  ventasMes: number;
  transacciones: number;
  reportes: number;
}

export interface VentaDia {
  id?: string;
  fecha: Date;
  valorProducto: number;
  tipo: string;
}

export interface GestionContable {
  id?: string;
  fechaRegistro: Date;
  valorVentas: number;
  gastos: number;
  total: number;
  estado: string;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly firestore = inject(Firestore);

  // Signals para los datos del dashboard
  private readonly _stats = signal<DashboardStats>({
    registrosContables: 0,
    ventasMes: 0,
    transacciones: 0,
    reportes: 0
  });

  private readonly _ventasRecientes = signal<VentaDia[]>([]);
  private readonly _contabilidadReciente = signal<GestionContable[]>([]);

  // Signals de solo lectura
  readonly stats = this._stats.asReadonly();
  readonly ventasRecientes = this._ventasRecientes.asReadonly();
  readonly contabilidadReciente = this._contabilidadReciente.asReadonly();

  // Computed values
  readonly totalVentasHoy = computed(() => {
    const ventas = this._ventasRecientes();
    return ventas.reduce((total, venta) => total + venta.valorProducto, 0);
  });

  readonly totalContableHoy = computed(() => {
    const contable = this._contabilidadReciente();
    return contable.reduce((total, item) => total + item.total, 0);
  });

  /**
   * Carga todos los datos del dashboard
   */
  async cargarDashboard(): Promise<void> {
    try {
      await Promise.all([
        this.cargarEstadisticas(),
        this.cargarVentasRecientes(),
        this.cargarContabilidadReciente()
      ]);
    } catch (error) {
      console.error('Error cargando dashboard:', error);
    }
  }

  /**
   * Carga las estadísticas generales
   */
  private async cargarEstadisticas(): Promise<void> {
    try {
      // Obtener registros contables
      const contableRef = collection(this.firestore, 'gestion-contable');
      const contableSnapshot = await getDocs(contableRef);
      const registrosContables = contableSnapshot.size;

      console.log('Registros contables encontrados:', registrosContables);

      // Obtener ventas del mes
      const hoy = new Date();
      const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0, 23, 59, 59, 999);

      console.log('Rango del mes:', inicioMes.toISOString(), 'a', finMes.toISOString());

      const ventasRef = collection(this.firestore, 'ventas-dia');
      const ventasQuery = query(
        ventasRef,
        where('fecha', '>=', inicioMes),
        where('fecha', '<=', finMes)
      );
      const ventasSnapshot = await getDocs(ventasQuery);

      console.log('Documentos de ventas del mes:', ventasSnapshot.docs.length);

      const ventasMes = ventasSnapshot.docs.reduce((total, doc) => {
        const data = doc.data();
        const valor = data['valorProducto'] || 0;
        console.log('Venta encontrada:', data, 'Valor:', valor);
        return total + valor;
      }, 0);

      console.log('Total ventas del mes:', ventasMes);

      // Calcular transacciones (ventas + contable del día)
      const inicioDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 0, 0, 0, 0);
      const finDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59, 59, 999);

      const ventasHoyQuery = query(
        ventasRef,
        where('fecha', '>=', inicioDia),
        where('fecha', '<=', finDia)
      );
      const ventasHoySnapshot = await getDocs(ventasHoyQuery);

      const contableHoyQuery = query(
        contableRef,
        where('fechaRegistro', '>=', inicioDia),
        where('fechaRegistro', '<=', finDia)
      );
      const contableHoySnapshot = await getDocs(contableHoyQuery);

      const transacciones = ventasHoySnapshot.size + contableHoySnapshot.size;

      // Actualizar stats con datos reales
      this._stats.set({
        registrosContables,
        ventasMes,
        transacciones,
        reportes: Math.ceil(registrosContables / 10) // Simular reportes basados en registros
      });

      console.log('Stats actualizados:', {
        registrosContables,
        ventasMes,
        transacciones,
        reportes: Math.ceil(registrosContables / 10)
      });

    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  }

  /**
   * Carga las ventas más recientes
   */
  private async cargarVentasRecientes(): Promise<void> {
    try {
      const ventasRef = collection(this.firestore, 'ventas-dia');
      const ventasQuery = query(
        ventasRef,
        orderBy('fecha', 'desc'),
        limit(5)
      );

      const snapshot = await getDocs(ventasQuery);
      const ventas: VentaDia[] = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        ventas.push({
          id: doc.id,
          fecha: data['fecha']?.toDate() || new Date(),
          valorProducto: data['valorProducto'] || 0,
          tipo: data['tipo'] || 'venta-dia'
        });
      });

      this._ventasRecientes.set(ventas);
    } catch (error) {
      console.error('Error cargando ventas recientes:', error);
    }
  }

  /**
   * Carga la contabilidad más reciente
   */
  private async cargarContabilidadReciente(): Promise<void> {
    try {
      const contableRef = collection(this.firestore, 'gestion-contable');
      const contableQuery = query(
        contableRef,
        orderBy('fechaRegistro', 'desc'),
        limit(5)
      );

      const snapshot = await getDocs(contableQuery);
      const contable: GestionContable[] = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        contable.push({
          id: doc.id,
          fechaRegistro: data['fechaRegistro']?.toDate() || new Date(),
          valorVentas: data['valorVentas'] || 0,
          gastos: data['gastos'] || 0,
          total: data['total'] || 0,
          estado: data['estado'] || 'pendiente'
        });
      });

      this._contabilidadReciente.set(contable);
    } catch (error) {
      console.error('Error cargando contabilidad reciente:', error);
    }
  }

  /**
   * Actualiza los datos del dashboard
   */
  async actualizarDashboard(): Promise<void> {
    await this.cargarDashboard();
  }
}
