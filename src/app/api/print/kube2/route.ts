import { type NextRequest, NextResponse } from "next/server"
import { Socket } from "net"

export async function POST(request: NextRequest) {
  try {
    const { printerIp, content, tableNumber } = await request.json()

    console.log(`🖨️ Printing receipt for table ${tableNumber} to KUBE2 at ${printerIp}`)

    const result = await printToKube2Minimal(printerIp, content)

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

// Stampa minima senza retry - per debug
async function printToKube2Minimal(printerIp: string, content: string): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    console.log(`🔌 Connecting to printer at ${printerIp}:9100 for printing`)
    
    const socket = new Socket()
    socket.setTimeout(5000) // Timeout breve per debug
    
    let connected = false
    let dataSent = false

    const cleanup = () => {
      try {
        if (socket && !socket.destroyed) {
          socket.end()
        }
      } catch (e) {
        try {
          socket.destroy()
        } catch (e2) {
          // Ignora errori
        }
      }
    }

    const timeout = setTimeout(() => {
      if (!connected) {
        console.log("⏰ Print connection timeout")
        cleanup()
        resolve({ success: false, error: "Timeout connessione per stampa" })
      } else if (!dataSent) {
        console.log("⏰ Print data timeout")
        cleanup()
        resolve({ success: false, error: "Timeout invio dati stampa" })
      }
    }, 5000)

    socket.connect(9100, printerIp, () => {
      connected = true
      console.log(`✅ Connected to printer for printing`)
      
      try {
        // Invia direttamente il contenuto senza reset
        console.log("📤 Sending print data...")
        
        socket.write(content, "binary", (error) => {
          dataSent = true
          
          if (error) {
            console.error("❌ Error sending print data:", error)
            clearTimeout(timeout)
            cleanup()
            resolve({ success: false, error: `Errore invio dati: ${error.message}` })
            return
          }

          console.log("✅ Print data sent successfully")
          
          // Attendi un momento per la stampa
          setTimeout(() => {
            clearTimeout(timeout)
            cleanup()
            resolve({ success: true })
          }, 1000)
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
