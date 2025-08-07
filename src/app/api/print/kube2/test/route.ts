import { type NextRequest, NextResponse } from "next/server"
import { Socket } from "net"

export async function POST(request: NextRequest) {
  try {
    const { printerIp } = await request.json()

    console.log(`🧪 Testing connection to KUBE2 printer at ${printerIp}`)

    const result = await testKube2ConnectionSimple(printerIp)

    return NextResponse.json(result)
  } catch (error) {
    console.error("❌ Test API error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Errore interno del server",
        details: error instanceof Error ? error.message : "Errore sconosciuto"
      },
      { status: 500 },
    )
  }
}

// Test semplificato - solo connessione socket come il ping
async function testKube2ConnectionSimple(printerIp: string): Promise<{ success: boolean; message: string; details?: string }> {
  return new Promise((resolve) => {
    const socket = new Socket()
    const PRINTER_PORT = 9100
    const TIMEOUT = 5000 // Timeout breve per test rapido

    console.log(`🔌 Simple connection test to ${printerIp}:${PRINTER_PORT}`)

    const timeout = setTimeout(() => {
      console.log(`⏰ Connection timeout after ${TIMEOUT}ms`)
      socket.destroy()
      resolve({ 
        success: false, 
        message: "Timeout connessione - Stampante non raggiungibile",
        details: `La porta 9100 su ${printerIp} non risponde. Verifica che la stampante sia accesa e sulla rete corretta.`
      })
    }, TIMEOUT)

    // Test di connessione semplice
    socket.connect(PRINTER_PORT, printerIp, () => {
      console.log(`✅ Socket connected to ${printerIp}:${PRINTER_PORT}`)
      clearTimeout(timeout)
      
      // Chiudi immediatamente - solo test connessione
      socket.end()
      
      resolve({ 
        success: true, 
        message: "Connessione socket OK",
        details: `La stampante risponde sulla porta 9100. Il problema potrebbe essere nei comandi ESC/POS.`
      })
    })

    socket.on("error", (error: any) => {
      console.error("❌ Socket connection error:", error)
      clearTimeout(timeout)
      socket.destroy()
      
      let errorMessage = "Errore di connessione"
      let details = ""

      if (error.code === "ECONNREFUSED") {
        errorMessage = "Connessione rifiutata"
        details = "La stampante rifiuta la connessione sulla porta 9100. Potrebbe essere spenta o configurata diversamente."
      } else if (error.code === "EHOSTUNREACH") {
        errorMessage = "Host non raggiungibile"
        details = "L'IP della stampante non è raggiungibile. Verifica l'indirizzo IP e la connessione di rete."
      } else if (error.code === "ENETUNREACH") {
        errorMessage = "Rete non raggiungibile"
        details = "Problema di routing di rete. Verifica che il server sia sulla stessa rete della stampante."
      } else if (error.code === "ETIMEDOUT") {
        errorMessage = "Timeout di rete"
        details = "La rete non risponde. Potrebbe essere un problema di firewall o configurazione di rete."
      } else {
        details = `Errore socket: ${error.message} (${error.code || 'UNKNOWN'})`
      }
      
      resolve({ 
        success: false, 
        message: errorMessage,
        details: details
      })
    })

    socket.on("close", () => {
      console.log("🔌 Socket connection closed")
      clearTimeout(timeout)
    })
  })
}
