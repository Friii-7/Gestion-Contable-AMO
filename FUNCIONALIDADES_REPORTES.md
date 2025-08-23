# Funcionalidades de Reportes - Gestión Contabilidad AMO

## Descripción General

Se han implementado funcionalidades completas de exportación de reportes en PDF y Excel para todas las tablas del sistema, con opciones de filtrado por períodos predefinidos (diario, semanal, mensual) y personalizados.

## Características Implementadas

### 1. Exportación de Reportes
- **Formato PDF**: Generación de reportes en PDF con formato profesional
- **Formato Excel**: Exportación a Excel con estilos y formato
- **Filtros de Fecha**: Opciones predefinidas y personalizadas

### 2. Filtros Predefinidos
- **Hoy**: Reporte del día actual
- **Esta semana**: Reporte de lunes a domingo de la semana actual
- **Este mes**: Reporte del mes actual completo

### 3. Filtros Personalizados
- **Rango de fechas**: Selección manual de fechas de inicio y fin
- **Aplicación automática**: Los filtros se aplican automáticamente a los datos

### 4. Iconos de Visualización
- **Ver detalles**: Icono de ojo (👁️) para ver información completa de cada registro
- **Editar**: Icono de lápiz (✏️) para modificar registros
- **Eliminar**: Icono de papelera (🗑️) para eliminar registros

## Tablas con Funcionalidades

### 1. Tabla de Gestión Contable
- **Ubicación**: `/tabla-gestion-contable`
- **Datos exportados**:
  - Fecha de registro
  - Valor de ventas
  - Método de pago
  - Valor de pago
  - Gastos
  - Pago a Carlos
  - Total
  - Observaciones (venta y gasto)
  - Estado

### 2. Tabla de Ventas del Día
- **Ubicación**: `/tabla-ventas-dia`
- **Datos exportados**:
  - Fecha
  - Hora
  - Nombre del producto
  - Valor del producto

## Uso de las Funcionalidades

### Exportación de Reportes

1. **Acceso**: Cada tabla tiene un botón "Exportar Reporte" en la parte superior
2. **Menú desplegable**: Al hacer clic se abre un menú con opciones
3. **Filtros predefinidos**: Seleccionar período y formato (PDF/Excel)
4. **Filtro personalizado**: Para rangos de fecha específicos

### Visualización de Datos

1. **Ver detalles**: Hacer clic en el icono de ojo (👁️)
2. **Información mostrada**: Todos los campos del registro en formato legible
3. **Formato**: Ventana emergente con información organizada

## Dependencias Instaladas

- **jsPDF**: Generación de archivos PDF
- **jspdf-autotable**: Tablas en PDF
- **xlsx**: Generación de archivos Excel
- **file-saver**: Descarga de archivos

## Estructura de Archivos

```
src/app/
├── services/
│   └── reportes.service.ts          # Servicio principal de reportes
├── components/
│   ├── shared/
│   │   └── exportar-reporte/        # Componente compartido de exportación
│   ├── componente-tabla-editar-dialogo/
│   │   └── tabla-gestion-contable/  # Tabla con funcionalidades
│   └── ventas-dia/
│       └── tabla-ventas-dia/        # Tabla de ventas con funcionalidades
```

## Personalización

### Agregar Nuevas Tablas

1. Importar `ExportarReporteComponent` en el componente
2. Agregar `ExportarReporteComponent` a los imports
3. Definir `columnasReporte` con la estructura de datos
4. Implementar métodos `generarPDF()` y `generarExcel()`
5. Agregar botón de exportación en el HTML

### Modificar Columnas de Reporte

Editar el array `columnasReporte` en cada componente:

```typescript
readonly columnasReporte: ColumnaReporte[] = [
  { header: 'Título Columna', dataKey: 'nombreCampo', width: 25 },
  // ... más columnas
];
```

## Notas Técnicas

- **Change Detection**: Todos los componentes usan `OnPush` para mejor rendimiento
- **Signals**: Se utilizan signals de Angular para el estado reactivo
- **Standalone Components**: Componentes independientes sin NgModules
- **TypeScript Strict**: Código con tipado estricto para mayor seguridad

## Próximas Mejoras

- [ ] Filtros adicionales (por estado, método de pago, etc.)
- [ ] Plantillas personalizables de reportes
- [ ] Envío por email de reportes
- [ ] Programación automática de reportes
- [ ] Gráficos y estadísticas en los reportes
