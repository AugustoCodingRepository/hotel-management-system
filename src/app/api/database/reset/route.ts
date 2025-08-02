import { type NextRequest, NextResponse } from "next/server"
import { resetDatabase } from "@/app/scripts/reset-database"

export async function POST(request: NextRequest) {
  try {
    console.log("🔄 Avvio reset database tramite API...")

    await resetDatabase()

    return NextResponse.json({
      success: true,
      message: "Database resettato con successo! Tutti i dati sono stati eliminati, solo la struttura è rimasta.",
    })
  } catch (error) {
    console.error("❌ Errore durante il reset:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Errore durante il reset del database",
        details: error instanceof Error ? error.message : "Errore sconosciuto",
      },
      { status: 500 },
    )
  }
}
