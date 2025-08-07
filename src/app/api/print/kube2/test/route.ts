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
    const TIMEOUT = 15000 // 15 secondi come nel Python funzionante
    const MAX_RETRIES = 3

    console.log(`🔌 Attempting connection to ${printerIp}:${PRINTER_PORT}`)

    let attempt = 0

    const tryConnect = () => {
      attempt++
      console.log(`⏳ Tentativo ${attempt}/${MAX_RETRIES}...`)

      const socket = new Socket()
      socket.setTimeout(TIMEOUT)

      const cleanup = () => {
        try {
          socket.destroy()
        } catch (e) {
          // Ignora errori di cleanup
        }
      }

      const timeout = setTimeout(() => {
        console.log(`⏰ Timeout tentativo ${attempt} dopo ${TIMEOUT}ms`)
        cleanup()
        
        if (attempt < MAX_RETRIES) {
          console.log("⏳ Attendo 3 secondi prima del prossimo tentativo...")
          setTimeout(tryConnect, 3000)
        } else {
          resolve({ 
            success: false, 
            message: "Timeout connessione stampante dopo 3 tentativi",
            details: `Impossibile connettersi a ${printerIp}:${PRINTER_PORT} entro ${TIMEOUT/1000} secondi`
          })
        }
      }, TIMEOUT)

      socket.connect(PRINTER_PORT, printerIp, () => {
        console.log(`✅ Connesso alla Kube II tentativo ${attempt}!`)
        clearTimeout(timeout)

        try {
          // Test iniziale - comando reset come nel Python
          const resetCommand = Buffer.from([0x1B, 0x40]) // ESC @
          socket.write(resetCommand, (error) => {
            if (error) {
              console.error("❌ Errore invio reset:", error)
              cleanup()
              
              if (attempt < MAX_RETRIES) {
                setTimeout(tryConnect, 3000)
              } else {
                resolve({ 
                  success: false, 
                  message: "Errore invio comando reset",
                  details: error.message
                })
              }
              return
            }

            // Pausa come nel Python
            setTimeout(() => {
              // Comando status come nel Python
              const statusCommand = Buffer.from([0x1D, 0x72, 0x01]) // GS r 1
              socket.write(statusCommand, (error) => {
                if (error) {
                  console.error("❌ Errore invio status:", error)
                  cleanup()
                  
                  if (attempt < MAX_RETRIES) {
                    setTimeout(tryConnect, 3000)
                  } else {
                    resolve({ 
                      success: false, 
                      message: "Errore invio comando status",
                      details: error.message
                    })
                  }
                  return
                }

                // Pausa finale
                setTimeout(() => {
                  cleanup()
                  resolve({ 
                    success: true, 
                    message: "Connessione KUBE2 OK - Stampante risponde correttamente",
                    details: `Connesso a ${printerIp}:${PRINTER_PORT}, comandi reset e status inviati`
                  })
                }, 200) // 200ms come nel Python
              })
            }, 500) // 500ms come nel Python
          })
        } catch (error) {
          clearTimeout(timeout)
          cleanup()
          
          if (attempt < MAX_RETRIES) {
            setTimeout(tryConnect, 3000)
          } else {
            resolve({ 
              success: false, 
              message: "Errore durante test comandi",
              details: error instanceof Error ? error.message : "Errore sconosciuto"
            })
          }
        }
      })

      socket.on("error", (error: any) => {
        console.error(`❌ Errore socket tentativo ${attempt}:`, error)
        clearTimeout(timeout)
        cleanup()
        
        if (attempt < MAX_RETRIES) {
          console.log("⏳ Attendo 3 secondi prima del prossimo tentativo...")
          setTimeout(tryConnect, 3000)
        } else {
          let errorMessage = "Errore di connessione"
          let details = error.message

          if (error.code === "ECONNREFUSED") {
            errorMessage = "Connessione rifiutata dopo 3 tentativi"
            details = "Stampante non raggiungibile sulla porta 9100"
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
        }
      })

      socket.on("timeout", () => {
        console.log(`⏰ Socket timeout tentativo ${attempt}`)
        clearTimeout(timeout)
        cleanup()
        
        if (attempt < MAX_RETRIES) {
          setTimeout(tryConnect, 3000)
        } else {
          resolve({ 
            success: false, 
            message: "Timeout socket dopo 3 tentativi",
            details: "La connessione è andata in timeout"
          })
        }
      })

      socket.on("close", () => {
        console.log(`🔌 Connessione chiusa tentativo ${attempt}`)
        clearTimeout(timeout)
      })
    }

    // Inizia il primo tentativo
    tryConnect()
  })
}
