import { type NextRequest, NextResponse } from "next/server"
import { Socket } from "net"

export async function POST(request: NextRequest) {
  try {
    const { printerIp } = await request.json()

    console.log(`🧪 Testing connection to KUBE2 printer at ${printerIp}`)

    const result = await testKube2Connection(printerIp)

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

async function testKube2Connection(printerIp: string): Promise<{ success: boolean; message: string; details?: string }> {
  return new Promise((resolve) => {
    const socket = new Socket()
    const PRINTER_PORT = 9100
    const TIMEOUT = 3000 // Timeout originale che funzionava

    console.log(`🔌 Attempting connection to ${printerIp}:${PRINTER_PORT}`)

    const timeout = setTimeout(() => {
      console.log(`⏰ Connection timeout after ${TIMEOUT}ms`)
      socket.destroy()
      resolve({ 
        success: false, 
        message: "Timeout connessione stampante (3s)",
        details: `Impossibile connettersi a ${printerIp}:${PRINTER_PORT} entro 3 secondi`
      })
    }, TIMEOUT)

    socket.connect(PRINTER_PORT, printerIp, () => {
      console.log(`✅ Successfully connected to KUBE2 at ${printerIp}:${PRINTER_PORT}`)
      clearTimeout(timeout)

      // Invia un comando di test (reset stampante) - CODICE ORIGINALE
      const testCommand = "\x1B@" // ESC @ (reset) - come era prima
      socket.write(testCommand, "binary", (error) => {
        if (error) {
          socket.destroy()
          resolve({ 
            success: false, 
            message: "Errore invio comando test",
            details: error.message
          })
        } else {
          socket.end()
          resolve({ 
            success: true, 
            message: "Connessione KUBE2 OK",
            details: `Connesso a ${printerIp}:${PRINTER_PORT} e comando test inviato`
          })
        }
      })
    })

    socket.on("error", (error: any) => {
      console.error("❌ Test connection error:", error)
      clearTimeout(timeout)
      socket.destroy()
      resolve({ 
        success: false, 
        message: `Errore: ${error.message}`,
        details: `Codice errore: ${error.code || 'UNKNOWN'}`
      })
    })

    socket.on("close", () => {
      clearTimeout(timeout)
    })
  })
}
