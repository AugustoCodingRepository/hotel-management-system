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
    
    // Metodo 1: Prova con netcat (nc)
    try {
      console.log("🔌 Trying with netcat...")
      await execAsync(`timeout 10 nc ${printerIp} 9100 < ${tempFile}`)
      
      // Cleanup
      unlinkSync(tempFile)
      
      return { success: true }
    } catch (ncError) {
      console.log("❌ Netcat failed, trying curl...")
      
      // Metodo 2: Prova con curl
      try {
        await execAsync(`timeout 10 curl -X POST --data-binary @${tempFile} http://${printerIp}:9100/`)
        
        // Cleanup
        unlinkSync(tempFile)
        
        return { success: true }
      } catch (curlError) {
        console.log("❌ Curl failed, trying lp command...")
        
        // Metodo 3: Prova con lp (Linux printing system)
        try {
          await execAsync(`timeout 10 lp -d ${printerIp} -o raw ${tempFile}`)
          
          // Cleanup
          unlinkSync(tempFile)
          
          return { success: true }
        } catch (lpError) {
          console.log("❌ All system methods failed")
          
          // Cleanup
          try {
            unlinkSync(tempFile)
          } catch (e) {
            // Ignora errori di cleanup
          }
          
          return { 
            success: false, 
            error: `Tutti i metodi di sistema falliti: nc, curl, lp` 
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
