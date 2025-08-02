import { connectToDatabase } from "@/lib/mongodb"

async function resetDatabase() {
  try {
    console.log("🔄 Avvio reset completo del database...")

    const { db } = await connectToDatabase()

    // =====================================================
    // RESET CAMERE
    // =====================================================
    console.log("🏨 Reset camere...")

    // Svuota tutti gli account delle camere
    const roomAccountsResult = await db.collection("room_accounts").deleteMany({})
    console.log(`✅ Eliminati ${roomAccountsResult.deletedCount} account camere`)

    // =====================================================
    // RESET RISTORANTE
    // =====================================================
    console.log("🍽️ Reset ristorante...")

    // Reset tutti i tavoli a stato vuoto
    const tablesResult = await db.collection("restaurant_tables").updateMany(
      {},
      {
        $set: {
          assignedRoom: 0,
          orderItems: [],
          status: "disponibile",
          orderTotal: 0.0,
          updatedAt: new Date(),
        },
      },
    )
    console.log(`✅ Reset ${tablesResult.modifiedCount} tavoli`)

    // =====================================================
    // RESET ARCHIVIO INCASSI
    // =====================================================
    console.log("💰 Reset archivio incassi...")

    const revenueResult = await db.collection("daily_revenue").deleteMany({})
    console.log(`✅ Eliminati ${revenueResult.deletedCount} record incassi`)

    // =====================================================
    // RESET INVENTARIO COMPLETO
    // =====================================================
    console.log("📦 Reset inventario completo...")

    // Elimina tutti i prodotti
    const productsResult = await db.collection("products").deleteMany({})
    console.log(`✅ Eliminati ${productsResult.deletedCount} prodotti`)

    // Elimina tutte le categorie
    const categoriesResult = await db.collection("categories").deleteMany({})
    console.log(`✅ Eliminate ${categoriesResult.deletedCount} categorie`)

    // =====================================================
    // RIEPILOGO
    // =====================================================
    console.log("\n🎉 RESET COMPLETATO!")
    console.log("=".repeat(50))
    console.log("📊 RIEPILOGO:")
    console.log(`   • ${roomAccountsResult.deletedCount} account camere eliminati`)
    console.log(`   • ${tablesResult.modifiedCount} tavoli resettati`)
    console.log(`   • ${revenueResult.deletedCount} record incassi eliminati`)
    console.log(`   • ${productsResult.deletedCount} prodotti eliminati`)
    console.log(`   • ${categoriesResult.deletedCount} categorie eliminate`)
    console.log("=".repeat(50))
    console.log("🚀 Il database è stato completamente azzerato!")
    console.log("📝 Solo la struttura delle collezioni è rimasta intatta")
  } catch (error) {
    console.error("❌ Errore durante il reset:", error)
    throw error
  }
}

// Esegui solo se chiamato direttamente
if (require.main === module) {
  resetDatabase()
    .then(() => {
      console.log("✅ Reset completato con successo")
      process.exit(0)
    })
    .catch((error) => {
      console.error("❌ Reset fallito:", error)
      process.exit(1)
    })
}

export { resetDatabase }
