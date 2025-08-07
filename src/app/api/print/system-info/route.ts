import { NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"
import os from "os"

const execAsync = promisify(exec)

export async function GET() {
  try {
    console.log("🔍 Getting system info...")
    
    const systemInfo = {
      platform: os.platform(),
      release: os.release(),
      arch: os.arch(),
      nodeVersion: process.version,
      hostname: os.hostname(),
      uptime: os.uptime(),
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem()
      },
      cpus: os.cpus().length,
      networkInterfaces: os.networkInterfaces(),
      environment: {
        isVercel: !!process.env.VERCEL,
        isDocker: false,
        isContainer: false,
        nodeEnv: process.env.NODE_ENV,
        platform: process.platform
      },
      capabilities: {
        canExec: false,
        canPing: false,
        canNetcat: false,
        canTelnet: false
      }
    }

    // Test if we can execute commands
    try {
      await execAsync('echo "test"')
      systemInfo.capabilities.canExec = true
    } catch {
      systemInfo.capabilities.canExec = false
    }

    // Test for Docker
    try {
      await execAsync('cat /.dockerenv')
      systemInfo.environment.isDocker = true
    } catch {
      // Not in Docker
    }

    // Test for container
    try {
      const cgroupResult = await execAsync('cat /proc/1/cgroup')
      if (cgroupResult.stdout.includes('docker') || cgroupResult.stdout.includes('containerd')) {
        systemInfo.environment.isContainer = true
      }
    } catch {
      // Can't read cgroup
    }

    // Test network tools availability
    if (systemInfo.capabilities.canExec) {
      const tools = ['ping', 'nc', 'telnet']
      for (const tool of tools) {
        try {
          await execAsync(`which ${tool}`)
          systemInfo.capabilities[`can${tool.charAt(0).toUpperCase() + tool.slice(1)}`] = true
        } catch {
          systemInfo.capabilities[`can${tool.charAt(0).toUpperCase() + tool.slice(1)}`] = false
        }
      }
    }

    console.log("✅ System info collected:", systemInfo)
    
    return NextResponse.json(systemInfo)
  } catch (error) {
    console.error("❌ System info error:", error)
    return NextResponse.json(
      {
        error: "Errore nel recupero informazioni sistema",
        details: error instanceof Error ? error.message : "Errore sconosciuto"
      },
      { status: 500 }
    )
  }
}
