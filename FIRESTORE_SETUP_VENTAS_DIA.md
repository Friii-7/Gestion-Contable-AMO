# Configuración de Firestore para Ventas del Día

## Problema Actual
El componente de ventas del día está experimentando errores de permisos porque las reglas de Firestore no están configuradas para la colección `ventas-dia`.

## Solución Temporal
Actualmente, el componente está guardando los datos en la colección `gestion-contable` que ya tiene permisos configurados.

## Solución Permanente

### Opción 1: Actualizar las reglas de Firestore (Recomendado)

1. **Editar el archivo `firestore.rules`**:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Reglas para la colección de gestión contable
    match /gestion-contable/{document} {
      allow read, write: if true; // Temporalmente permitir todo acceso
    }
    
    // Reglas para la colección de ventas del día
    match /ventas-dia/{document} {
      allow read, write: if true; // Temporalmente permitir todo acceso
      // En producción, agregar autenticación:
      // allow read, write: if request.auth != null;
    }
    
    // Otras colecciones...
  }
}
```

2. **Desplegar las reglas**:
```bash
firebase deploy --only firestore:rules
```

### Opción 2: Usar la colección existente (Actual)

Si prefieres mantener todo en la colección `gestion-contable`, el componente ya está configurado para esto. Los registros de ventas del día se distinguirán por el campo `tipo: 'venta-dia'`.

## Estructura de Datos

### Colección: gestion-contable
```typescript
{
  fecha: Date,
  hora: string,
  nombreProducto: string,
  valorProducto: number,
  tipo: 'venta-dia',
  fechaCreacion: Date,
  fechaActualizacion: Date
}
```

### Colección: ventas-dia (cuando se configure)
```typescript
{
  fecha: Date,
  hora: string,
  nombreProducto: string,
  valorProducto: number,
  fechaCreacion: Date,
  fechaActualizacion: Date
}
```

## Pasos para Implementar la Solución Permanente

1. **Configurar las reglas de Firestore** (Opción 1)
2. **Cambiar la colección en el componente**:
   ```typescript
   // Cambiar de:
   docRef = await addDoc(collection(this.firestore, 'gestion-contable'), payload);
   
   // A:
   docRef = await addDoc(collection(this.firestore, 'ventas-dia'), payload);
   ```
3. **Remover el campo `tipo`** de la interfaz si no es necesario
4. **Probar el funcionamiento**

## Verificación

Para verificar que las reglas funcionen:

1. **Probar en el simulador de Firestore**:
   - Ir a Firebase Console > Firestore > Rules
   - Usar el simulador para probar operaciones de lectura/escritura

2. **Probar en la aplicación**:
   - Navegar a `/ventas-dia`
   - Completar y enviar el formulario
   - Verificar que no aparezcan errores de permisos

## Notas de Seguridad

- **Desarrollo**: `allow read, write: if true` permite acceso total
- **Producción**: Cambiar a `allow read, write: if request.auth != null`
- **Personalización**: Agregar reglas específicas según los requisitos del negocio

## Comandos Útiles

```bash
# Ver estado de Firebase
firebase status

# Desplegar solo las reglas
firebase deploy --only firestore:rules

# Desplegar todo
firebase deploy

# Ver logs
firebase functions:log
```
