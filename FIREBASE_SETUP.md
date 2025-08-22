# 🔥 Configuración de Firebase para Contabilidad Arte Medio Oriente

## 📋 Pasos para Configurar Firebase

### 1. Crear Proyecto en Firebase Console
1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Haz clic en "Crear un proyecto"
3. Nombre del proyecto: `contabilidad-artemediooriente`
4. ID del proyecto: `contabilidad-artemediooriente`
5. Número del proyecto: `860681294783`

### 2. Habilitar Firestore Database
1. En el panel izquierdo, haz clic en "Firestore Database"
2. Haz clic en "Crear base de datos"
3. Selecciona "Comenzar en modo de prueba" (se puede cambiar después)
4. Selecciona la ubicación más cercana (ej: `us-central1`)

### 3. Obtener Configuración de la App
1. En el panel izquierdo, haz clic en el ícono de configuración ⚙️
2. Selecciona "Configuración del proyecto"
3. En la pestaña "General", desplázate hacia abajo
4. En "Tus apps", haz clic en "Agregar app" y selecciona "Web"
5. Dale un nombre a la app (ej: "contabilidad-web")
6. Copia la configuración que aparece

### 4. Actualizar Archivos de Configuración

#### Actualizar `src/environments/environment.ts`:
```typescript
export const environment = {
  production: false,
  firebase: {
    apiKey: "TU_API_KEY_REAL",
    authDomain: "contabilidad-artemediooriente.firebaseapp.com",
    projectId: "contabilidad-artemediooriente",
    storageBucket: "contabilidad-artemediooriente.appspot.com",
    messagingSenderId: "860681294783",
    appId: "TU_APP_ID_REAL"
  }
};
```

#### Actualizar `src/environments/environment.prod.ts`:
```typescript
export const environment = {
  production: true,
  firebase: {
    apiKey: "TU_API_KEY_REAL",
    authDomain: "contabilidad-artemediooriente.firebaseapp.com",
    projectId: "contabilidad-artemediooriente",
    storageBucket: "contabilidad-artemediooriente.appspot.com",
    messagingSenderId: "860681294783",
    appId: "TU_APP_ID_REAL"
  }
};
```

### 5. Instalar Firebase CLI (Opcional)
```bash
npm install -g firebase-tools
firebase login
firebase init
```

### 6. Desplegar Reglas de Firestore
```bash
firebase deploy --only firestore:rules
```

### 7. Desplegar Índices
```bash
firebase deploy --only firestore:indexes
```

## 🚀 Funcionalidades Implementadas

### ✅ **Guardado en Firebase**
- Los registros se guardan en la colección `registros_contables`
- Cada registro incluye timestamps de creación y actualización
- ID único generado automáticamente por Firebase

### ✅ **Operaciones CRUD**
- **Crear**: Nuevos registros se guardan en Firestore
- **Leer**: Los registros se cargan desde Firebase
- **Actualizar**: Los registros se pueden modificar
- **Eliminar**: Los registros se marcan como eliminados (soft delete)

### ✅ **Filtros y Consultas**
- Filtros por fecha, método de pago y estado
- Consultas optimizadas con índices de Firestore
- Fallback a filtros locales si Firebase falla

### ✅ **Persistencia Offline**
- Firestore mantiene datos en caché local
- Funciona sin conexión a internet
- Sincronización automática cuando hay conexión

## 🔒 Seguridad

### Reglas Actuales (Desarrollo)
```javascript
match /registros_contables/{document} {
  allow read, write: if true; // Acceso total
}
```

### Reglas Recomendadas (Producción)
```javascript
match /registros_contables/{document} {
  allow read, write: if request.auth != null; // Solo usuarios autenticados
}
```

## 📱 Estructura de Datos

### Colección: `registros_contables`
```typescript
interface RegistroContable {
  id?: string;                    // ID generado por Firebase
  fechaRegistro: Date;            // Fecha del registro
  valorVentas: number;            // Monto de ventas
  observacionVenta: string;       // Descripción de ventas
  metodoPago: string;             // Forma de pago
  gastos: number;                 // Gastos operativos
  observacionGasto: string;       // Descripción de gastos
  pagoDiaCarlos: boolean;         // Si incluye pago a Carlos
  total: number;                  // Total neto (ventas - gastos)
  estado: 'activo' | 'eliminado'; // Estado del registro
  fechaCreacion: Date;            // Timestamp de creación
  fechaActualizacion: Date;       // Timestamp de última modificación
}
```

## 🧪 Pruebas

### 1. Probar Guardado
1. Llena el formulario
2. Haz clic en "Guardar Registro"
3. Verifica en Firebase Console que aparezca el registro

### 2. Probar Carga
1. Recarga la página
2. Los registros deben cargar desde Firebase
3. Verifica que aparezcan en la tabla

### 3. Probar Filtros
1. Usa los filtros de fecha y estado
2. Verifica que las consultas funcionen
3. Revisa la consola para logs de Firebase

## 🚨 Solución de Problemas

### Error: "Firebase App named '[DEFAULT]' already exists"
- Asegúrate de que Firebase solo se inicialice una vez
- Verifica que no haya múltiples imports del archivo de configuración

### Error: "Missing or insufficient permissions"
- Verifica las reglas de Firestore
- Asegúrate de que la colección `registros_contables` esté creada

### Error: "Network request failed"
- Verifica la conexión a internet
- Revisa que la configuración de Firebase sea correcta
- Los datos se mantienen en caché local como fallback

## 📞 Soporte

Si tienes problemas con la configuración:
1. Verifica que todos los archivos estén actualizados
2. Revisa la consola del navegador para errores
3. Verifica la configuración en Firebase Console
4. Asegúrate de que las reglas de Firestore permitan acceso

---

**¡Con Firebase configurado, tu aplicación ahora guarda datos reales en la nube! 🎉**
