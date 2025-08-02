import { type NextRequest, NextResponse } from "next/server"
import { Socket } from "net"

export async function POST(request: NextRequest) {
  try {
    const { printerIp, content, tableNumber } = await request.json()

    console.log(`🖨️ Printing receipt for table ${tableNumber} to KUBE2 at ${printerIp}`)

    // Crea connessione socket alla stampante
    const result = await printToKube2(printerIp, content)

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

async function printToKube2(printerIp: string, content: string): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    const socket = new Socket()
    const PRINTER_PORT = 9100
    const TIMEOUT = 5000

    // Timeout per la connessione
    const timeout = setTimeout(() => {
      socket.destroy()
      resolve({ success: false, error: "Timeout connessione stampante" })
    }, TIMEOUT)

    socket.connect(PRINTER_PORT, printerIp, () => {
      console.log(`🔗 Connected to KUBE2 printer at ${printerIp}:${PRINTER_PORT}`)
      clearTimeout(timeout)

      // Invia il contenuto alla stampante
      socket.write(content, "binary", (error) => {
        if (error) {
          console.error("❌ Error writing to printer:", error)
          socket.destroy()
          resolve({ success: false, error: "Errore invio dati alla stampante" })
        } else {
          console.log("✅ Data sent to printer successfully")
          socket.end()
          resolve({ success: true })
        }
      })
    })

    socket.on("error", (error) => {
      console.error("❌ Socket error:", error)
      clearTimeout(timeout)
      socket.destroy()
      resolve({ success: false, error: `Errore connessione: ${error.message}` })
    })

    socket.on("close", () => {
      console.log("🔌 Connection to printer closed")
      clearTimeout(timeout)
    })
  })
}
