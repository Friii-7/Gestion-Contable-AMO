# Configuración de Firestore para Ventas del Día

## Problema del Índice

El error que estás viendo indica que Firestore necesita un índice compuesto para la consulta:

```typescript
const q = query(
  ventasRef,
  where('tipo', '==', 'venta-dia'),
  orderBy('fecha', 'desc')
);
```

## Solución: Crear Índice Compuesto

### 1. Índice Automático (Recomendado)

Firebase te proporciona un enlace directo para crear el índice. Haz clic en este enlace:

```
https://console.firebase.google.com/v1/r/project/contabilidad-artemediooriente/firestore/indexes?create_composite=CmZwcm9qZWN0cy9jb250YWJpbGlkYWQtYXJ0ZW1lZGlvb3JpZW50ZS9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvZ2VzdGlvbi1jb250YWJsZS9pbmRleGVzL18QARoICgR0aXBvEAEaCQoFZmVjaGEQAhoMCghfX25hbWVfXx
```

### 2. Configuración Manual

Si prefieres configurarlo manualmente:

1. Ve a [Firebase Console](https://console.firebase.google.com)
2. Selecciona tu proyecto `contabilidad-artemediooriente`
3. Ve a **Firestore Database** → **Índices**
4. Haz clic en **Crear índice**
5. Configura:
   - **Colección**: `gestion-contable`
   - **Campos**:
     - `tipo` (Ascendente)
     - `fecha` (Descendente)
   - **Ámbito de consulta**: Colección

### 3. Despliegue con Firebase CLI

Si tienes Firebase CLI instalado:

```bash
# Desplegar índices
firebase deploy --only firestore:indexes

# Desplegar reglas
firebase deploy --only firestore:rules
```

## Estructura de Datos Esperada

Cada documento en `gestion-contable` debe tener esta estructura:

```typescript
{
  tipo: 'venta-dia',
  fecha: Timestamp,
  hora: string,
  nombreProducto: string,
  valorProducto: number,
  fechaCreacion: Timestamp,
  fechaActualizacion: Timestamp
}
```

## Reglas de Seguridad

Las reglas están configuradas para permitir:

- **Lectura**: Solo documentos de tipo `venta-dia`
- **Escritura**: Solo documentos de tipo `venta-dia`
- **Actualización**: Solo documentos existentes de tipo `venta-dia`
- **Eliminación**: Solo documentos de tipo `venta-dia`

## Verificación

Después de crear el índice:

1. Espera unos minutos a que se construya
2. El estado cambiará de "Construyendo" a "Habilitado"
3. Tu componente debería funcionar sin errores

## Solución Alternativa (Temporal)

Si necesitas una solución rápida mientras se construye el índice, puedes modificar temporalmente la consulta:

```typescript
// Sin ordenamiento (temporal)
const q = query(
  ventasRef,
  where('tipo', '==', 'venta-dia')
);

// O solo con ordenamiento (temporal)
const q = query(
  ventasRef,
  orderBy('fecha', 'desc')
);
```

**Nota**: La primera opción es más segura ya que no requiere índice compuesto.
