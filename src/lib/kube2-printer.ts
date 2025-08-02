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
  private static readonly PRINTER_PORT = 9100 // Porta standard per stampanti di rete

  static async printReceipt(data: PrintData): Promise<{ success: boolean; message: string }> {
    try {
      console.log("🖨️ Preparing receipt for table", data.tableNumber)

      // Genera il contenuto della ricevuta in formato ESC/POS
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

    // Comandi ESC/POS per stampante KUBE2
    const ESC = "\x1B"
    const GS = "\x1D"

    let content = ""

    // Reset stampante
    content += ESC + "@"

    // Centra il testo
    content += ESC + "a" + "\x01"

    // Header del ristorante
    content += ESC + "!" + "\x18" // Testo grande
    content += "IL NIDO\n"
    content += ESC + "!" + "\x00" // Testo normale
    content += "Hotel Sorrento ***\n"
    content += "Via Nastro Verde 82\n"
    content += "Sorrento (80067)\n"
    content += "Tel: +39 081 878 2706\n"
    content += "\n"

    // Linea separatrice
    content += "================================\n"

    // Allinea a sinistra
    content += ESC + "a" + "\x00"

    // Informazioni tavolo
    content += ESC + "!" + "\x08" // Testo grassetto
    content += `TAVOLO: ${tableNumber}\n`
    if (assignedRoom && assignedRoom > 0) {
      content += `CAMERA: ${assignedRoom}\n`
    }
    content += ESC + "!" + "\x00" // Testo normale
    content += `DATA: ${new Date(timestamp).toLocaleDateString("it-IT")}\n`
    content += `ORA: ${new Date(timestamp).toLocaleTimeString("it-IT")}\n`
    content += "\n"

    // Linea separatrice
    content += "--------------------------------\n"

    // Header tabella
    content += "DESCRIZIONE          QTA  PREZZO\n"
    content += "--------------------------------\n"

    // Articoli
    items.forEach((item) => {
      const name = item.name.length > 20 ? item.name.substring(0, 17) + "..." : item.name
      const nameFormatted = name.padEnd(20)
      const qtyFormatted = item.quantity.toString().padStart(3)
      // Aggiunto spazio tra EUR e il prezzo
      const priceFormatted = `EUR ${item.totalPrice.toFixed(2)}`.padStart(9)

      content += `${nameFormatted} ${qtyFormatted} ${priceFormatted}\n`
    })

    // Linea separatrice
    content += "--------------------------------\n"

    // Totale
    content += ESC + "!" + "\x08" // Testo grassetto
    const totalFormatted = `EUR ${total.toFixed(2)}`.padStart(9)
    content += `TOTALE:${totalFormatted.padStart(23)}\n`
    content += ESC + "!" + "\x00" // Testo normale

    content += "\n"
    content += "================================\n"
    content += "\n"

    // Centra il testo
    content += ESC + "a" + "\x01"
    content += "Grazie per la visita!\n"
    content += "\n"
    content += "www.ilnido.it\n"
    content += "\n"
    content += "\n"
    content += "\n"
    content += "\n"

    // Taglia la carta (aggiungi più spazio prima del taglio)
    content += GS + "V" + "\x42" + "\x00"

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
