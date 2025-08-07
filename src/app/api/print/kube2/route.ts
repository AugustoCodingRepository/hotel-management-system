import { type NextRequest, NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"
import { writeFileSync, unlinkSync } from "fs"
import { join } from "path"

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    const { printerIp, content, tableNumber } = await request.json()

    console.log(`🖨️ Printing receipt for table ${tableNumber} using system tools`)

    const result = await printWithSystemTools(printerIp, content)

    if (result.success) {
      console.log("✅ Receipt sent to printer successfully")
      return NextResponse.json({
        success: true,
        message: "Conto inviato alla stampante",
      })
    } else {
      console.error("❌ Print failed:", result.error)
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("❌ Print API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Errore interno del server di stampa",
      },
      { status: 500 },
    )
  }
}

async function printWithSystemTools(printerIp: string, content: string): Promise<{ success: boolean; error?: string }> {
  const tempFile = join('/tmp', `receipt_${Date.now()}.txt`)
  
  try {
    console.log(`📝 Creating temp file: ${tempFile}`)
    
    // Scrivi il contenuto in un file temporaneo
    writeFileSync(tempFile, content, 'binary')
    
    // Prima verifica che la stampante sia raggiungibile
    try {
      console.log("🏓 Quick ping test before printing...")
      await execAsync(`ping -c 1 -W 2000 ${printerIp}`)
      console.log("✅ Printer is reachable")
    } catch (pingError) {
      unlinkSync(tempFile)
      return { 
        success: false, 
        error: "Stampante non raggiungibile - ping fallito" 
      }
    }
    
    // Metodo 1: Prova con netcat (nc)
    try {
      console.log("🔌 Trying with netcat...")
      await execAsync(`timeout 10 nc ${printerIp} 9100 < ${tempFile}`)
      
      // Cleanup
      unlinkSync(tempFile)
      
      return { success: true }
    } catch (ncError: any) {
      console.log("❌ Netcat failed:", ncError.message)
      
      // Metodo 2: Prova con curl
      try {
        console.log("🌐 Trying with curl...")
        await execAsync(`timeout 10 curl -X POST --data-binary @${tempFile} http://${printerIp}:9100/ --connect-timeout 5`)
        
        // Cleanup
        unlinkSync(tempFile)
        
        return { success: true }
      } catch (curlError: any) {
        console.log("❌ Curl failed:", curlError.message)
        
        // Metodo 3: Prova con lp (Linux printing system)
        try {
          console.log("🖨️ Trying with lp command...")
          await execAsync(`timeout 10 lp -d ${printerIp} -o raw ${tempFile}`)
          
          // Cleanup
          unlinkSync(tempFile)
          
          return { success: true }
        } catch (lpError: any) {
          console.log("❌ All system methods failed")
          console.log("NC Error:", ncError.message)
          console.log("Curl Error:", curlError.message)
          console.log("LP Error:", lpError.message)
          
          // Cleanup
          try {
            unlinkSync(tempFile)
          } catch (e) {
            // Ignora errori di cleanup
          }
          
          return { 
            success: false, 
            error: `Tutti i metodi falliti:\n- netcat: ${ncError.message}\n- curl: ${curlError.message}\n- lp: ${lpError.message}` 
          }
        }
      }
    }
  } catch (error) {
    // Cleanup in caso di errore
    try {
      unlinkSync(tempFile)
    } catch (e) {
      // Ignora errori di cleanup
    }
    
    return { 
      success: false, 
      error: `Errore sistema: ${error instanceof Error ? error.message : 'Errore sconosciuto'}` 
    }
  }
}
