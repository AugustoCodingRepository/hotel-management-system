import { type NextRequest, NextResponse } from "next/server"
import { Socket } from "net"

export async function POST(request: NextRequest) {
  try {
    const { printerIp } = await request.json()

    console.log(`🧪 Testing connection to KUBE2 printer at ${printerIp}`)

    const result = await testKube2ConnectionMinimal(printerIp)

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

// Test minimo - solo connessione TCP senza comandi
async function testKube2ConnectionMinimal(printerIp: string): Promise<{ success: boolean; message: string; details?: string }> {
  return new Promise((resolve) => {
    console.log(`🔌 Minimal TCP connection test to ${printerIp}:9100`)
    
    const socket = new Socket()
    
    // Configurazione socket base
    socket.setTimeout(3000) // Timeout breve per test rapido
    
    let connected = false

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
        console.log("⏰ TCP connection timeout")
        cleanup()
        resolve({
          success: false,
          message: "Timeout TCP - Porta 9100 non risponde",
          details: "La stampante non accetta connessioni TCP sulla porta 9100. Potrebbe usare un protocollo diverso."
        })
      }
    }, 3000)

    // Evento di connessione riuscita
    socket.connect(9100, printerIp, () => {
      connected = true
      console.log(`✅ TCP connection established to ${printerIp}:9100`)
      clearTimeout(timeout)
      
      // Chiudi immediatamente senza inviare comandi
      cleanup()
      
      resolve({
        success: true,
        message: "Connessione TCP OK",
        details: "La porta 9100 è aperta e accetta connessioni. Il problema potrebbe essere nei comandi ESC/POS."
      })
    })

    // Gestione errori
    socket.on("error", (error: any) => {
      console.error("❌ TCP connection error:", error)
      clearTimeout(timeout)
      cleanup()
      
      let message = "Errore TCP"
      let details = ""

      switch (error.code) {
        case "ECONNREFUSED":
          message = "Connessione TCP rifiutata"
          details = "La porta 9100 è chiusa o la stampante non accetta connessioni TCP raw."
          break
        case "EHOSTUNREACH":
          message = "Host non raggiungibile via TCP"
          details = "Problema di routing TCP nonostante il ping ICMP funzioni."
          break
        case "ETIMEDOUT":
          message = "Timeout TCP"
          details = "La connessione TCP è andata in timeout."
          break
        case "ENOTFOUND":
          message = "Host non trovato"
          details = "Errore di risoluzione DNS/IP."
          break
        default:
          message = "Errore TCP generico"
          details = `${error.message} (${error.code || 'UNKNOWN'})`
      }

      resolve({
        success: false,
        message: message,
        details: details
      })
    })

    socket.on("close", () => {
      console.log("🔌 TCP connection closed")
      clearTimeout(timeout)
    })

    socket.on("timeout", () => {
      console.log("⏰ TCP socket timeout")
      if (!connected) {
        clearTimeout(timeout)
        cleanup()
        resolve({
          success: false,
          message: "Timeout socket TCP",
          details: "Il socket TCP è andato in timeout durante la connessione."
        })
      }
    })
  })
}
