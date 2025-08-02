import { MongoClient } from "mongodb"

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017"
const DB_NAME = "hotel_management"

async function seedInventory() {
  const client = new MongoClient(MONGODB_URI)

  try {
    console.log("🌱 Starting inventory seeding...")
    await client.connect()
    const db = client.db(DB_NAME)

    // Clear existing data
    console.log("🗑️ Clearing existing inventory data...")
    await db.collection("categories").deleteMany({})
    await db.collection("products").deleteMany({})

    // Create categories
    console.log("📂 Creating categories...")
    const categories = [
      { name: "Antipasti" },
      { name: "Primi piatti" },
      { name: "Secondi piatti" },
      { name: "Contorni" },
      { name: "Dessert" },
      { name: "Bibite" },
      { name: "Cocktails" },
      { name: "Caffè e bar" },
      { name: "Coperto" },
    ]

    const categoryResults = []
    for (const category of categories) {
      const result = await db.collection("categories").insertOne({
        ...category,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      categoryResults.push({ _id: result.insertedId, ...category })
      console.log(`✅ Created category: ${category.name}`)
    }

    // Create products for each category
    console.log("🍽️ Creating products...")
    const products = [
      // Antipasti
      { name: "Insalata caprese", categoryName: "Antipasti", price: 10.0 },
      { name: "Bruschette miste", categoryName: "Antipasti", price: 8.5 },
      { name: "Antipasto della casa", categoryName: "Antipasti", price: 12.0 },
      { name: "Prosciutto e melone", categoryName: "Antipasti", price: 11.0 },

      // Primi piatti
      { name: "Spaghetti carbonara", categoryName: "Primi piatti", price: 14.0 },
      { name: "Risotto ai funghi", categoryName: "Primi piatti", price: 15.0 },
      { name: "Penne all'arrabbiata", categoryName: "Primi piatti", price: 12.0 },
      { name: "Lasagne della casa", categoryName: "Primi piatti", price: 16.0 },

      // Secondi piatti
      { name: "Bistecca alla griglia", categoryName: "Secondi piatti", price: 22.0 },
      { name: "Salmone al forno", categoryName: "Secondi piatti", price: 20.0 },
      { name: "Pollo arrosto", categoryName: "Secondi piatti", price: 18.0 },
      { name: "Scaloppine al limone", categoryName: "Secondi piatti", price: 19.0 },

      // Contorni
      { name: "Insalata mista", categoryName: "Contorni", price: 6.0 },
      { name: "Patate al forno", categoryName: "Contorni", price: 5.5 },
      { name: "Verdure grigliate", categoryName: "Contorni", price: 7.0 },
      { name: "Spinaci saltati", categoryName: "Contorni", price: 6.5 },

      // Dessert
      { name: "Tiramisù", categoryName: "Dessert", price: 7.0 },
      { name: "Panna cotta", categoryName: "Dessert", price: 6.5 },
      { name: "Gelato (3 scoops)", categoryName: "Dessert", price: 5.0 },
      { name: "Torta della casa", categoryName: "Dessert", price: 6.0 },

      // Bibite
      { name: "Acqua naturale", categoryName: "Bibite", price: 2.0 },
      { name: "Acqua frizzante", categoryName: "Bibite", price: 2.0 },
      { name: "Coca Cola", categoryName: "Bibite", price: 3.5 },
      { name: "Birra media", categoryName: "Bibite", price: 4.5 },
      { name: "Vino della casa (bicchiere)", categoryName: "Bibite", price: 5.0 },

      // Cocktails
      { name: "Spritz", categoryName: "Cocktails", price: 7.0 },
      { name: "Negroni", categoryName: "Cocktails", price: 8.0 },
      { name: "Mojito", categoryName: "Cocktails", price: 8.5 },
      { name: "Aperol Spritz", categoryName: "Cocktails", price: 7.5 },

      // Caffè e bar
      { name: "Espresso", categoryName: "Caffè e bar", price: 1.5 },
      { name: "Cappuccino", categoryName: "Caffè e bar", price: 2.0 },
      { name: "Caffè americano", categoryName: "Caffè e bar", price: 2.5 },
      { name: "Grappa", categoryName: "Caffè e bar", price: 4.0 },

      // Coperto
      { name: "Coperto per persona", categoryName: "Coperto", price: 2.5 },
    ]

    let productCount = 0
    for (const product of products) {
      const category = categoryResults.find((cat) => cat.name === product.categoryName)
      if (category) {
        await db.collection("products").insertOne({
          name: product.name,
          categoryId: category._id,
          price: product.price,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        productCount++
        console.log(`✅ Created product: ${product.name} (${product.categoryName}) - €${product.price}`)
      }
    }

    // Create indexes
    console.log("📊 Creating indexes...")
    await db.collection("categories").createIndex({ name: 1 }, { unique: true })
    await db.collection("products").createIndex({ categoryId: 1 })
    await db.collection("products").createIndex({ name: 1 })

    console.log(`🎉 Inventory seeding completed!`)
    console.log(`📂 Created ${categoryResults.length} categories`)
    console.log(`🍽️ Created ${productCount} products`)
    console.log(`📊 Created database indexes`)
  } catch (error) {
    console.error("❌ Error seeding inventory:", error)
    throw error
  } finally {
    await client.close()
  }
}

// Run if called directly
if (require.main === module) {
  seedInventory()
    .then(() => {
      console.log("✅ Seeding completed successfully")
      process.exit(0)
    })
    .catch((error) => {
      console.error("❌ Seeding failed:", error)
      process.exit(1)
    })
}

export { seedInventory }
