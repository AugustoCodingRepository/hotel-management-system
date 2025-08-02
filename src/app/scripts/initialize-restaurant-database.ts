import { MongoClient } from "mongodb"

const uri = process.env.MONGODB_URI!

if (!uri) {
  console.error("❌ MONGODB_URI non trovato nelle variabili d'ambiente")
  console.error("💡 Assicurati di avere il file .env.local con:")
  console.error("   MONGODB_URI=mongodb://localhost:27017/hotel_management")
  process.exit(1)
}

async function initializeRestaurantDatabase() {
  const client = new MongoClient(uri)

  try {
    console.log("🔗 Connessione a MongoDB...")
    await client.connect()

    const db = client.db("hotel_management")

    // =====================================================
    // CREAZIONE COLLEZIONI
    // =====================================================

    console.log("📋 Creazione collezioni...")

    // Collezione tavoli ristorante
    try {
      await db.createCollection("restaurant_tables")
      console.log("✅ Collezione 'restaurant_tables' creata")
    } catch (error: any) {
      if (error.code === 48) {
        console.log("ℹ️ Collezione 'restaurant_tables' già esistente")
      } else {
        throw error
      }
    }

    // Collezione incassi giornalieri
    try {
      await db.createCollection("daily_revenue")
      console.log("✅ Collezione 'daily_revenue' creata")
    } catch (error: any) {
      if (error.code === 48) {
        console.log("ℹ️ Collezione 'daily_revenue' già esistente")
      } else {
        throw error
      }
    }

    // =====================================================
    // CREAZIONE INDICI
    // =====================================================

    console.log("🔍 Creazione indici...")

    // Indici per restaurant_tables
    await db.collection("restaurant_tables").createIndex({ tableNumber: 1 }, { unique: true })
    await db.collection("restaurant_tables").createIndex({ status: 1 })
    await db.collection("restaurant_tables").createIndex({ assignedRoom: 1 })
    await db.collection("restaurant_tables").createIndex({ updatedAt: -1 })
    console.log("✅ Indici per 'restaurant_tables' creati")

    // Indici per daily_revenue
    await db.collection("daily_revenue").createIndex({ date: 1 }, { unique: true })
    await db.collection("daily_revenue").createIndex({ createdAt: -1 })
    await db.collection("daily_revenue").createIndex({ totalRevenue: -1 })
    console.log("✅ Indici per 'daily_revenue' creati")

    // =====================================================
    // VALIDAZIONE DOCUMENTI
    // =====================================================

    console.log("🛡️ Impostazione validazioni...")

    // Validazione per restaurant_tables
    try {
      await db.command({
        collMod: "restaurant_tables",
        validator: {
          $jsonSchema: {
            bsonType: "object",
            required: ["tableNumber", "assignedRoom", "orderItems", "status", "orderTotal"],
            properties: {
              tableNumber: {
                bsonType: "int",
                minimum: 1,
                maximum: 100,
              },
              assignedRoom: {
                bsonType: "int",
                minimum: 0,
              },
              orderItems: {
                bsonType: "array",
                items: {
                  bsonType: "object",
                  required: ["productId", "productName", "categoryName", "quantity", "unitPrice", "totalPrice"],
                  properties: {
                    quantity: { bsonType: "int", minimum: 1 },
                    unitPrice: { bsonType: "double", minimum: 0 },
                    totalPrice: { bsonType: "double", minimum: 0 },
                  },
                },
              },
              status: {
                enum: ["occupato", "disponibile"],
              },
              orderTotal: {
                bsonType: "double",
                minimum: 0,
              },
            },
          },
        },
      })
      console.log("✅ Validazione per 'restaurant_tables' impostata")
    } catch (error) {
      console.log("⚠️ Validazione per 'restaurant_tables' già esistente")
    }

    // Validazione per daily_revenue
    try {
      await db.command({
        collMod: "daily_revenue",
        validator: {
          $jsonSchema: {
            bsonType: "object",
            required: ["date", "collectionName", "soldItems", "totalRevenue"],
            properties: {
              date: {
                bsonType: "string",
                pattern: "^[0-9]{2}_[0-9]{2}_[0-9]{4}$",
              },
              soldItems: {
                bsonType: "array",
                items: {
                  bsonType: "object",
                  required: [
                    "productId",
                    "productName",
                    "categoryName",
                    "quantity",
                    "unitPrice",
                    "totalRevenue",
                    "tableNumber",
                  ],
                  properties: {
                    quantity: { bsonType: "int", minimum: 1 },
                    unitPrice: { bsonType: "double", minimum: 0 },
                    totalRevenue: { bsonType: "double", minimum: 0 },
                    tableNumber: { bsonType: "int", minimum: 1 },
                  },
                },
              },
              totalRevenue: {
                bsonType: "double",
                minimum: 0,
              },
            },
          },
        },
      })
      console.log("✅ Validazione per 'daily_revenue' impostata")
    } catch (error) {
      console.log("⚠️ Validazione per 'daily_revenue' già esistente")
    }

    // =====================================================
    // INIZIALIZZAZIONE TAVOLI
    // =====================================================

    console.log("🪑 Inizializzazione tavoli...")

    const tablesCollection = db.collection("restaurant_tables")

    // Elimina tavoli esistenti
    await tablesCollection.deleteMany({})
    console.log("🗑️ Tavoli esistenti eliminati")

    // Crea 40 tavoli vuoti
    const tables = []
    for (let i = 1; i <= 40; i++) {
      tables.push({
        tableNumber: i,
        assignedRoom: 0,
        orderItems: [],
        status: "disponibile",
        orderTotal: 0.0,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }

    // Aggiungi alcuni tavoli di esempio con ordini attivi
    tables[4] = {
      // Tavolo 5
      tableNumber: 5,
      assignedRoom: 107,
      orderItems: [
        {
          productId: "sample_prod_1",
          productName: "Insalata Caprese",
          categoryName: "Antipasti",
          quantity: 2,
          unitPrice: 10.0,
          totalPrice: 20.0,
          addedAt: new Date(),
        },
        {
          productId: "sample_prod_2",
          productName: "Bruschette",
          categoryName: "Antipasti",
          quantity: 1,
          unitPrice: 8.0,
          totalPrice: 8.0,
          addedAt: new Date(),
        },
      ],
      status: "occupato",
      orderTotal: 28.0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    tables[11] = {
      // Tavolo 12
      tableNumber: 12,
      assignedRoom: 0, // Nessuna camera assegnata
      orderItems: [
        {
          productId: "sample_prod_3",
          productName: "Spaghetti Carbonara",
          categoryName: "Primi piatti",
          quantity: 1,
          unitPrice: 12.0,
          totalPrice: 12.0,
          addedAt: new Date(),
        },
      ],
      status: "occupato",
      orderTotal: 12.0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    tables[19] = {
      // Tavolo 20
      tableNumber: 20,
      assignedRoom: 203,
      orderItems: [
        {
          productId: "sample_prod_4",
          productName: "Pizza Margherita",
          categoryName: "Pizze",
          quantity: 2,
          unitPrice: 9.0,
          totalPrice: 18.0,
          addedAt: new Date(),
        },
        {
          productId: "sample_prod_5",
          productName: "Coca Cola",
          categoryName: "Bevande",
          quantity: 2,
          unitPrice: 3.0,
          totalPrice: 6.0,
          addedAt: new Date(),
        },
      ],
      status: "occupato",
      orderTotal: 24.0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await tablesCollection.insertMany(tables)
    console.log(`✅ Creati ${result.insertedCount} tavoli`)

    // =====================================================
    // DATI DI ESEMPIO ARCHIVIO INCASSI
    // =====================================================

    console.log("💰 Creazione dati di esempio archivio incassi...")

    const revenueCollection = db.collection("daily_revenue")

    // Incassi di ieri
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toLocaleDateString("it-IT").replace(/\//g, "_")

    const yesterdayRevenue = {
      date: yesterdayStr,
      collectionName: `Incassi_${yesterdayStr}`,
      soldItems: [
        {
          productId: "sample_prod_1",
          productName: "Insalata Caprese",
          categoryName: "Antipasti",
          quantity: 5,
          unitPrice: 10.0,
          totalRevenue: 50.0,
          soldAt: yesterday,
          tableNumber: 3,
        },
        {
          productId: "sample_prod_3",
          productName: "Spaghetti Carbonara",
          categoryName: "Primi piatti",
          quantity: 3,
          unitPrice: 12.0,
          totalRevenue: 36.0,
          soldAt: yesterday,
          tableNumber: 7,
        },
        {
          productId: "sample_prod_4",
          productName: "Pizza Margherita",
          categoryName: "Pizze",
          quantity: 4,
          unitPrice: 9.0,
          totalRevenue: 36.0,
          soldAt: yesterday,
          tableNumber: 15,
        },
      ],
      totalRevenue: 122.0,
      createdAt: yesterday,
      updatedAt: yesterday,
    }

    await revenueCollection.insertOne(yesterdayRevenue)
    console.log(`✅ Creato archivio incassi per ${yesterdayStr} (€122.00)`)

    // =====================================================
    // RIEPILOGO
    // =====================================================

    console.log("\n🎉 INIZIALIZZAZIONE COMPLETATA!")
    console.log("=".repeat(50))
    console.log("📊 RIEPILOGO:")
    console.log(`   • ${result.insertedCount} tavoli creati (1-40)`)
    console.log("   • 3 tavoli con ordini attivi:")
    console.log("     - Tavolo 5: €28.00 (Camera 107)")
    console.log("     - Tavolo 12: €12.00 (Nessuna camera)")
    console.log("     - Tavolo 20: €24.00 (Camera 203)")
    console.log(`   • 1 archivio incassi: ${yesterdayStr} (€122.00)`)
    console.log("=".repeat(50))
    console.log("🚀 Il sistema è pronto per l'uso!")
  } catch (error) {
    console.error("❌ Errore durante l'inizializzazione:", error)
    throw error
  } finally {
    await client.close()
    console.log("🔌 Connessione MongoDB chiusa")
  }
}

// Esegui solo se chiamato direttamente
if (require.main === module) {
  initializeRestaurantDatabase()
    .then(() => {
      console.log("✅ Script completato con successo")
      process.exit(0)
    })
    .catch((error) => {
      console.error("❌ Script fallito:", error)
      process.exit(1)
    })
}

export { initializeRestaurantDatabase }
