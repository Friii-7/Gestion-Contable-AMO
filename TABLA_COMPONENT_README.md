# Componente de Tabla para Gestión Contable

## Descripción
Este componente (`TablaGestionContableComponent`) permite visualizar todos los registros contables guardados en Firebase Firestore en formato de tabla.

## Características

### 📊 **Estadísticas en Tiempo Real**
- **Total de Registros**: Número total de registros en la base de datos
- **Total de Ventas**: Suma de todas las ventas registradas
- **Total de Gastos**: Suma de gastos operativos + pagos a Carlos
- **Balance Total**: Diferencia entre ventas y gastos totales

### 🗂️ **Tabla de Datos**
- **Fecha de Registro**: Formato dd/MM/yyyy
- **Valor de Ventas**: Formateado en pesos colombianos
- **Método de Pago**: Con badges de colores diferenciados
  - 🔵 Consignación
  - 🟢 Entrega a Reza
  - 🔵 Efectivo
- **Valor del Pago**: Monto pagado
- **Gastos Operativos**: Gastos sin incluir pago a Carlos
- **Pago a Carlos**: Indicador Sí/No con badges
- **Total**: Balance del día (verde si positivo, rojo si negativo)
- **Estado**: Estado del registro
- **Acciones**: Botones para ver detalles y editar

### 📄 **Paginación**
- Carga inicial de 20 registros
- Botones de "Anterior" y "Siguiente"
- Indicador de registros mostrados
- Carga lazy de datos adicionales

### 🔄 **Funcionalidades**
- **Actualizar**: Botón para recargar datos
- **Nuevo Registro**: Enlace al formulario de creación
- **Ordenamiento**: Por fecha (más reciente primero)
- **Responsive**: Adaptable a diferentes tamaños de pantalla

## Navegación

### Ruta
```
/tabla-gestion-contable
```

### Enlaces
- **Desde el formulario**: Botón "Ver Tabla de Registros"
- **Desde la tabla**: Botón "Nuevo Registro" para volver al formulario

## Uso

### 1. Acceder a la Tabla
- Navegar a `/tabla-gestion-contable`
- O hacer clic en "Ver Tabla de Registros" desde el formulario

### 2. Visualizar Datos
- Los datos se cargan automáticamente al entrar
- Las estadísticas se calculan en tiempo real
- La tabla muestra los registros más recientes primero

### 3. Navegar entre Páginas
- Usar botones "Anterior" y "Siguiente"
- Los datos se cargan incrementalmente

### 4. Actualizar Datos
- Hacer clic en "Actualizar" para recargar
- Útil después de crear nuevos registros

## Estructura de Datos

### Interface GestionContable
```typescript
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
```

### Métodos de Pago
- `consignacion`: Consignación bancaria
- `entrega_reza`: Entrega directa a Reza
- `efectivo`: Pago en efectivo

## Dependencias

### Angular Material
- `MatTableModule`: Para la tabla de datos
- `MatPaginatorModule`: Para la paginación
- `MatSortModule`: Para el ordenamiento
- `MatButtonModule`: Para los botones
- `MatIconModule`: Para los iconos
- `MatCardModule`: Para las tarjetas
- `MatProgressSpinnerModule`: Para el spinner de carga
- `MatChipsModule`: Para los badges
- `MatTooltipModule`: Para los tooltips
- `MatSnackBarModule`: Para las notificaciones

### Firebase
- `Firestore`: Para acceder a la base de datos
- `collection`, `query`, `orderBy`, `limit`, `startAfter`, `getDocs`

## Estilos

### CSS Personalizado
- Tabla responsive con scroll horizontal
- Badges de colores para métodos de pago y estados
- Hover effects en las filas
- Diseño adaptable a dispositivos móviles

### Bootstrap
- Sistema de grid responsive
- Clases de utilidad para espaciado y colores
- Componentes de tarjetas para estadísticas

## Notas Técnicas

### Performance
- Carga lazy de datos (20 registros por página)
- Uso de signals para estado reactivo
- ChangeDetectionStrategy.OnPush para optimización

### Seguridad
- Validación de datos en el frontend
- Manejo de errores con try-catch
- Notificaciones de usuario para feedback

### Mantenibilidad
- Código modular y bien estructurado
- Uso de interfaces TypeScript
- Separación de responsabilidades
- Comentarios explicativos en el código

## Próximas Mejoras

### Funcionalidades Planificadas
- [ ] Filtros por fecha, método de pago, estado
- [ ] Búsqueda de texto en observaciones
- [ ] Exportación a Excel/PDF
- [ ] Edición inline de registros
- [ ] Modal de detalles completos
- [ ] Gráficos y reportes estadísticos

### Optimizaciones
- [ ] Cache de páginas para navegación más fluida
- [ ] Virtual scrolling para grandes volúmenes de datos
- [ ] Compresión de datos para mejor performance
- [ ] Offline support con Service Workers

