# Instrucciones de Deploy - Gestion Contabilidad AMO

## Problema Identificado
La tabla de ventas funciona en local pero no muestra datos en producción.

## Soluciones Implementadas

### 1. Configuración de Environment
- ✅ Configurado `environment.ts` para desarrollo
- ✅ Configurado `environment.prod.ts` para producción
- ✅ Firebase configurado en ambos environments

### 2. Configuración de Firebase
- ✅ App config actualizado para usar environment
- ✅ Reglas de Firestore configuradas
- ✅ Índices creados para la colección `ventas-dia`

### 3. Mejoras en el Componente
- ✅ Logging mejorado para debug
- ✅ Verificación de conectividad con Firebase
- ✅ Manejo de errores mejorado

## Pasos para Deploy

### Opción 1: Deploy a Netlify
```bash
# Build para Netlify
npm run build:netlify

# El build se genera en dist/gestion-contabilidad-amo/browser
# Subir esta carpeta a Netlify
```

### Opción 2: Deploy a Firebase Hosting
```bash
# Instalar Firebase CLI si no está instalado
npm install -g firebase-tools

# Login a Firebase
firebase login

# Build de producción
npm run build:prod

# Deploy
firebase deploy
```

### Opción 3: Deploy Manual
```bash
# Build de producción
npm run build:prod

# Subir la carpeta dist/gestion-contabilidad-amo/browser al hosting
```

## Verificación Post-Deploy

### 1. Abrir la Consola del Navegador
- Verificar que no hay errores de JavaScript
- Buscar logs de "Verificando conexión con Firebase"
- Verificar que la configuración de Firebase se está cargando

### 2. Verificar Reglas de Firestore
- Ir a Firebase Console > Firestore > Rules
- Verificar que las reglas permiten lectura de `ventas-dia`
- Las reglas actuales permiten acceso completo (temporal)

### 3. Verificar Índices
- Ir a Firebase Console > Firestore > Indexes
- Verificar que existe el índice para `ventas-dia` con campo `fecha` DESC

### 4. Verificar Datos
- Ir a Firebase Console > Firestore > Data
- Verificar que la colección `ventas-dia` tiene documentos
- Verificar que los documentos tienen la estructura correcta

## Estructura de Datos Esperada

```typescript
interface VentaDia {
  id?: string;
  fecha: Date;           // Timestamp de Firebase
  hora: string;          // "14:30"
  nombreProducto: string; // "Producto A"
  valorProducto: number;  // 50000
  tipo: 'venta-dia';     // Constante
  fechaCreacion?: Date;  // Timestamp de Firebase
  fechaActualizacion?: Date; // Timestamp de Firebase
}
```

## Troubleshooting

### Si no se muestran datos:
1. Verificar consola del navegador para errores
2. Verificar que Firebase está configurado correctamente
3. Verificar reglas de Firestore
4. Verificar que existen documentos en la colección
5. Verificar que los índices están creados

### Si hay errores de CORS:
1. Verificar configuración de Firebase
2. Verificar que el dominio está autorizado en Firebase Console

### Si hay errores de autenticación:
1. Verificar que las reglas de Firestore permiten acceso
2. Verificar que la API key es correcta

## Comandos de Debug

```bash
# Ver logs en tiempo real
npm run start

# Build con source maps para debug
npm run build:development

# Verificar configuración de Firebase
firebase projects:list
firebase use contabilidad-artemediooriente
```

## Contacto
Si persisten los problemas, revisar:
1. Logs de la consola del navegador
2. Logs de Firebase Console
3. Configuración de environment
4. Reglas de Firestore
