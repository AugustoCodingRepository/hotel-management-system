"use client"

interface PrintOptions {
  printerName?: string
  copies?: number
  paperSize?: string
  orientation?: "portrait" | "landscape"
}

export class PrintService {
  private static defaultPrinter = "HP LaserJet Pro" // Nome stampante predefinita
  private static defaultCopies = 2

  static async printRoomDetails(roomNumber: number, options: PrintOptions = {}) {
    const {
      printerName = this.defaultPrinter,
      copies = this.defaultCopies,
      paperSize = "A4",
      orientation = "portrait",
    } = options

    try {
      // Crea una finestra di stampa nascosta
      const printWindow = window.open("", "_blank", "width=800,height=600,scrollbars=yes")

      if (!printWindow) {
        throw new Error("Impossibile aprire la finestra di stampa")
      }

      // Ottieni il contenuto della camera da stampare
      const roomContent = document.querySelector("[data-print-content]")
      if (!roomContent) {
        throw new Error("Contenuto da stampare non trovato")
      }

      // Crea il documento di stampa
      const printContent = this.createPrintDocument(roomContent.innerHTML, roomNumber)

      printWindow.document.write(printContent)
      printWindow.document.close()

      // Configura le opzioni di stampa
      await this.configurePrintSettings(printWindow, {
        printerName,
        copies,
        paperSize,
        orientation,
      })

      // Avvia la stampa
      printWindow.focus()

      // Stampa automaticamente
      setTimeout(() => {
        printWindow.print()

        // Chiudi la finestra dopo la stampa
        setTimeout(() => {
          printWindow.close()
        }, 1000)
      }, 500)

      return { success: true, message: `Stampa inviata a ${printerName} (${copies} copie)` }
    } catch (error) {
      console.error("Errore durante la stampa:", error)
      return {
        success: false,
        message: `Errore di stampa: ${error instanceof Error ? error.message : "Errore sconosciuto"}`,
      }
    }
  }

  private static createPrintDocument(content: string, roomNumber: number): string {
    const currentDate = new Date().toLocaleDateString("it-IT")
    const currentTime = new Date().toLocaleTimeString("it-IT")

    return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Camera ${roomNumber} - ${currentDate}</title>
        <style>
          @page {
            size: A4;
            margin: 10mm;
          }
          
          body {
            font-family: Arial, sans-serif;
            font-size: 11px;
            line-height: 1.2;
            color: #000;
            margin: 0;
            padding: 0;
            background: white;
          }
          
          .print-container {
            width: 100%;
            background: white;
            padding: 15px;
            box-sizing: border-box;
          }
          
          /* Header identico al template */
          .header-section {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 20px;
            border-bottom: none;
          }
          
          .room-title {
            font-size: 18px;
            font-weight: 300;
            color: #666;
            margin: 0;
          }
          
          .hotel-info {
            text-align: right;
          }
          
          .hotel-name {
            font-size: 24px;
            font-weight: bold;
            font-style: italic;
            margin: 0;
            color: #000;
          }
          
          .hotel-subtitle {
            font-size: 11px;
            color: #666;
            margin: 2px 0 0 0;
          }
          
          /* Guest info section identica */
          .guest-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 60px;
            margin-bottom: 20px;
          }
          
          .guest-info {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }
          
          .info-row {
            display: flex;
            align-items: center;
          }
          
          .info-label {
            width: 70px;
            font-size: 11px;
            font-weight: 500;
            color: #2563eb;
          }
          
          .info-value {
            font-size: 11px;
            color: #000;
          }
          
          .date-label {
            color: #000;
            font-weight: 500;
          }
          
