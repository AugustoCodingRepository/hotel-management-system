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
      },
      { status: 500 },
    )
  }
}

async function testKube2Connection(printerIp: string): Promise<{ success: boolean; message: string; details?: string }> {
  return new Promise((resolve) => {
    const socket = new Socket()
    const PRINTER_PORT = 9100
    const TIMEOUT = 10000 // Aumentato timeout a 10 secondi

    console.log(`🔌 Attempting connection to ${printerIp}:${PRINTER_PORT}`)

    const timeout = setTimeout(() => {
      console.log(`⏰ Connection timeout after ${TIMEOUT}ms`)
      socket.destroy()
      resolve({ 
        success: false, 
        message: "Timeout connessione stampante (10s)",
        details: `Impossibile connettersi a ${printerIp}:${PRINTER_PORT} entro 10 secondi`
      })
    }, TIMEOUT)

    socket.connect(PRINTER_PORT, printerIp, () => {
      console.log(`✅ Successfully connected to KUBE2 at ${printerIp}:${PRINTER_PORT}`)
      clearTimeout(timeout)

      // Invia un comando di test più semplice
      const testCommand = "\x1B@\x0A" // ESC @ + Line Feed
      socket.write(testCommand, "binary", (error) => {
        if (error) {
          console.error("❌ Error sending test command:", error)
          socket.destroy()
          resolve({ 
            success: false, 
            message: "Errore invio comando test",
            details: error.message
          })
        } else {
          console.log("✅ Test command sent successfully")
          socket.end()
          resolve({ 
            success: true, 
            message: "Connessione KUBE2 OK - Stampante risponde correttamente",
            details: `Connesso a ${printerIp}:${PRINTER_PORT} e comando test inviato`
          })
        }
      })
    })

    socket.on("error", (error) => {
      console.error("❌ Socket error:", error)
      clearTimeout(timeout)
      socket.destroy()
      
      let errorMessage = "Errore di connessione"
      if (error.code === "ECONNREFUSED") {
        errorMessage = "Connessione rifiutata - Stampante non raggiungibile sulla porta 9100"
      } else if (error.code === "EHOSTUNREACH") {
        errorMessage = "Host non raggiungibile - Verifica IP e rete"
      } else if (error.code === "ENETUNREACH") {
        errorMessage = "Rete non raggiungibile"
      }
      
      resolve({ 
        success: false, 
        message: errorMessage,
        details: `Codice errore: ${error.code} - ${error.message}`
      })
    })

    socket.on("close", () => {
      console.log("🔌 Connection to printer closed")
      clearTimeout(timeout)
    })

    socket.on("timeout", () => {
      console.log("⏰ Socket timeout")
      clearTimeout(timeout)
      socket.destroy()
      resolve({ 
        success: false, 
        message: "Timeout socket",
        details: "La connessione è andata in timeout"
      })
    })
  })
}
