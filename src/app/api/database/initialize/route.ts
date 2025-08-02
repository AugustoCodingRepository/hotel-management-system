import { NextResponse } from "next/server"
import { initializeDatabase } from "@/app/scripts/initialize-database"

export async function POST() {
  try {
    console.log("🚀 API chiamata per inizializzazione database...")

    const result = await initializeDatabase()

    console.log("📊 Risultato inizializzazione:", result)

    const response = NextResponse.json(result, {
      status: result.success ? 200 : 500,
    })

    // Aggiungi headers CORS
    response.headers.set("Access-Control-Allow-Origin", "*")
    response.headers.set("Access-Control-Allow-Methods", "POST")
    response.headers.set("Access-Control-Allow-Headers", "Content-Type")

    return response
  } catch (error) {
    console.error("❌ Errore nell'API di inizializzazione:", error)

    const errorResponse = {
      success: false,
      message: `Errore nell'inizializzazione: ${error instanceof Error ? error.message : "Errore sconosciuto"}`,
      stats: null,
      error: error instanceof Error ? error.stack : String(error),
    }

    return NextResponse.json(errorResponse, { status: 500 })
  }
}

// Aggiungi supporto per OPTIONS (preflight CORS)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  })
}
