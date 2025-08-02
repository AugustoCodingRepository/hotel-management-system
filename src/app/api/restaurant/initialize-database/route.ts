import { NextResponse } from "next/server"
import { initializeRestaurantDatabase } from "@/app/scripts/initialize-restaurant-database"

export async function POST() {
  try {
    console.log("🚀 Avvio inizializzazione database ristorante...")

    await initializeRestaurantDatabase()

    return NextResponse.json({
      success: true,
      message: "Database ristorante inizializzato con successo",
      timestamp: new Date().toISOString(),
      details: {
        tables: 40,
        sampleOrders: 3,
        revenueArchive: 1,
      },
    })
  } catch (error) {
    console.error("❌ Errore nell'inizializzazione:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Errore durante l'inizializzazione del database",
        details: error instanceof Error ? error.message : "Errore sconosciuto",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Endpoint per inizializzazione database ristorante",
    method: "POST",
    description: "Usa POST per inizializzare il database con tavoli e dati di esempio",
  })
}
