import { type NextRequest, NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"
import os from "os"

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    const { printerIp } = await request.json()

    console.log(`🧪 Testing printer connection using system tools at ${printerIp}`)
    console.log(`🖥️ Running on: ${os.platform()} ${os.release()}`)
    console.log(`🌐 Environment: ${process.env.NODE_ENV}, Vercel: ${!!process.env.VERCEL}`)

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
    
    // Prima verifica le interfacce di rete del server
    const interfaces = os.networkInterfaces()
    console.log("🌐 Server network interfaces:", Object.keys(interfaces))
    
    // Test 1: Ping ICMP con output dettagliato
    try {
      console.log("🏓 Testing ICMP ping...")
      
      // Prova diversi formati di ping per compatibilità
      let pingCommand = `ping -c 1 -W 3000 ${printerIp}`
      
      // Su alcuni sistemi il timeout è -w invece di -W
      if (os.platform() === 'linux') {
        pingCommand = `ping -c 1 -w 3 ${printerIp}`
      }
      
      console.log(`Executing: ${pingCommand}`)
      const pingResult = await execAsync(pingCommand)
      
      console.log("✅ Ping ICMP successful")
      console.log("Ping stdout:", pingResult.stdout)
      console.log("Ping stderr:", pingResult.stderr)
      
      // Estrai il tempo di risposta dal ping
      const pingTime = pingResult.stdout.match(/time=(\d+\.?\d*)/)?.[1] || 'unknown'
      
    } catch (pingError: any) {
      console.log("❌ Ping ICMP failed")
      console.log("Ping error stdout:", pingError.stdout)
      console.log("Ping error stderr:", pingError.stderr)
      console.log("Ping error code:", pingError.code)
      
      // Prova un ping alternativo
      try {
        console.log("🔄 Trying alternative ping format...")
        const altPingResult = await execAsync(`ping -c 1 ${printerIp}`)
        console.log("✅ Alternative ping successful:", altPingResult.stdout)
      } catch (altPingError: any) {
        console.log("❌ Alternative ping also failed:", altPingError.stderr)
        
        return {
          success: false,
          message: "Ping fallito dal server",
          details: `Il server non riesce a pingare ${printerIp}.\n\nDettagli errore:\n${pingError.stderr || pingError.message}\n\nQuesto può accadere se:\n- Il server è in un container con restrizioni di rete\n- Vercel/hosting blocca ICMP\n- Firewall del server blocca ping in uscita\n\nProva il test della porta 9100 direttamente.`
        }
      }
    }

    // Test 2: Test della porta 9100 con timeout breve
    try {
      console.log("📡 Testing port 9100 connectivity...")
      
      // Prova con netcat se disponibile
      try {
        const ncResult = await execAsync(`timeout 5 nc -z -v ${printerIp} 9100`)
        console.log("✅ Port 9100 is open (netcat)")
        console.log("NC output:", ncResult.stdout, ncResult.stderr)
        
        return {
          success: true,
          message: "Connessione porta 9100 OK",
          details: "La porta 9100 è aperta e raggiungibile. La stampante dovrebbe funzionare."
        }
      } catch (ncError: any) {
        console.log("❌ Netcat test failed:", ncError.stderr)
        
        // Prova con telnet
        try {
          console.log("📞 Trying telnet...")
          const telnetResult = await execAsync(`timeout 5 bash -c "echo '' | telnet ${printerIp} 9100"`)
          console.log("✅ Telnet successful")
          
          return {
            success: true,
            message: "Connessione telnet OK",
            details: "Telnet alla porta 9100 funziona. La stampante è raggiungibile."
          }
        } catch (telnetError: any) {
          console.log("❌ Telnet failed:", telnetError.stderr)
          
          // Test finale con curl
          try {
            console.log("🌐 Trying HTTP connection...")
            const curlResult = await execAsync(`timeout 5 curl -v --connect-timeout 3 http://${printerIp}:9100/`)
            console.log("✅ HTTP connection successful")
            
            return {
              success: true,
              message: "Connessione HTTP OK",
              details: "La stampante risponde su HTTP. Potrebbe essere configurata diversamente."
            }
          } catch (curlError: any) {
            console.log("❌ All connection tests failed")
            
            return {
              success: false,
              message: "Porta 9100 non raggiungibile dal server",
              details: `Tutti i test di connessione sono falliti:\n\n- netcat: ${ncError.stderr || ncError.message}\n- telnet: ${telnetError.stderr || telnetError.message}\n- curl: ${curlError.stderr || curlError.message}\n\nLa stampante potrebbe:\n- Usare una porta diversa\n- Avere un firewall attivo\n- Essere configurata solo per protocolli specifici`
            }
          }
        }
      }
    } catch (error: any) {
      return {
        success: false,
        message: "Errore test connettività",
        details: `Errore durante i test di connettività: ${error.message}`
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
