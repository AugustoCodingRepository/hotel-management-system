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
    const TIMEOUT = 5000 // Timeout più lungo per la stampa

    console.log(`🔌 Connecting to printer at ${printerIp}:${PRINTER_PORT}`)

    const timeout = setTimeout(() => {
      console.log("⏰ Print timeout")
      socket.destroy()
      resolve({ success: false, error: "Timeout connessione stampante" })
    }, TIMEOUT)

    socket.connect(PRINTER_PORT, printerIp, () => {
      console.log("✅ Connected to printer, sending data...")
      clearTimeout(timeout)

      // Invia il contenuto della ricevuta
      socket.write(content, "binary", (error) => {
        if (error) {
          console.error("❌ Error sending print data:", error)
          socket.destroy()
          resolve({ success: false, error: `Errore invio dati: ${error.message}` })
        } else {
          console.log("✅ Print data sent successfully")
          socket.end()
          resolve({ success: true })
        }
      })
    })

    socket.on("error", (error: any) => {
      console.error("❌ Print connection error:", error)
      clearTimeout(timeout)
      socket.destroy()
      resolve({ success: false, error: `Errore connessione: ${error.message}` })
    })

    socket.on("close", () => {
      console.log("🔌 Printer connection closed")
      clearTimeout(timeout)
    })
  })
}
