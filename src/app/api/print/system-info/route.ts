import { NextResponse } from "next/server"
import os from "os"
import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

export async function GET() {
  try {
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
        nodeEnv: process.env.NODE_ENV || 'development',
        platform: os.platform()
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

    // Test specific commands
    const commands = ['ping', 'nc', 'telnet']
    for (const cmd of commands) {
      try {
        await execAsync(`which ${cmd}`)
        systemInfo.capabilities[`can${cmd.charAt(0).toUpperCase() + cmd.slice(1)}` as keyof typeof systemInfo.capabilities] = true
      } catch {
        systemInfo.capabilities[`can${cmd.charAt(0).toUpperCase() + cmd.slice(1)}` as keyof typeof systemInfo.capabilities] = false
      }
    }

    // Check for Docker
    try {
      await execAsync('cat /.dockerenv')
      systemInfo.environment.isDocker = true
    } catch {
      // Not in Docker
    }

    // Check for container
    try {
      const cgroupResult = await execAsync('cat /proc/1/cgroup')
      if (cgroupResult.stdout.includes('docker') || cgroupResult.stdout.includes('containerd')) {
        systemInfo.environment.isContainer = true
      }
    } catch {
      // Can't read cgroup
    }

    return NextResponse.json(systemInfo)
  } catch (error) {
    console.error("Error getting system info:", error)
    return NextResponse.json(
      {
        error: "Errore nel recupero informazioni sistema",
        details: error instanceof Error ? error.message : "Errore sconosciuto"
      },
      { status: 500 }
    )
  }
}
