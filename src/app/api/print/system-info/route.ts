import { type NextRequest, NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

export async function GET(request: NextRequest) {
  try {
    const systemInfo = await getSystemInfo()
    return NextResponse.json(systemInfo)
  } catch (error) {
    console.error("❌ System info error:", error)
    return NextResponse.json(
      {
        error: "Errore recupero informazioni sistema",
        details: error instanceof Error ? error.message : "Errore sconosciuto"
      },
      { status: 500 }
    )
  }
}

async function getSystemInfo() {
  const info: any = {
    platform: process.platform,
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || 'development',
    isVercel: !!process.env.VERCEL,
    availableCommands: {}
  }

  // Test comandi disponibili
  const commands = ['nc', 'curl', 'lp', 'telnet', 'nmap', 'ping']
  
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
    const networkInfo = await execAsync('ip route show default')
    info.defaultRoute = networkInfo.stdout.trim()
  } catch (error) {
    info.defaultRoute = 'Non disponibile'
  }

  try {
    const interfaceInfo = await execAsync('ip addr show')
    info.networkInterfaces = interfaceInfo.stdout
  } catch (error) {
    info.networkInterfaces = 'Non disponibile'
  }

  return info
}
