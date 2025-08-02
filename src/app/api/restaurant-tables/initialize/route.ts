import { NextResponse } from "next/server"
import { MongoClient } from "mongodb"
import { initializeRestaurantTables } from "@/app/scripts/initialize-restaurant-tables"

const uri = process.env.MONGODB_URI!

export async function POST() {
  const client = new MongoClient(uri)

  try {
    await client.connect()
    const count = await initializeRestaurantTables(client)

    return NextResponse.json({
      success: true,
      message: `${count} tavoli inizializzati con successo`,
      tablesCreated: count,
    })
  } catch (error) {
    console.error("Errore nell'inizializzazione tavoli:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Errore nell'inizializzazione dei tavoli",
        details: error instanceof Error ? error.message : "Errore sconosciuto",
      },
      { status: 500 },
    )
  } finally {
    await client.close()
  }
}
