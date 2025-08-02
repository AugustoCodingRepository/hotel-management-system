import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import type { RestaurantTable } from "@/lib/mongodb-schemas"

export async function GET() {
  try {
    console.log("🔄 GET /api/restaurant-tables - Starting...")

    const { db } = await connectToDatabase()
    console.log("✅ Database connected successfully")

    const collection = db.collection<RestaurantTable>("restaurant_tables")
    const tables = await collection.find({}).sort({ tableNumber: 1 }).toArray()

    console.log(`📊 Found ${tables.length} tables in database`)

    return NextResponse.json({
      success: true,
      tables: tables,
      count: tables.length,
    })
  } catch (error) {
    console.error("❌ Error in GET /api/restaurant-tables:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Errore nel caricamento dei tavoli",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("🔄 POST /api/restaurant-tables - Starting...")

    const body = await request.json()
    const { tableNumber } = body

    if (!tableNumber || typeof tableNumber !== "number") {
      return NextResponse.json({ success: false, error: "Numero tavolo non valido" }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    console.log("✅ Database connected successfully")

    const collection = db.collection<RestaurantTable>("restaurant_tables")

    // Check if table already exists
    const existingTable = await collection.findOne({ tableNumber })
    if (existingTable) {
      return NextResponse.json({ success: false, error: "Tavolo già esistente" }, { status: 409 })
    }

    const newTable: RestaurantTable = {
      tableNumber,
      status: "libero",
      orderItems: [],
      orderTotal: 0,
      assignedRoom: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await collection.insertOne(newTable)
    console.log(`✅ Created new table ${tableNumber}`)

    return NextResponse.json({
      success: true,
      table: { ...newTable, _id: result.insertedId },
    })
  } catch (error) {
    console.error("❌ Error in POST /api/restaurant-tables:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Errore nella creazione del tavolo",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
