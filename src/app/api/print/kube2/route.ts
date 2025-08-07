import { type NextRequest, NextResponse } from "next/server"
import { Socket } from "net"

export async function POST(request: NextRequest) {
  try {
    const { printerIp, content, tableNumber } = await request.json()

    console.log(`🖨️ Printing receipt for table ${tableNumber} to ${printerIp}`)

    const result = await printToKube2(printerIp, content)

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "Stampa completata con successo",
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("❌ Print API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Errore interno del server",
      },
      { status: 500 },
    )
  }
}

async function printToKube2(printerIp: string, content: string): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    const socket = new Socket()
    const PRINTER_PORT = 9100
    const TIMEOUT = 15000 // Timeout più lungo come nel Python
    const MAX_RETRIES = 3

    console.log(`🔌 Connecting to printer at ${printerIp}:${PRINTER_PORT}`)

    let attempt = 0

    const tryPrint = () => {
      attempt++
      console.log(`⏳ Tentativo stampa ${attempt}/${MAX_RETRIES}...`)

      const socket = new Socket()
      socket.setTimeout(TIMEOUT)

      const cleanup = () => {
        try {
          // Feed finale prima di chiudere come nel Python
          socket.write(Buffer.from([0x0A, 0x0A]), () => {
            setTimeout(() => {
              socket.destroy()
            }, 500)
          })
        } catch (e) {
          socket.destroy()
        }
      }

      const timeout = setTimeout(() => {
        console.log(`⏰ Timeout stampa tentativo ${attempt}`)
        cleanup()
        
        if (attempt < MAX_RETRIES) {
          console.log("⏳ Attendo 3 secondi prima del prossimo tentativo...")
          setTimeout(tryPrint, 3000)
        } else {
          resolve({ success: false, error: "Timeout connessione stampante dopo 3 tentativi" })
        }
      }, TIMEOUT)

      socket.connect(PRINTER_PORT, printerIp, () => {
        console.log(`✅ Connesso per stampa tentativo ${attempt}`)
        clearTimeout(timeout)

        try {
          // Reset iniziale come nel Python
          const resetCommand = Buffer.from([0x1B, 0x40]) // ESC @
          socket.write(resetCommand, (error) => {
            if (error) {
              console.error("❌ Errore reset stampa:", error)
              cleanup()
              
              if (attempt < MAX_RETRIES) {
                setTimeout(tryPrint, 3000)
              } else {
                resolve({ success: false, error: `Errore reset: ${error.message}` })
              }
              return
            }

            // Pausa dopo reset
            setTimeout(() => {
              // Invia il contenuto della ricevuta
              socket.write(content, "binary", (error) => {
                if (error) {
                  console.error("❌ Errore invio dati stampa:", error)
                  cleanup()
                  
                  if (attempt < MAX_RETRIES) {
                    setTimeout(tryPrint, 3000)
                  } else {
                    resolve({ success: false, error: `Errore invio dati: ${error.message}` })
                  }
                  return
                }

                console.log("✅ Dati stampa inviati con successo")
                
                // Pausa finale prima di disconnettere
                setTimeout(() => {
                  cleanup()
                  resolve({ success: true })
                }, 1000) // 1 secondo per completare la stampa
              })
            }, 500) // 500ms dopo reset
          })
        } catch (error) {
          clearTimeout(timeout)
          cleanup()
          
          if (attempt < MAX_RETRIES) {
            setTimeout(tryPrint, 3000)
          } else {
            resolve({ success: false, error: `Errore durante stampa: ${error instanceof Error ? error.message : 'Errore sconosciuto'}` })
          }
        }
      })

      socket.on("error", (error: any) => {
        console.error(`❌ Errore connessione stampa tentativo ${attempt}:`, error)
        clearTimeout(timeout)
        cleanup()
        
        if (attempt < MAX_RETRIES) {
          console.log("⏳ Attendo 3 secondi prima del prossimo tentativo...")
          setTimeout(tryPrint, 3000)
        } else {
          resolve({ success: false, error: `Errore connessione: ${error.message}` })
        }
      })

      socket.on("close", () => {
        console.log(`🔌 Connessione stampa chiusa tentativo ${attempt}`)
        clearTimeout(timeout)
      })
    }

    // Inizia il primo tentativo
    tryPrint()
  })
}