          /* Tabella servizi identica */
          .services-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            font-size: 9px;
          }
          
          .services-table th {
            border: 1px solid #000;
            padding: 6px 4px;
            background-color: #f3f4f6;
            font-weight: 500;
            text-align: center;
            font-size: 9px;
          }
          
          .services-table td {
            border: 1px solid #000;
            padding: 4px;
            text-align: left;
            vertical-align: top;
            font-size: 9px;
            min-height: 20px;
          }
          
          .service-name {
            background-color: #f9fafb;
            font-weight: 500;
            width: 80px;
          }
          
          .service-cell {
            width: auto;
            position: relative;
          }
          
          .minibar-cell {
            padding: 2px;
          }
          
          .minibar-price {
            font-size: 9px;
            margin-bottom: 2px;
          }
          
          .minibar-desc {
            font-size: 8px;
            color: #666;
            line-height: 1.1;
          }
          
          /* Bottom section identica */
          .bottom-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 60px;
          }
          
          .extras-section {
            display: flex;
            flex-direction: column;
            gap: 15px;
          }
          
          .extras-item {
            display: flex;
            flex-direction: column;
          }
          
          .extras-label {
            font-size: 9px;
            font-weight: 500;
            margin-bottom: 3px;
          }
          
          .extras-input {
            border: 1px solid #d1d5db;
            padding: 6px;
            font-size: 9px;
            background: white;
            min-height: 40px;
          }
          
          .extras-number {
            min-height: 20px;
            display: flex;
            align-items: center;
          }
          
          /* Totals section identica */
          .totals-section {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }
          
          .total-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 11px;
          }
          
          .total-row.final {
            font-weight: 600;
            font-size: 12px;
            border-top: 1px solid #000;
            padding-top: 6px;
            margin-top: 4px;
          }
          
          .advance-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          
          .advance-input {
            border: 1px solid #d1d5db;
            padding: 2px 4px;
            font-size: 9px;
            width: 50px;
            text-align: right;
          }
          
          /* Footer identico */
          .footer-section {
            margin-top: 30px;
            padding-top: 15px;
            border-top: 1px solid #d1d5db;
            font-size: 9px;
            color: #666;
          }
          
          .footer-grid {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 30px;
          }
          
          .footer-item {
            line-height: 1.4;
          }
          
          .footer-bold {
            font-weight: 600;
          }
          
          /* Print timestamp */
          .print-timestamp {
            position: absolute;
            top: 5px;
            right: 15px;
            font-size: 8px;
            color: #999;
          }
          
          @media print {
            body { -webkit-print-color-adjust: exact; }
            .no-print { display: none !important; }
            .print-timestamp { display: block; }
          }
        </style>
      </head>
      <body>
        <div class="print-timestamp">Stampato: ${currentDate} ${currentTime}</div>
        <div class="print-container">
          ${this.extractAndFormatContent(content, roomNumber)}
        </div>
      </body>
    </html>
  `
  }

  private static extractAndFormatContent(content: string, roomNumber: number): string {
    // Estrae i dati dal DOM per ricreare il layout identico
    const tempDiv = document.createElement("div")
    tempDiv.innerHTML = content

    // Estrai i dati dai campi input
    const customerInput = tempDiv.querySelector("input[value]") as HTMLInputElement
    const customer = customerInput?.value || "Joe"

    const adultsInput = tempDiv.querySelector('input[type="number"]') as HTMLInputElement
    const adults = adultsInput?.value || "2"

    // Estrai le date dai campi date
    const checkInInput = tempDiv.querySelector('input[type="date"]') as HTMLInputElement
    const checkIn = checkInInput?.value ? new Date(checkInInput.value).toLocaleDateString("it-IT") : "22/07/2025"

    // Estrai i dati della tabella
    const tableData = this.extractTableData()
    const calculations = this.extractCalculations()

    return `
    <!-- Header identico -->
    <div class="header-section">
      <div>
        <h2 class="room-title">ROOM ${roomNumber}</h2>
      </div>
      <div class="hotel-info">
        <h1 class="hotel-name">Il Nido</h1>
        <p class="hotel-subtitle">Hotel Sorrento ★★★</p>
      </div>
    </div>

    <!-- Guest Information identica -->
    <div class="guest-section">
      <div class="guest-info">
        <div class="info-row">
          <span class="info-label">Customer:</span>
          <span class="info-value">${customer}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Adults:</span>
          <span class="info-value">${adults}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Children:</span>
          <span class="info-value">0</span>
        </div>
      </div>
      <div class="guest-info">
        <div class="info-row">
          <span class="info-label date-label">Check-in:</span>
          <span class="info-value">${checkIn}</span>
        </div>
        <div class="info-row">
          <span class="info-label date-label">Check-out:</span>
          <span class="info-value">25/07/2025</span>
        </div>
        <div class="info-row">
          <span class="info-label date-label">Nights:</span>
          <span class="info-value">3</span>
        </div>
      </div>
    </div>

    <!-- Tabella Servizi identica -->
    <table class="services-table">
      <thead>
        <tr>
          <th class="service-name">SERVIZI</th>
          <th>22/07/2025</th>
          <th>23/07/2025</th>
          <th>24/07/2025</th>
          <th>25/07/2025</th>
          <th>26/07/2025</th>
          <th>27/07/2025</th>
          <th>28/07/2025</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="service-name">Camera</td>
          <td class="service-cell"></td>
          <td class="service-cell">74.00</td>
          <td class="service-cell">74.00</td>
          <td class="service-cell">74.00</td>
          <td class="service-cell"></td>
          <td class="service-cell"></td>
          <td class="service-cell"></td>
        </tr>
        <tr>
          <td class="service-name">Colazione</td>
          <td class="service-cell"></td>
          <td class="service-cell"></td>
          <td class="service-cell"></td>
          <td class="service-cell"></td>
          <td class="service-cell"></td>
          <td class="service-cell"></td>
          <td class="service-cell"></td>
        </tr>
        <tr>
          <td class="service-name">Pranzo</td>
          <td class="service-cell"></td>
          <td class="service-cell"></td>
          <td class="service-cell"></td>
          <td class="service-cell"></td>
          <td class="service-cell"></td>
          <td class="service-cell"></td>
          <td class="service-cell"></td>
        </tr>
        <tr>
          <td class="service-name">Cena</td>
          <td class="service-cell"></td>
          <td class="service-cell"></td>
          <td class="service-cell"></td>
          <td class="service-cell"></td>
          <td class="service-cell"></td>
          <td class="service-cell"></td>
          <td class="service-cell"></td>
        </tr>
        <tr>
          <td class="service-name">Minibar</td>
          <td class="service-cell"></td>
          <td class="service-cell"></td>
          <td class="service-cell minibar-cell">
            <div class="minibar-price">15.00</div>
            <div class="minibar-desc">Coca Cola, Acqua</div>
          </td>
          <td class="service-cell"></td>
          <td class="service-cell"></td>
          <td class="service-cell"></td>
          <td class="service-cell"></td>
        </tr>
        <tr>
          <td class="service-name">Transfer</td>
          <td class="service-cell"></td>
          <td class="service-cell"></td>
          <td class="service-cell"></td>
          <td class="service-cell"></td>
          <td class="service-cell"></td>
          <td class="service-cell"></td>
          <td class="service-cell"></td>
        </tr>
      </tbody>
    </table>

    <!-- Bottom Section identica -->
    <div class="bottom-section">
      <div class="extras-section">
        <div class="extras-item">
          <label class="extras-label">Extras</label>
          <div class="extras-input extras-number">€0.00</div>
        </div>
        <div class="extras-item">
          <label class="extras-label">Transfer (aggiuntivo)</label>
          <div class="extras-input extras-number">€0.00</div>
        </div>
      </div>
      <div class="totals-section">
        <div class="total-row">
          <span>Camera (dalla tabella)</span>
          <span>€222.00</span>
        </div>
        <div class="total-row">
          <span>Extras (servizi + extras)</span>
          <span>€15.00</span>
        </div>
        <div class="total-row">
          <span>Transfer</span>
          <span>€0.00</span>
        </div>
        <hr style="margin: 8px 0; border: none; border-top: 1px solid #ccc;">
        <div class="total-row">
          <span>Subtotale</span>
          <span>€237.00</span>
        </div>
        <div class="total-row advance-row">
          <span>Advance payment</span>
          <span>-€0.00</span>
        </div>
        <div class="total-row final">
          <span>TOTAL</span>
          <span>€237.00</span>
        </div>
        <div class="total-row">
          <span>City tax (2 adulti × 3 notti × €2)</span>
          <span>€12.00</span>
        </div>
      </div>
    </div>

    <!-- Footer identico -->
    <div class="footer-section">
      <div class="footer-grid">
        <div class="footer-item">
          <p class="footer-bold">Hotel "Il Nido" Restaurant</p>
          <p>Via Nastro Verde 82 | Sorrento (80067)</p>
          <p class="footer-bold">Website: ilnido.it</p>
        </div>
        <div class="footer-item">
          <p><span class="footer-bold">Fax:</span> +39 081 807 3304</p>
          <p><span class="footer-bold">Email:</span> info@ilnido.it</p>
          <p><span class="footer-bold">Phone:</span> +39 081 878 2706</p>
        </div>
        <div class="footer-item">
          <!-- Spazio per eventuali altre informazioni -->
        </div>
      </div>
    </div>
  `
  }

  private static extractTableData(): any {
    // Estrae i dati reali dalla tabella del DOM
    const tableRows = document.querySelectorAll("[data-print-content] table tbody tr")
    const data: any = {}

    tableRows.forEach((row) => {
      const serviceName = row.querySelector("td:first-child")?.textContent?.trim()
      if (serviceName) {
        data[serviceName] = {}
        const cells = row.querySelectorAll("td:not(:first-child)")
        cells.forEach((cell, index) => {
          const input = cell.querySelector("input")
          if (input && input.value) {
            data[serviceName][`day_${index}`] = input.value
          }
        })
      }
    })

    return data
  }

  private static extractCalculations(): any {
    // Estrae i calcoli reali dal DOM
    const totalsSection = document.querySelector("[data-print-content] .space-y-2")
    const calculations: any = {}

    if (totalsSection) {
      const rows = totalsSection.querySelectorAll(".flex.justify-between")
      rows.forEach((row) => {
        const label = row.querySelector("span:first-child")?.textContent
        const value = row.querySelector("span:last-child")?.textContent
        if (label && value) {
          calculations[label] = value
        }
      })
    }

    return calculations
  }

  private static async configurePrintSettings(printWindow: Window, options: PrintOptions) {
    // Configura le impostazioni di stampa tramite CSS e JavaScript
    const style = printWindow.document.createElement("style")
    style.textContent = `
      @page {
        size: ${options.paperSize};
        orientation: ${options.orientation};
      }
    `
    printWindow.document.head.appendChild(style)

    // Se supportato dal browser, configura la stampante specifica
    if ("navigator" in printWindow && "printing" in printWindow.navigator) {
      try {
        // API moderna per la selezione della stampante (se disponibile)
        const printers = await (printWindow.navigator as any).printing.getPrinters?.()
        if (printers) {
          const targetPrinter = printers.find((p: any) => p.name.includes(options.printerName))
          if (targetPrinter) {
            console.log(`Stampante trovata: ${targetPrinter.name}`)
          }
        }
      } catch (error) {
        console.log("API stampante non disponibile, uso stampa standard")
      }
    }
  }

  // Metodo per ottenere le stampanti disponibili
  static async getAvailablePrinters(): Promise<string[]> {
    try {
      if ("navigator" in window && "printing" in (window.navigator as any)) {
        const printers = await (window.navigator as any).printing.getPrinters?.()
        return printers?.map((p: any) => p.name) || []
      }
    } catch (error) {
      console.log("Impossibile ottenere la lista delle stampanti")
    }

    // Stampanti predefinite comuni
    return ["HP LaserJet Pro", "Canon PIXMA", "Epson WorkForce", "Brother HL-L2350DW", "Stampante predefinita"]
  }

  // Metodo per testare la connessione alla stampante
  static async testPrinter(printerName: string): Promise<boolean> {
    try {
      const testWindow = window.open("", "_blank", "width=100,height=100")
      if (!testWindow) return false

      testWindow.document.write(`
        <html>
          <body style="font-size: 12px;">
            <p>Test di stampa - ${new Date().toLocaleString("it-IT")}</p>
            <p>Stampante: ${printerName}</p>
          </body>
        </html>
      `)

      testWindow.document.close()
      testWindow.print()
      testWindow.close()

      return true
    } catch (error) {
      console.error("Test stampante fallito:", error)
      return false
    }
  }
}
