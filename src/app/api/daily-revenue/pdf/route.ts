import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import type { DailyRevenue } from "@/lib/mongodb-schemas"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date")

    if (!date) {
      return NextResponse.json({ success: false, error: "Data richiesta" }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    const collection = db.collection("daily_revenue")

    const revenue = (await collection.findOne({ date })) as DailyRevenue | null

    if (!revenue) {
      return NextResponse.json({ success: false, error: "Nessun incasso trovato per questa data" }, { status: 404 })
    }

    console.log("Revenue data:", JSON.stringify(revenue, null, 2))
    console.log("Sold items:", revenue.soldItems.length)

    // Genera il contenuto della tabella
    const tableContent = generateTableContent(revenue)

    // Crea il contenuto HTML con tabella
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Incassi ${formatDate(date)}</title>
    <style>
        @media print {
            body { margin: 0; }
        }
        body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
            font-size: 12px;
            line-height: 1.4;
        }
        .header { 
            text-align: center; 
            margin-bottom: 30px; 
            border-bottom: 2px solid #333; 
            padding-bottom: 15px; 
        }
        .hotel-name { 
            font-size: 24px; 
            font-weight: bold; 
            color: #333; 
            margin-bottom: 5px;
        }
        .date { 
            font-size: 18px; 
            color: #666; 
        }
        table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 20px 0;
        }
        th, td { 
            border: 1px solid #ddd; 
            padding: 8px; 
            text-align: left;
        }
        th { 
            background-color: #f2f2f2; 
            font-weight: bold;
            text-align: center;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .total-row { 
            background-color: #e8f4fd; 
            font-weight: bold;
        }
        .footer { 
            text-align: center; 
            margin-top: 40px; 
            padding-top: 20px; 
            border-top: 1px solid #ddd; 
            color: #666; 
            font-size: 10px;
        }
        .debug { 
            background: #fffbeb; 
            border: 1px solid #f59e0b; 
            padding: 10px; 
            margin: 10px 0; 
            font-size: 10px;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="hotel-name">Hotel Il Nido</div>
        <div class="date">Incassi del ${formatDate(date)}</div>
    </div>

    <div class="debug">
        <strong>Debug Info:</strong><br>
        Data richiesta: ${date}<br>
        Articoli trovati: ${revenue.soldItems.length}<br>
        Totale incassi: EUR ${revenue.totalRevenue.toFixed(2)}
    </div>

    <table>
        <thead>
            <tr>
                <th>Prodotto</th>
                <th>Categoria</th>
                <th>Tavolo</th>
                <th>Orario</th>
                <th>Quantità</th>
                <th>Prezzo Unit.</th>
                <th>Totale</th>
            </tr>
        </thead>
        <tbody>
            ${tableContent}
            <tr class="total-row">
                <td colspan="6" class="text-right"><strong>TOTALE GENERALE:</strong></td>
                <td class="text-right"><strong>EUR ${revenue.totalRevenue.toFixed(2)}</strong></td>
            </tr>
        </tbody>
    </table>

    <div class="footer">
        <p>Hotel Il Nido - www.ilnido.it</p>
        <p>Generato il ${new Date().toLocaleString("it-IT")}</p>
    </div>
</body>
</html>`

    return new NextResponse(htmlContent, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="incassi_${formatDate(date)}.html"`,
      },
    })
  } catch (error) {
    console.error("Error generating PDF:", error)
    return NextResponse.json({ success: false, error: "Errore nella generazione del PDF" }, { status: 500 })
  }
}

function formatDate(dateString: string) {
  const [day, month, year] = dateString.split("_")
  return `${day}-${month}-${year}`
}

function generateTableContent(revenue: DailyRevenue): string {
  if (!revenue.soldItems || revenue.soldItems.length === 0) {
    return '<tr><td colspan="7" class="text-center">Nessun incasso registrato per questa data</td></tr>'
  }

  // Ordina gli articoli per orario
  const sortedItems = revenue.soldItems.sort((a, b) => new Date(a.soldAt).getTime() - new Date(b.soldAt).getTime())

  return sortedItems
    .map(
      (item) => `
        <tr>
            <td>${item.productName || "N/A"}</td>
            <td class="text-center">${item.categoryName || "N/A"}</td>
            <td class="text-center">${item.tableNumber || "N/A"}</td>
            <td class="text-center">${
              item.soldAt
                ? new Date(item.soldAt).toLocaleTimeString("it-IT", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "N/A"
            }</td>
            <td class="text-center">${item.quantity || 0}</td>
            <td class="text-right">EUR ${(item.unitPrice || 0).toFixed(2)}</td>
            <td class="text-right">EUR ${(item.totalRevenue || 0).toFixed(2)}</td>
        </tr>
      `,
    )
    .join("")
}
