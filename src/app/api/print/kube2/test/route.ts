import { NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"
import net from "net"

const execAsync = promisify(exec)

export async function POST(request: Request) {
  try {
    const { printerIp = '10.0.0.55', port = 9100 } = await request.json()
    
    console.log(`🔍 Testing connection to ${printerIp}:${port}`)
    
    const testResults = {
      timestamp: new Date().toISOString(),
      printerIp,
      port,
      tests: {
        socketConnection: { success: false, details: '', duration: 0 },
        pingTest: { success: false, details: '', duration: 0 },
        portScan: { success: false, details: '', duration: 0 },
        systemInfo: { success: false, details: '', duration: 0 }
      }
    }

    // Test 1: Socket Connection
    const socketStart = Date.now()
    try {
      await testSocketConnection(printerIp, port)
      testResults.tests.socketConnection = {
        success: true,
        details: `Socket connection successful to ${printerIp}:${port}`,
        duration: Date.now() - socketStart
      }
    } catch (error) {
      testResults.tests.socketConnection = {
        success: false,
        details: `Socket connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - socketStart
      }
    }

    // Test 2: Ping Test
    const pingStart = Date.now()
    try {
      const pingResult = await execAsync(`ping -c 1 -W 3000 ${printerIp}`)
      testResults.tests.pingTest = {
        success: true,
        details: `Ping successful: ${pingResult.stdout.split('\n')[1] || 'OK'}`,
        duration: Date.now() - pingStart
      }
    } catch (error: any) {
      testResults.tests.pingTest = {
        success: false,
        details: `Ping failed: ${error.stderr || error.message}`,
        duration: Date.now() - pingStart
      }
    }

    // Test 3: Port Scan
    const portStart = Date.now()
    try {
      const portResult = await execAsync(`timeout 5 nc -z -v ${printerIp} ${port}`)
      testResults.tests.portScan = {
        success: true,
        details: `Port ${port} is open: ${portResult.stderr || 'Connected'}`,
        duration: Date.now() - portStart
      }
    } catch (error: any) {
      testResults.tests.portScan = {
        success: false,
        details: `Port ${port} is closed: ${error.stderr || error.message}`,
        duration: Date.now() - portStart
      }
    }

    // Test 4: System Info
    const sysStart = Date.now()
    try {
      const hostname = await execAsync('hostname')
      const whoami = await execAsync('whoami')
      testResults.tests.systemInfo = {
        success: true,
        details: `Hostname: ${hostname.stdout.trim()}, User: ${whoami.stdout.trim()}`,
        duration: Date.now() - sysStart
      }
    } catch (error: any) {
      testResults.tests.systemInfo = {
        success: false,
        details: `System info failed: ${error.message}`,
        duration: Date.now() - sysStart
      }
    }

    console.log("🔍 Test results:", testResults)
    
    return NextResponse.json(testResults)
  } catch (error) {
    console.error("❌ Test error:", error)
    return NextResponse.json(
      {
        error: "Errore nel test di connessione",
        details: error instanceof Error ? error.message : "Errore sconosciuto"
      },
      { status: 500 }
    )
  }
}

function testSocketConnection(host: string, port: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket()
    const timeout = 5000

    const timer = setTimeout(() => {
      socket.destroy()
      reject(new Error(`Connection timeout after ${timeout}ms`))
    }, timeout)

    socket.connect(port, host, () => {
      clearTimeout(timer)
      socket.destroy()
      resolve()
    })

    socket.on('error', (error) => {
      clearTimeout(timer)
      socket.destroy()
      reject(error)
    })
  })
}
