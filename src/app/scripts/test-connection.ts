// Script per testare la connessione al database

import clientPromise from "@/lib/mongodb"

export async function testDatabaseConnection() {
  try {
    console.log("🔌 Testando connessione al database...")

    const client = await clientPromise
    const db = client.db("hotel_management")

    // Test di connessione
    await db.admin().ping()
    console.log("✅ Connessione al database riuscita!")

    // Lista delle collections esistenti
    const collections = await db.listCollections().toArray()
    console.log(
      "📋 Collections trovate:",
      collections.map((c) => c.name),
    )

    // Test di scrittura/lettura
    const testCollection = db.collection("connection_test")

    // Inserisci un documento di test
    const testDoc = {
      test: true,
      timestamp: new Date(),
      message: "Test di connessione riuscito",
    }

    const insertResult = await testCollection.insertOne(testDoc)
    console.log("✅ Test di scrittura riuscito, ID:", insertResult.insertedId)

    // Leggi il documento di test
    const foundDoc = await testCollection.findOne({ _id: insertResult.insertedId })
    console.log("✅ Test di lettura riuscito:", foundDoc?.message)

    // Pulisci il documento di test
    await testCollection.deleteOne({ _id: insertResult.insertedId })
    console.log("🧹 Documento di test rimosso")

    return {
      success: true,
      message: "Connessione al database funzionante",
      collections: collections.map((c) => c.name),
    }
  } catch (error) {
    console.error("❌ Errore di connessione al database:", error)
    return {
      success: false,
      message: `Errore: ${error instanceof Error ? error.message : "Errore sconosciuto"}`,
      collections: [],
    }
  }
}

// Esegui se chiamato direttamente
if (require.main === module) {
  testDatabaseConnection().then((result) => {
    console.log("Risultato test:", result)
    process.exit(result.success ? 0 : 1)
  })
}
