import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db("hotel_management")

    // Test di connessione
    await db.admin().ping()

    // Lista delle collections
    const collections = await db.listCollections().toArray()

    return NextResponse.json({
      success: true,
      message: "Database connesso",
      collections: collections.map((c) => c.name),
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Database connection error:", error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Errore di connessione",
        collections: [],
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
