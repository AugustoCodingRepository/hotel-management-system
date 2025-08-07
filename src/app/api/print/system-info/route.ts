import { NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"
import os from "os"

const execAsync = promisify(exec)

export async function POST() {
  try {
    console.log("🔍 Gathering system information...")

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
        usage: process.memoryUsage()
      },
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: process.env.VERCEL,
        VERCEL_ENV: process.env.VERCEL_ENV,
        VERCEL_URL: process.env.VERCEL_URL,
        AWS_LAMBDA_FUNCTION_NAME: process.env.AWS_LAMBDA_FUNCTION_NAME,
        GOOGLE_CLOUD_PROJECT: process.env.GOOGLE_CLOUD_PROJECT,
        RAILWAY_ENVIRONMENT: process.env.RAILWAY_ENVIRONMENT,
        RENDER: process.env.RENDER
      },
      networkInterfaces: os.networkInterfaces(),
      capabilities: {
        canExecCommands: false,
        availableCommands: [],
        systemLimitations: []
      }
    }

    // Test if we can execute commands
    try {
      await execAsync('echo "test"')
      systemInfo.capabilities.canExecCommands = true
    } catch (error) {
      systemInfo.capabilities.canExecCommands = false
      systemInfo.capabilities.systemLimitations.push("Cannot execute system commands")
    }

    // Test available commands
    const commandsToTest = ['ping', 'nc', 'telnet', 'curl', 'wget', 'nmap', 'netstat', 'ss']
    
    if (systemInfo.capabilities.canExecCommands) {
      for (const cmd of commandsToTest) {
        try {
          await execAsync(`which ${cmd}`)
          systemInfo.capabilities.availableCommands.push(cmd)
        } catch {
          // Command not available
        }
      }
    }

    // Detect hosting environment
    let hostingProvider = 'unknown'
    if (process.env.VERCEL) {
      hostingProvider = 'vercel'
      systemInfo.capabilities.systemLimitations.push("Vercel serverless environment")
      systemInfo.capabilities.systemLimitations.push("No direct network connections to local devices")
      systemInfo.capabilities.systemLimitations.push("No system commands available")
    } else if (process.env.AWS_LAMBDA_FUNCTION_NAME) {
      hostingProvider = 'aws-lambda'
      systemInfo.capabilities.systemLimitations.push("AWS Lambda serverless environment")
    } else if (process.env.GOOGLE_CLOUD_PROJECT) {
      hostingProvider = 'google-cloud'
    } else if (process.env.RAILWAY_ENVIRONMENT) {
      hostingProvider = 'railway'
    } else if (process.env.RENDER) {
      hostingProvider = 'render'
    }

    // Check for Docker/Container
    try {
      await execAsync('cat /.dockerenv')
      systemInfo.capabilities.systemLimitations.push("Running in Docker container")
    } catch {
      // Not in Docker
    }

    try {
      const cgroupResult = await execAsync('cat /proc/1/cgroup')
      if (cgroupResult.stdout.includes('docker') || cgroupResult.stdout.includes('containerd')) {
        systemInfo.capabilities.systemLimitations.push("Running in container environment")
      }
    } catch {
      // Can't read cgroup
    }

    return NextResponse.json({
      success: true,
      systemInfo: {
        ...systemInfo,
        hostingProvider
      }
    })

  } catch (error) {
    console.error("❌ System info error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Errore nel recupero informazioni sistema",
        details: error instanceof Error ? error.message : "Errore sconosciuto"
      },
      { status: 500 }
    )
  }
}
