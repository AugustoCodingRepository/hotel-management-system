import { type NextRequest, NextResponse } from "next/server"
import { Socket } from "net"

export async function POST(request: NextRequest) {
  try {
    const { printerIp, content, tableNumber } = await request.json()

    console.log(`🖨️ Printing receipt for table ${tableNumber} to KUBE2 at ${printerIp}`)

    const result = await printToKube2Direct(printerIp, content)

    if (result.success) {
      console.log("✅ Receipt sent to printer successfully")
      return NextResponse.json({
        success: true,
        message: "Conto inviato alla stampante KUBE2",
      })
    } else {
      console.error("❌ Print failed:", result.error)
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
        error: "Errore interno del server di stampa",
      },
      { status: 500 },
    )
  }
}

// Stampa diretta replicando esattamente il Python funzionante
async function printToKube2Direct(printerIp: string, content: string): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    console.log(`🔌 Connecting to printer at ${printerIp}:9100`)
    
    const socket = new Socket()
    socket.setTimeout(15000) // 15 secondi come nel Python per la stampa
    
    let connected = false

    const cleanup = () => {
      try {
        if (socket && !socket.destroyed) {
          // Feed finale come nel Python prima di chiudere
          socket.write(Buffer.from([0x0A, 0x0A]), () => {
            setTimeout(() => {
              socket.destroy()
            }, 500)
          })
        }
      } catch (e) {
        try {
          socket.destroy()
        } catch (e2) {
          // Ignora errori di cleanup
        }
      }
    }

    const timeout = setTimeout(() => {
      if (!connected) {
        console.log("⏰ Print connection timeout")
        cleanup()
        resolve({ success: false, error: "Timeout connessione stampante" })
      }
    }, 15000)

    socket.connect(9100, printerIp, () => {
      connected = true
      console.log(`✅ Connected to printer for printing`)
      
      try {
        // Reset iniziale come nel Python
        const resetCommand = Buffer.from([0x1B, 0x40]) // ESC @
        
        socket.write(resetCommand, (resetError) => {
          if (resetError) {
            console.error("❌ Error sending reset for print:", resetError)
            clearTimeout(timeout)
            cleanup()
            resolve({ success: false, error: `Errore reset stampa: ${resetError.message}` })
            return
          }

          console.log("✅ Print reset sent")
          
          // Attendi 500ms come nel Python
          setTimeout(() => {
            // Invia il contenuto della ricevuta
            socket.write(content, "binary", (printError) => {
              if (printError) {
                console.error("❌ Error sending print data:", printError)
                clearTimeout(timeout)
                cleanup()
                resolve({ success: false, error: `Errore invio dati stampa: ${printError.message}` })
                return
              }

              console.log("✅ Print data sent successfully")
              
              // Attendi che la stampa finisca come nel Python
              setTimeout(() => {
                clearTimeout(timeout)
                cleanup()
                resolve({ success: true })
              }, 1000) // 1 secondo per completare la stampa
            })
          }, 500) // 500ms dopo reset
        })
      } catch (error) {
        console.error("❌ Error in print sequence:", error)
        clearTimeout(timeout)
        cleanup()
        resolve({ success: false, error: `Errore sequenza stampa: ${error instanceof Error ? error.message : 'Errore sconosciuto'}` })
      }
    })

    socket.on("error", (error: any) => {
      console.error("❌ Print socket error:", error)
      clearTimeout(timeout)
      cleanup()
      
      let errorMessage = `Errore connessione stampa: ${error.message}`
      if (error.code === "ECONNREFUSED") {
        errorMessage = "Stampante rifiuta connessione per stampa"
      } else if (error.code === "ETIMEDOUT") {
        errorMessage = "Timeout durante stampa"
      }
      
      resolve({ success: false, error: errorMessage })
    })

    socket.on("close", () => {
      console.log("🔌 Print connection closed")
      clearTimeout(timeout)
    })

    socket.on("timeout", () => {
      console.log("⏰ Print socket timeout")
      clearTimeout(timeout)
      cleanup()
      resolve({ success: false, error: "Timeout socket durante stampa" })
    })
  })
}
