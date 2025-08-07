import { NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"
import os from "os"
import net from "net"

const execAsync = promisify(exec)

export async function POST(request: Request) {
  try {
    const { printerIp } = await request.json()
    
    console.log(`🔍 Running network diagnostics for ${printerIp}`)
    
    const diagnostics = await runNetworkDiagnostics(printerIp)
    
    return NextResponse.json(diagnostics)
  } catch (error) {
    console.error("❌ Network diagnostics error:", error)
    return NextResponse.json(
      {
        error: "Errore diagnostica di rete",
        details: error instanceof Error ? error.message : "Errore sconosciuto"
      },
      { status: 500 }
    )
  }
}

async function runNetworkDiagnostics(printerIp: string) {
  const diagnostics = {
    environment: {
      platform: os.platform(),
      release: os.release(),
      nodeVersion: process.version,
      isVercel: !!process.env.VERCEL,
      isDocker: false,
      isContainer: false,
      hostingProvider: 'unknown',
      hostname: os.hostname()
    },
    networkCapabilities: {
      canPing: false,
      canTelnet: false,
      canNetcat: false,
      canCurl: false,
      hasNetworkTools: false,
      canExecCommands: false
    },
    connectivityTests: {
      icmpPing: { success: false, details: '' },
      port9100: { success: false, details: '' },
      port80: { success: false, details: '' },
      port443: { success: false, details: '' },
      socketTest: { success: false, details: '' }
    },
    systemInfo: {
      uid: '',
      gid: '',
      hostname: os.hostname(),
      networkInterfaces: os.networkInterfaces(),
      processes: '',
      memoryUsage: process.memoryUsage(),
      environmentVariables: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: process.env.VERCEL,
        VERCEL_ENV: process.env.VERCEL_ENV,
        AWS_LAMBDA_FUNCTION_NAME: process.env.AWS_LAMBDA_FUNCTION_NAME,
        GOOGLE_CLOUD_PROJECT: process.env.GOOGLE_CLOUD_PROJECT
      }
    }
  }

  // 1. Detect environment
  await detectEnvironment(diagnostics)
  
  // 2. Test network capabilities
  await testNetworkCapabilities(diagnostics)
  
  // 3. Run connectivity tests (including pure Node.js socket test)
  await runConnectivityTests(printerIp, diagnostics)
  
  // 4. Gather system info
  await gatherSystemInfo(diagnostics)

  return diagnostics
}

async function detectEnvironment(diagnostics: any) {
  try {
    // Check for Vercel
    if (process.env.VERCEL) {
      diagnostics.environment.hostingProvider = 'vercel'
    }
    
    // Check for other cloud providers
    if (process.env.AWS_LAMBDA_FUNCTION_NAME) {
      diagnostics.environment.hostingProvider = 'aws-lambda'
    }
    
    if (process.env.GOOGLE_CLOUD_PROJECT) {
      diagnostics.environment.hostingProvider = 'google-cloud'
    }
    
    // Check for Railway
    if (process.env.RAILWAY_ENVIRONMENT) {
      diagnostics.environment.hostingProvider = 'railway'
    }
    
    // Check for Render
    if (process.env.RENDER) {
      diagnostics.environment.hostingProvider = 'render'
    }
    
    // Check for Docker
    try {
      await execAsync('cat /.dockerenv')
      diagnostics.environment.isDocker = true
    } catch {
      // Not in Docker
    }
    
    // Check for container
    try {
      const cgroupResult = await execAsync('cat /proc/1/cgroup')
      if (cgroupResult.stdout.includes('docker') || cgroupResult.stdout.includes('containerd')) {
        diagnostics.environment.isContainer = true
      }
    } catch {
      // Can't read cgroup
    }
    
  } catch (error) {
    console.log("Error detecting environment:", error)
  }
}

async function testNetworkCapabilities(diagnostics: any) {
  // First test if we can execute commands at all
  try {
    await execAsync('echo "test"')
    diagnostics.networkCapabilities.canExecCommands = true
  } catch (error) {
    diagnostics.networkCapabilities.canExecCommands = false
    console.log("Cannot execute commands:", error)
    return // If we can't execute commands, skip other tests
  }

  const commands = ['ping', 'telnet', 'nc', 'curl', 'nmap', 'netstat']
  
  for (const cmd of commands) {
    try {
      await execAsync(`which ${cmd}`)
      const capKey = `can${cmd.charAt(0).toUpperCase() + cmd.slice(1)}`
      if (capKey in diagnostics.networkCapabilities) {
        diagnostics.networkCapabilities[capKey] = true
      }
    } catch {
      const capKey = `can${cmd.charAt(0).toUpperCase() + cmd.slice(1)}`
      if (capKey in diagnostics.networkCapabilities) {
        diagnostics.networkCapabilities[capKey] = false
      }
    }
  }
  
  diagnostics.networkCapabilities.hasNetworkTools = 
    diagnostics.networkCapabilities.canPing || 
    diagnostics.networkCapabilities.canTelnet || 
    diagnostics.networkCapabilities.canNetcat || 
    diagnostics.networkCapabilities.canCurl
}

