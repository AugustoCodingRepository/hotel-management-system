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

async function testKube2Connection(printerIp: string): Promise<{ success: boolean; message: string }> {
  return new Promise((resolve) => {
    const socket = new Socket()
    const PRINTER_PORT = 9100
    const TIMEOUT = 3000

    const timeout = setTimeout(() => {
      socket.destroy()
      resolve({ success: false, message: "Timeout connessione stampante" })
    }, TIMEOUT)

    socket.connect(PRINTER_PORT, printerIp, () => {
      console.log(`✅ Successfully connected to KUBE2 at ${printerIp}:${PRINTER_PORT}`)
      clearTimeout(timeout)

      // Invia un comando di test (reset stampante)
      const testCommand = "\x1B@" // ESC @ (reset)
      socket.write(testCommand, "binary", (error) => {
        if (error) {
          socket.destroy()
          resolve({ success: false, message: "Errore invio comando test" })
        } else {
          socket.end()
          resolve({ success: true, message: "Connessione KUBE2 OK" })
        }
      })
    })

    socket.on("error", (error) => {
      console.error("❌ Test connection error:", error)
      clearTimeout(timeout)
      socket.destroy()
      resolve({ success: false, message: `Errore: ${error.message}` })
    })

    socket.on("close", () => {
      clearTimeout(timeout)
    })
  })
}
