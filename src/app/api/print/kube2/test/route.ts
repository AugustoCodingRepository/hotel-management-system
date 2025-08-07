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
      console.log("🏓 Testing ICMP ping...")
      const pingResult = await execAsync(`ping -c 1 -W 3000 ${printerIp}`)
      console.log("✅ Ping ICMP successful")
      console.log("Ping output:", pingResult.stdout)
    } catch (pingError: any) {
      console.log("❌ Ping ICMP failed")
      console.log("Ping error:", pingError.stderr || pingError.message)
      
      return {
        success: false,
        message: "Ping ICMP fallito - Problema di rete di base",
        details: `La stampante all'IP ${printerIp} non risponde al ping. Verifica:\n- IP corretto\n- Stampante accesa\n- Stessa rete\n- Firewall ICMP\n\nErrore: ${pingError.stderr || pingError.message}`
      }
    }

    // Test 2: Telnet sulla porta 9100
    try {
      console.log("📡 Testing telnet to port 9100...")
      const telnetResult = await execAsync(`timeout 5 bash -c "echo '' | telnet ${printerIp} 9100"`)
      console.log("✅ Telnet 9100 successful")
      console.log("Telnet output:", telnetResult.stdout)
      
      return {
        success: true,
        message: "Connessione completa OK",
        details: "Ping ICMP e Telnet 9100 funzionano. Il problema era nei socket Node.js."
      }
    } catch (telnetError: any) {
      console.log("❌ Telnet 9100 failed")
      console.log("Telnet error:", telnetError.stderr || telnetError.message)
      
      // Test 3: Nmap per vedere porte aperte
      try {
        console.log("🔍 Scanning ports with nmap...")
        const nmapResult = await execAsync(`nmap -p 9100,515,631,80,23 ${printerIp}`)
        console.log("Nmap result:", nmapResult.stdout)
        
        return {
          success: false,
          message: "Ping OK ma porta 9100 chiusa",
          details: `La stampante risponde al ping ma la porta 9100 è chiusa o filtrata.\n\nScan porte:\n${nmapResult.stdout}\n\nLa stampante potrebbe usare una porta diversa o un protocollo diverso.`
        }
      } catch (nmapError) {
        return {
          success: false,
          message: "Ping OK ma porta 9100 non raggiungibile",
          details: "La stampante risponde al ping ma telnet sulla porta 9100 fallisce. Nmap non disponibile per ulteriori test."
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