async function runConnectivityTests(printerIp: string, diagnostics: any) {
  // Test 1: Pure Node.js Socket Test (this should work even without system commands)
  try {
    await testSocketConnection(printerIp, 9100, 5000)
    diagnostics.connectivityTests.socketTest = {
      success: true,
      details: `Socket connection to ${printerIp}:9100 successful`
    }
  } catch (error: any) {
    diagnostics.connectivityTests.socketTest = {
      success: false,
      details: `Socket connection failed: ${error.message}`
    }
  }

  // Only run system command tests if we can execute commands
  if (!diagnostics.networkCapabilities.canExecCommands) {
    diagnostics.connectivityTests.icmpPing = {
      success: false,
      details: 'Cannot execute system commands (probably Vercel/serverless)'
    }
    diagnostics.connectivityTests.port9100 = {
      success: false,
      details: 'Cannot execute system commands (probably Vercel/serverless)'
    }
    diagnostics.connectivityTests.port80 = {
      success: false,
      details: 'Cannot execute system commands (probably Vercel/serverless)'
    }
    diagnostics.connectivityTests.port443 = {
      success: false,
      details: 'Cannot execute system commands (probably Vercel/serverless)'
    }
    return
  }

  // Test 2: ICMP Ping (only if commands are available)
  try {
    const pingResult = await execAsync(`ping -c 1 -W 3000 ${printerIp}`)
    diagnostics.connectivityTests.icmpPing = {
      success: true,
      details: `Ping successful: ${pingResult.stdout.split('\n')[1] || 'OK'}`
    }
  } catch (error: any) {
    diagnostics.connectivityTests.icmpPing = {
      success: false,
      details: `Ping failed: ${error.stderr || error.message}`
    }
  }
  
  // Test 3: Port 9100 (printer)
  try {
    const port9100Result = await execAsync(`timeout 5 nc -z -v ${printerIp} 9100`)
    diagnostics.connectivityTests.port9100 = {
      success: true,
      details: `Port 9100 open: ${port9100Result.stderr || 'Connected'}`
    }
  } catch (error: any) {
    try {
      // Fallback to telnet
      const telnetResult = await execAsync(`timeout 3 bash -c "echo '' | telnet ${printerIp} 9100"`)
      diagnostics.connectivityTests.port9100 = {
        success: true,
        details: `Port 9100 open via telnet`
      }
    } catch (telnetError: any) {
      diagnostics.connectivityTests.port9100 = {
        success: false,
        details: `Port 9100 closed: ${error.stderr || error.message}`
      }
    }
  }
  
  // Test 4: Port 80 (HTTP)
  try {
    const port80Result = await execAsync(`timeout 3 nc -z -v ${printerIp} 80`)
    diagnostics.connectivityTests.port80 = {
      success: true,
      details: `Port 80 open`
    }
  } catch (error: any) {
    diagnostics.connectivityTests.port80 = {
      success: false,
      details: `Port 80 closed`
    }
  }
  
  // Test 5: Port 443 (HTTPS)
  try {
    const port443Result = await execAsync(`timeout 3 nc -z -v ${printerIp} 443`)
    diagnostics.connectivityTests.port443 = {
      success: true,
      details: `Port 443 open`
    }
  } catch (error: any) {
    diagnostics.connectivityTests.port443 = {
      success: false,
      details: `Port 443 closed`
    }
  }
}

async function gatherSystemInfo(diagnostics: any) {
  // Only try to get system info if we can execute commands
  if (!diagnostics.networkCapabilities.canExecCommands) {
    diagnostics.systemInfo.uid = 'Cannot execute commands'
    diagnostics.systemInfo.gid = 'Cannot execute commands'
    diagnostics.systemInfo.processes = 'Cannot execute commands (probably Vercel/serverless)'
    return
  }

  try {
    // Get user ID
    const uidResult = await execAsync('id -u')
    diagnostics.systemInfo.uid = uidResult.stdout.trim()
  } catch {
    diagnostics.systemInfo.uid = 'unknown'
  }
  
  try {
    // Get group ID
    const gidResult = await execAsync('id -g')
    diagnostics.systemInfo.gid = gidResult.stdout.trim()
  } catch {
    diagnostics.systemInfo.gid = 'unknown'
  }
  
  try {
    // Get running processes (limited)
    const psResult = await execAsync('ps aux | head -10')
    diagnostics.systemInfo.processes = psResult.stdout
  } catch {
    diagnostics.systemInfo.processes = 'Cannot read processes'
  }
}

// Pure Node.js socket test function
function testSocketConnection(host: string, port: number, timeout: number = 5000): Promise<void> {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket()
    
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
