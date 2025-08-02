import { MongoClient } from "mongodb"

const uri = process.env.MONGODB_URI!

if (!uri) {
  console.error("❌ MONGODB_URI non trovato")
  process.exit(1)
}

async function initializeRestaurantTables() {
  const client = new MongoClient(uri)

  try {
    await client.connect()
    const db = client.db("hotel_management")
    const collection = db.collection("restaurant_tables")

    // Elimina tavoli esistenti
    await collection.deleteMany({})
    console.log("🗑️ Tavoli esistenti eliminati")

    // Crea 40 tavoli
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

    // Tavoli con ordini di esempio
    tables[4] = {
      tableNumber: 5,
      assignedRoom: 107,
      orderItems: [
        {
          productId: "prod_1",
          productName: "Insalata Caprese",
          categoryName: "Antipasti",
          quantity: 2,
          unitPrice: 10.0,
          totalPrice: 20.0,
          addedAt: new Date(),
        },
      ],
      status: "occupato",
      orderTotal: 20.0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await collection.insertMany(tables)
    console.log(`✅ Creati ${result.insertedCount} tavoli`)

    return result.insertedCount
  } catch (error) {
    console.error("❌ Errore:", error)
    throw error
  } finally {
    await client.close()
  }
}

if (require.main === module) {
  initializeRestaurantTables()
    .then((count) => {
      console.log(`✅ ${count} tavoli inizializzati`)
      process.exit(0)
    })
    .catch((error) => {
      console.error("❌ Errore:", error)
      process.exit(1)
    })
}

export { initializeRestaurantTables }
