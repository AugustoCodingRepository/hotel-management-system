export interface PrintItem {
  name: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

export interface PrintData {
  tableNumber: number
  items: PrintItem[]
  total: number
  assignedRoom?: number
  timestamp: string
}

export class Kube2Printer {
  private static readonly PRINTER_IP = "10.0.0.55"
  private static readonly PRINTER_PORT = 9100

  static async printReceipt(data: PrintData): Promise<{ success: boolean; message: string }> {
    try {
      console.log("🖨️ Preparing receipt for table", data.tableNumber)

      // Genera il contenuto della ricevuta in formato ESC/POS migliorato
      const receiptContent = this.generateReceiptContent(data)

      // Invia alla stampante tramite API di stampa
      const response = await fetch("/api/print/kube2", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          printerIp: this.PRINTER_IP,
          content: receiptContent,
          tableNumber: data.tableNumber,
        }),
      })

      const result = await response.json()

      if (result.success) {
        console.log("✅ Receipt printed successfully")
        return { success: true, message: "Conto stampato con successo" }
      } else {
        console.error("❌ Print failed:", result.error)
        return { success: false, message: `Errore di stampa: ${result.error}` }
      }
    } catch (error) {
      console.error("❌ Print error:", error)
      return { success: false, message: "Errore di connessione alla stampante" }
    }
  }

  private static generateReceiptContent(data: PrintData): string {
    const { tableNumber, items, total, assignedRoom, timestamp } = data

    // Comandi ESC/POS ottimizzati per Kube II
    const ESC = "\x1B"
    const GS = "\x1D"

    let content = ""

    // Reset stampante (già fatto nell'API, ma per sicurezza)
    content += ESC + "@"

    // Allineamento centro
    content += ESC + "a" + "\x01"

    // Header del ristorante - stile migliorato
    content += ESC + "!" + "\x18" // Testo grande e grassetto
    content += "IL NIDO\n"
    content += ESC + "!" + "\x00" // Reset stile
    content += "Hotel Sorrento ***\n"
    content += "Via Nastro Verde 82\n"
    content += "Sorrento (80067)\n"
    content += "Tel: +39 081 878 2706\n"
    content += "\n"

    // Linea separatrice
    content += "================================\n"

    // Allineamento sinistra
    content += ESC + "a" + "\x00"

    // Informazioni ordine
    content += ESC + "!" + "\x08" // Grassetto
    content += `TAVOLO: ${tableNumber}\n`
    if (assignedRoom && assignedRoom > 0) {
      content += `CAMERA: ${assignedRoom}\n`
    }
    content += ESC + "!" + "\x00" // Reset grassetto
    content += `DATA: ${new Date(timestamp).toLocaleDateString("it-IT")}\n`
    content += `ORA: ${new Date(timestamp).toLocaleTimeString("it-IT")}\n`
    content += `CAMERIERE: Giuseppe\n` // Come nel Python
    content += "\n"

    // Linea separatrice
    content += "--------------------------------\n"
    content += ESC + "!" + "\x08" // Grassetto
    content += "ORDINE:\n"
    content += ESC + "!" + "\x00" // Reset grassetto
    content += "--------------------------------\n"

    // Articoli - formattazione migliorata come nel Python
    items.forEach((item) => {
      const name = item.name.length > 20 ? item.name.substring(0, 17) + "..." : item.name
      const line = `${item.quantity}x ${name}`
      const priceStr = `EUR ${item.totalPrice.toFixed(2)}`
      
      // Calcola spazi per allineamento (32 caratteri totali)
      const maxWidth = 32
      const spacesNeeded = Math.max(1, maxWidth - line.length - priceStr.length)
      const formattedLine = line + " ".repeat(spacesNeeded) + priceStr
      
      content += formattedLine + "\n"
    })

    // Linea separatrice
    content += "--------------------------------\n"

    // Totale - allineato a destra e grassetto
    content += ESC + "a" + "\x02" // Allinea destra
    content += ESC + "!" + "\x08" // Grassetto
    content += `TOTALE: EUR ${total.toFixed(2)}\n`
    content += ESC + "!" + "\x00" // Reset grassetto
    content += ESC + "a" + "\x01" // Torna al centro

    content += "================================\n"
    content += "\n"

    // Footer centrato
    content += "Grazie per la visita!\n"
    content += "Arrivederci!\n" // Come nel Python
    content += "\n"
    content += "www.ilnido.it\n"
    content += "\n"
    content += "\n"

    // Taglia carta - comando migliorato
    content += GS + "V" + "\x00" // GS V 0 - taglio completo come nel Python

    return content
  }

  // Test di connessione alla stampante
  static async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch("/api/print/kube2/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          printerIp: this.PRINTER_IP,
        }),
      })

      const result = await response.json()
      return result
    } catch (error) {
      return { success: false, message: "Errore di connessione" }
    }
  }
}
