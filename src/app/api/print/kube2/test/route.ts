import { type NextRequest, NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    const { printerIp } = await request.json()

    console.log(`🧪 Testing printer connection using system tools at ${printerIp}`)

    const result = await testPrinterWithSystemTools(printerIp)

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

async function testPrinterWithSystemTools(printerIp: string): Promise<{ success: boolean; message: string; details?: string }> {
  try {
    console.log(`🔍 Testing with system tools: ${printerIp}`)
    
    // Test 1: Ping ICMP
    try {
      const pingResult = await execAsync(`ping -c 1 -W 3000 ${printerIp}`)
      console.log("✅ Ping ICMP successful")
    } catch (pingError) {
      return {
        success: false,
        message: "Ping ICMP fallito",
        details: "La stampante non risponde al ping ICMP"
      }
    }

    // Test 2: Telnet sulla porta 9100
    try {
      const telnetResult = await execAsync(`timeout 5 bash -c "echo '' | telnet ${printerIp} 9100"`)
      console.log("✅ Telnet 9100 successful")
      
      return {
        success: true,
        message: "Connessione sistema OK",
        details: "Ping e Telnet funzionano. Il problema è nel codice Node.js."
      }
    } catch (telnetError) {
      console.log("❌ Telnet 9100 failed")
      
      // Test 3: Nmap per vedere porte aperte
      try {
        const nmapResult = await execAsync(`nmap -p 9100,515,631,80,23 ${printerIp}`)
        console.log("Nmap result:", nmapResult.stdout)
        
        return {
          success: false,
          message: "Porta 9100 chiusa",
          details: `Telnet fallito. Porte scansionate: ${nmapResult.stdout}`
        }
      } catch (nmapError) {
        return {
          success: false,
          message: "Porta 9100 non raggiungibile",
          details: "Telnet fallito e nmap non disponibile"
        }
      }
    }
  } catch (error) {
    return {
      success: false,
      message: "Errore test sistema",
      details: error instanceof Error ? error.message : "Errore sconosciuto"
    }
  }
}
