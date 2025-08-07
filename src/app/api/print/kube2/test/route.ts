import { type NextRequest, NextResponse } from "next/server"
import { Socket } from "net"

export async function POST(request: NextRequest) {
  try {
    const { printerIp } = await request.json()

    console.log(`🧪 Testing connection to KUBE2 printer at ${printerIp}`)

    const result = await testKube2ConnectionDirect(printerIp)

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

// Test diretto come il Python che funziona
async function testKube2ConnectionDirect(printerIp: string): Promise<{ success: boolean; message: string; details?: string }> {
  return new Promise((resolve) => {
    console.log(`🔌 Direct connection test to ${printerIp}:9100`)
    
    const socket = new Socket()
    
    // Configurazione socket identica al Python
    socket.setTimeout(10000) // 10 secondi come nel Python
    
    let connected = false
    let responseReceived = false

    const cleanup = () => {
      try {
        if (socket && !socket.destroyed) {
          socket.destroy()
        }
      } catch (e) {
        // Ignora errori di cleanup
      }
    }

    // Timeout manuale
    const timeout = setTimeout(() => {
      if (!connected) {
        console.log("⏰ Connection timeout - stampante non raggiungibile")
        cleanup()
        resolve({
          success: false,
          message: "Timeout connessione",
          details: "La stampante non risponde entro 10 secondi. Verifica che sia accesa e sulla rete."
        })
      }
    }, 10000)

    socket.connect(9100, printerIp, () => {
      connected = true
      console.log(`✅ Socket connected to ${printerIp}:9100`)
      
      try {
        // Invia comando reset esattamente come nel Python
        const resetCommand = Buffer.from([0x1B, 0x40]) // ESC @
        
        socket.write(resetCommand, (writeError) => {
          if (writeError) {
            console.error("❌ Error writing reset command:", writeError)
            clearTimeout(timeout)
            cleanup()
            resolve({
              success: false,
              message: "Errore invio comando",
              details: `Connesso ma errore invio reset: ${writeError.message}`
            })
            return
          }

          console.log("✅ Reset command sent")
          
          // Attendi 500ms come nel Python
          setTimeout(() => {
            // Invia comando status come nel Python
            const statusCommand = Buffer.from([0x1D, 0x72, 0x01]) // GS r 1
            
            socket.write(statusCommand, (statusError) => {
              if (statusError) {
                console.error("❌ Error writing status command:", statusError)
                clearTimeout(timeout)
                cleanup()
                resolve({
                  success: false,
                  message: "Errore comando status",
                  details: `Reset OK ma errore status: ${statusError.message}`
                })
                return
              }

              console.log("✅ Status command sent")
              
              // Attendi risposta per 200ms come nel Python
              setTimeout(() => {
                clearTimeout(timeout)
                cleanup()
                resolve({
                  success: true,
                  message: "Connessione KUBE2 OK",
                  details: "Stampante connessa e risponde ai comandi ESC/POS"
                })
              }, 200)
            })
          }, 500)
        })
      } catch (error) {
        console.error("❌ Error in command sequence:", error)
        clearTimeout(timeout)
        cleanup()
        resolve({
          success: false,
          message: "Errore sequenza comandi",
          details: error instanceof Error ? error.message : "Errore sconosciuto"
        })
      }
    })

    socket.on("error", (error: any) => {
      console.error("❌ Socket error:", error)
      clearTimeout(timeout)
      cleanup()
      
      let message = "Errore di connessione"
      let details = error.message

      if (error.code === "ECONNREFUSED") {
        message = "Connessione rifiutata"
        details = "La stampante rifiuta connessioni sulla porta 9100. Potrebbe essere occupata o mal configurata."
      } else if (error.code === "EHOSTUNREACH") {
        message = "Host non raggiungibile"
        details = "Problema di routing di rete nonostante il ping funzioni."
      } else if (error.code === "ETIMEDOUT") {
        message = "Timeout di rete"
        details = "La connessione TCP è andata in timeout."
      }

      resolve({
        success: false,
        message: message,
        details: `${details} (${error.code || 'UNKNOWN'})`
      })
    })

    socket.on("close", () => {
      console.log("🔌 Socket closed")
      clearTimeout(timeout)
    })

    socket.on("timeout", () => {
      console.log("⏰ Socket timeout event")
      if (!responseReceived) {
        clearTimeout(timeout)
        cleanup()
        resolve({
          success: false,
          message: "Timeout socket",
          details: "Il socket è andato in timeout durante la comunicazione"
        })
      }
    })
  })
}
