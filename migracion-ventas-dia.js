// Script de migración para mover datos de ventas del día
// de la colección 'gestion-contable' a 'ventas-dia'
//
// USO:
// 1. Asegúrate de tener Firebase CLI instalado: npm install -g firebase-tools
// 2. Inicia sesión: firebase login
// 3. Ejecuta: node migracion-ventas-dia.js

const admin = require('firebase-admin');

// Inicializar Firebase Admin (necesitarás el archivo de credenciales del servicio)
// Si no tienes el archivo, puedes obtenerlo desde la consola de Firebase:
// Project Settings > Service Accounts > Generate New Private Key

const serviceAccount = require('./serviceAccountKey.json'); // Necesitarás crear este archivo

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'contabilidad-artemediooriente'
});

const db = admin.firestore();

async function migrarVentasDia() {
  console.log('🚀 Iniciando migración de ventas del día...');

  try {
    // 1. Obtener todos los documentos de tipo 'venta-dia' de gestion-contable
    const ventasSnapshot = await db.collection('gestion-contable')
      .where('tipo', '==', 'venta-dia')
      .get();

    console.log(`📊 Encontrados ${ventasSnapshot.size} documentos de ventas del día`);

    if (ventasSnapshot.empty) {
      console.log('✅ No hay documentos para migrar');
      return;
    }

    // 2. Migrar cada documento a la nueva colección
    const batch = db.batch();
    let migrados = 0;
    let errores = 0;

    for (const doc of ventasSnapshot.docs) {
      try {
        const data = doc.data();

        // Crear nuevo documento en ventas-dia
        const nuevoDocRef = db.collection('ventas-dia').doc();
        batch.set(nuevoDocRef, {
          ...data,
          fechaCreacion: data.fechaCreacion || admin.firestore.FieldValue.serverTimestamp(),
          fechaActualizacion: admin.firestore.FieldValue.serverTimestamp()
        });

        // Marcar el documento original para eliminación
        batch.delete(doc.ref);

        migrados++;
        console.log(`✅ Migrado: ${data.nombreProducto} - ${data.fecha.toDate().toLocaleDateString()}`);

      } catch (error) {
        console.error(`❌ Error migrando documento ${doc.id}:`, error);
        errores++;
      }
    }

    // 3. Ejecutar la migración
    if (migrados > 0) {
      await batch.commit();
      console.log(`\n🎉 Migración completada exitosamente!`);
      console.log(`📈 Documentos migrados: ${migrados}`);
      console.log(`❌ Errores: ${errores}`);
      console.log(`🗑️  Documentos originales eliminados: ${migrados}`);
    } else {
      console.log('⚠️  No se migraron documentos');
    }

  } catch (error) {
    console.error('💥 Error durante la migración:', error);
  }
}

async function verificarMigracion() {
  console.log('\n🔍 Verificando migración...');

  try {
    // Contar documentos en gestion-contable de tipo venta-dia
    const contableSnapshot = await db.collection('gestion-contable')
      .where('tipo', '==', 'venta-dia')
      .get();

    // Contar documentos en ventas-dia
    const ventasSnapshot = await db.collection('ventas-dia').get();

    console.log(`📊 gestion-contable (tipo: venta-dia): ${contableSnapshot.size} documentos`);
    console.log(`📊 ventas-dia: ${ventasSnapshot.size} documentos`);

    if (contableSnapshot.size === 0 && ventasSnapshot.size > 0) {
      console.log('✅ Migración exitosa: Todos los datos están en la colección correcta');
    } else if (contableSnapshot.size > 0) {
      console.log('⚠️  Aún hay documentos de ventas en gestion-contable');
    } else {
      console.log('ℹ️  No hay documentos de ventas en ninguna colección');
    }

  } catch (error) {
    console.error('❌ Error verificando migración:', error);
  }
}

// Ejecutar migración
async function main() {
  console.log('🔄 Iniciando proceso de migración...\n');

  await migrarVentasDia();
  await verificarMigracion();

  console.log('\n🏁 Proceso completado');
  process.exit(0);
}

// Manejar errores no capturados
process.on('unhandledRejection', (error) => {
  console.error('💥 Error no manejado:', error);
  process.exit(1);
});

// Ejecutar si se llama directamente
if (require.main === module) {
  main();
}

module.exports = { migrarVentasDia, verificarMigracion };
