import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { printerIp, content, tableNumber, localServerUrl } = await request.json()
    
    console.log(`🌐 Sending print job to local server: ${localServerUrl}`)
    
    // Invia la richiesta di stampa al server locale
    const response = await fetch(`${localServerUrl}/print`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        printerIp,
        content,
        tableNumber,
        timestamp: new Date().toISOString()
      }),
      // Timeout di 10 secondi
      signal: AbortSignal.timeout(10000)
    })

    if (!response.ok) {
      throw new Error(`Server locale ha risposto con status ${response.status}`)
    }

    const result = await response.json()
    
    console.log("✅ Print job sent successfully via local server")
    
    return NextResponse.json({
      success: true,
      message: "Stampa inviata tramite server locale",
      details: result
    })
    
  } catch (error) {
    console.error("❌ Webhook print error:", error)
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Errore sconosciuto",
        suggestion: "Verifica che il server locale sia in esecuzione e raggiungibile"
      },
      { status: 500 }
    )
  }
}
