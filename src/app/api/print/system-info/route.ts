import { type NextRequest, NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"
import os from "os"

const execAsync = promisify(exec)

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Gathering system information...")

    const systemInfo = await gatherSystemInfo()

    return NextResponse.json(systemInfo)
  } catch (error) {
    console.error("❌ System info error:", error)
    return NextResponse.json(
      {
        error: "Errore raccolta informazioni sistema",
        details: error instanceof Error ? error.message : "Errore sconosciuto"
      },
      { status: 500 }
    )
  }
}

async function gatherSystemInfo() {
  const info: any = {
    platform: os.platform(),
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || 'unknown',
    isVercel: !!process.env.VERCEL,
    availableCommands: {},
    defaultRoute: '',
    networkInterfaces: ''
  }

  // Test comandi disponibili
  const commands = ['ping', 'telnet', 'nc', 'curl', 'nmap', 'lp', 'route', 'ip']
  
  for (const cmd of commands) {
    try {
      await execAsync(`which ${cmd}`)
      info.availableCommands[cmd] = true
    } catch (error) {
      info.availableCommands[cmd] = false
    }
  }

  // Informazioni di rete
  try {
    const routeResult = await execAsync('route -n 2>/dev/null || ip route 2>/dev/null || echo "Route command not available"')
    info.defaultRoute = routeResult.stdout.trim()
  } catch (error) {
    info.defaultRoute = 'Non disponibile'
  }

  try {
    const interfaces = os.networkInterfaces()
    const interfaceInfo = Object.entries(interfaces)
      .map(([name, addrs]) => {
        if (!addrs) return null
        const ipv4 = addrs.find(addr => addr.family === 'IPv4' && !addr.internal)
        return ipv4 ? `${name}: ${ipv4.address}` : null
      })
      .filter(Boolean)
      .join(', ')
    
    info.networkInterfaces = interfaceInfo || 'Nessuna interfaccia trovata'
  } catch (error) {
    info.networkInterfaces = 'Errore lettura interfacce'
  }

  return info
}
