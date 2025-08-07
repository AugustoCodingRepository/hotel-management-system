import { NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"
import os from "os"

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
      hostingProvider: 'unknown'
    },
    networkCapabilities: {
      canPing: false,
      canTelnet: false,
      canNetcat: false,
      canCurl: false,
      hasNetworkTools: false
    },
    connectivityTests: {
      icmpPing: { success: false, details: '' },
      port9100: { success: false, details: '' },
      port80: { success: false, details: '' },
      port443: { success: false, details: '' }
    },
    systemInfo: {
      uid: '',
      gid: '',
      hostname: '',
      networkInterfaces: {},
      processes: ''
    }
  }

  // 1. Detect environment
  await detectEnvironment(diagnostics)
  
  // 2. Test network capabilities
  await testNetworkCapabilities(diagnostics)
  
  // 3. Run connectivity tests
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
    
    // Check hostname
    try {
      const hostnameResult = await execAsync('hostname')
      diagnostics.environment.hostname = hostnameResult.stdout.trim()
    } catch {
      diagnostics.environment.hostname = 'unknown'
    }
    
  } catch (error) {
    console.log("Error detecting environment:", error)
  }
}

async function testNetworkCapabilities(diagnostics: any) {
  const commands = ['ping', 'telnet', 'nc', 'curl', 'nmap', 'netstat']
  
  for (const cmd of commands) {
    try {
      await execAsync(`which ${cmd}`)
      diagnostics.networkCapabilities[`can${cmd.charAt(0).toUpperCase() + cmd.slice(1)}`] = true
    } catch {
      diagnostics.networkCapabilities[`can${cmd.charAt(0).toUpperCase() + cmd.slice(1)}`] = false
    }
  }
  
  diagnostics.networkCapabilities.hasNetworkTools = 
    diagnostics.networkCapabilities.canPing || 
    diagnostics.networkCapabilities.canTelnet || 
    diagnostics.networkCapabilities.canNetcat || 
    diagnostics.networkCapabilities.canCurl
}

async function runConnectivityTests(printerIp: string, diagnostics: any) {
  // Test ICMP Ping
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
  
  // Test Port 9100 (printer)
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
  
  // Test Port 80 (HTTP)
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
  
  // Test Port 443 (HTTPS)
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
    // Get network interfaces
    const interfaces = os.networkInterfaces()
    diagnostics.systemInfo.networkInterfaces = interfaces
  } catch {
    diagnostics.systemInfo.networkInterfaces = {}
  }
  
  try {
    // Get running processes (limited)
    const psResult = await execAsync('ps aux | head -10')
    diagnostics.systemInfo.processes = psResult.stdout
  } catch {
    diagnostics.systemInfo.processes = 'Cannot read processes'
  }
}
