# Componente Tabla de Ventas del Día

## Descripción
Componente independiente para mostrar, editar y eliminar ventas del día registradas en Firestore.

## Características
- **Visualización**: Tabla responsive con todas las ventas del día
- **Edición**: Formulario inline para modificar ventas existentes
- **Eliminación**: Confirmación antes de eliminar ventas
- **Resumen**: Estadísticas de total de ventas y valor total
- **Ordenamiento**: Columnas ordenables por fecha, hora, producto y valor
- **Tiempo real**: Actualización automática usando Firestore onSnapshot

## Funcionalidades

### 1. Tabla de Ventas
- Muestra fecha, hora, producto y valor de cada venta
- Columnas ordenables
- Diseño responsive para móviles

### 2. Edición de Ventas
- Formulario inline que aparece al hacer clic en editar
- Validación de campos requeridos
- Actualización en tiempo real en Firestore

### 3. Eliminación de Ventas
- Confirmación antes de eliminar
- Eliminación permanente de la base de datos

### 4. Estadísticas
- Total de ventas registradas
- Valor total de todas las ventas
- Actualización automática

## Uso

```typescript
import { TablaVentasDiaComponent } from './components/ventas-dia/tabla-ventas-dia';

// En tu componente o ruta
@Component({
  selector: 'app-mi-componente',
  standalone: true,
  imports: [TablaVentasDiaComponent],
  template: '<app-tabla-ventas-dia></app-tabla-ventas-dia>'
})
```

## Dependencias
- Angular Material (tabla, formularios, botones, iconos)
- Angular Fire (Firestore)
- Angular Forms (Reactive Forms)
- Angular Signals (estado del componente)

## Estructura de Datos
```typescript
interface VentaDiaTableItem {
  id: string;
  fecha: Date;
  hora: string;
  nombreProducto: string;
  valorProducto: number;
  tipo: 'venta-dia';
  fechaCreacion: Date;
  fechaActualizacion: Date;
}
```

## Estilos
- Diseño Material Design
- Responsive para todos los dispositivos
- Colores consistentes con el tema de la aplicación
- Animaciones suaves y hover effects

## Notas Técnicas
- Usa `ChangeDetectionStrategy.OnPush` para mejor rendimiento
- Implementa `OnDestroy` para limpiar suscripciones de Firestore
- Manejo de errores con MatSnackBar
- Formateo de moneda en pesos colombianos (COP)
