import { NextResponse } from "next/server"
import net from "net"

export async function POST(request: Request) {
  try {
    const { printerIp } = await request.json()
    
    console.log(`🔍 Testing connection to printer at ${printerIp}:9100`)

    // Test 1: Basic socket connection
    const socketResult = await testSocketConnection(printerIp, 9100, 5000)
    
    if (socketResult.success) {
      console.log("✅ Socket connection successful")
      
      // Test 2: Try to send a simple command
      const commandResult = await testPrinterCommand(printerIp, 9100)
      
      return NextResponse.json({
        success: true,
        message: "Connessione alla stampante riuscita",
        details: {
          socketTest: socketResult,
          commandTest: commandResult
        }
      })
    } else {
      console.log("❌ Socket connection failed:", socketResult.error)
      
      return NextResponse.json({
        success: false,
        message: "Connessione alla stampante fallita",
        error: socketResult.error,
        suggestions: [
          "Verifica che la stampante sia accesa",
          "Controlla che l'IP sia corretto",
          "Assicurati che server e stampante siano sulla stessa rete",
          "Se sei su Vercel, la connessione è bloccata per design"
        ]
      })
    }

  } catch (error) {
    console.error("❌ Printer test error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Errore nel test della stampante",
        details: error instanceof Error ? error.message : "Errore sconosciuto"
      },
      { status: 500 }
    )
  }
}

function testSocketConnection(host: string, port: number, timeout: number = 5000): Promise<{success: boolean, error?: string, duration?: number}> {
  return new Promise((resolve) => {
    const startTime = Date.now()
    const socket = new net.Socket()
    
    const timer = setTimeout(() => {
      socket.destroy()
      resolve({
        success: false,
        error: `Connection timeout after ${timeout}ms`
      })
    }, timeout)

    socket.connect(port, host, () => {
      const duration = Date.now() - startTime
      clearTimeout(timer)
      socket.destroy()
      resolve({
        success: true,
        duration
      })
    })

    socket.on('error', (error) => {
      clearTimeout(timer)
      socket.destroy()
      resolve({
        success: false,
        error: error.message
      })
    })
  })
}

function testPrinterCommand(host: string, port: number): Promise<{success: boolean, error?: string, response?: string}> {
  return new Promise((resolve) => {
    const socket = new net.Socket()
    let response = ''
    
    const timer = setTimeout(() => {
      socket.destroy()
      resolve({
        success: false,
        error: "Command timeout"
      })
    }, 3000)

    socket.connect(port, host, () => {
      // Send a simple ESC/POS command to test communication
      const testCommand = '\x1B@' // ESC @ (Initialize printer)
      socket.write(testCommand)
      
      // Wait a bit for response
      setTimeout(() => {
        clearTimeout(timer)
        socket.destroy()
        resolve({
          success: true,
          response: response || "Command sent successfully"
        })
      }, 1000)
    })

    socket.on('data', (data) => {
      response += data.toString()
    })

    socket.on('error', (error) => {
      clearTimeout(timer)
      socket.destroy()
      resolve({
        success: false,
        error: error.message
      })
    })
  })
}
