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
    const TIMEOUT = 5000 // Timeout più breve come nel Python

    console.log(`🔌 Attempting connection to ${printerIp}:${PRINTER_PORT}`)

    // Imposta timeout del socket
    socket.setTimeout(TIMEOUT)

    const cleanup = () => {
      try {
        socket.destroy()
      } catch (e) {
        // Ignora errori di cleanup
      }
    }

    const timeout = setTimeout(() => {
      console.log(`⏰ Connection timeout after ${TIMEOUT}ms`)
      cleanup()
      resolve({ 
        success: false, 
        message: "Timeout connessione stampante",
        details: `Impossibile connettersi a ${printerIp}:${PRINTER_PORT} entro ${TIMEOUT/1000} secondi`
      })
    }, TIMEOUT)

    socket.connect(PRINTER_PORT, printerIp, () => {
      console.log(`✅ Successfully connected to KUBE2 at ${printerIp}:${PRINTER_PORT}`)
      clearTimeout(timeout)

      try {
        // Comando reset ESC/POS come nel Python
        const resetCommand = Buffer.from([0x1B, 0x40]) // ESC @
        socket.write(resetCommand, (error) => {
          if (error) {
            console.error("❌ Error sending reset command:", error)
            cleanup()
            resolve({ 
              success: false, 
              message: "Errore invio comando reset",
              details: error.message
            })
          } else {
            console.log("✅ Reset command sent successfully")
            
            // Piccola pausa come nel Python
            setTimeout(() => {
              // Test data come nel Python
              const testData = Buffer.from("TEST KUBE II\n\n", 'utf8')
              socket.write(testData, (error) => {
                cleanup()
                if (error) {
                  resolve({ 
                    success: false, 
                    message: "Errore invio dati test",
                    details: error.message
                  })
                } else {
                  resolve({ 
                    success: true, 
                    message: "Connessione KUBE2 OK - Stampante risponde correttamente",
                    details: `Connesso a ${printerIp}:${PRINTER_PORT}, comandi ESC/POS inviati`
                  })
                }
              })
            }, 500) // 500ms come nel Python
          }
        })
      } catch (error) {
        clearTimeout(timeout)
        cleanup()
        resolve({ 
          success: false, 
          message: "Errore durante test comandi",
          details: error instanceof Error ? error.message : "Errore sconosciuto"
        })
      }
    })

    socket.on("error", (error: any) => {
      console.error("❌ Socket error:", error)
      clearTimeout(timeout)
      cleanup()
      
      let errorMessage = "Errore di connessione"
      let details = error.message

      if (error.code === "ECONNREFUSED") {
        errorMessage = "Connessione rifiutata"
        details = "Stampante non raggiungibile sulla porta 9100 - Verifica che sia accesa"
      } else if (error.code === "EHOSTUNREACH") {
        errorMessage = "Host non raggiungibile"
        details = "Verifica IP e connessione di rete"
      } else if (error.code === "ENETUNREACH") {
        errorMessage = "Rete non raggiungibile"
        details = "Problema di routing di rete"
      } else if (error.code === "ETIMEDOUT") {
        errorMessage = "Timeout connessione"
        details = "La stampante non risponde entro il tempo limite"
      }
      
      resolve({ 
        success: false, 
        message: errorMessage,
        details: `${details} (${error.code})`
      })
    })

    socket.on("timeout", () => {
      console.log("⏰ Socket timeout")
      clearTimeout(timeout)
      cleanup()
      resolve({ 
        success: false, 
        message: "Timeout socket",
        details: "La connessione è andata in timeout"
      })
    })

    socket.on("close", () => {
      console.log("🔌 Connection to printer closed")
      clearTimeout(timeout)
    })
  })
}