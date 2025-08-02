"use client"

import { useState, useEffect } from "react"
import { Button } from "@/app/components/ui/button"
import { Calendar, ArrowLeft, FileText } from "lucide-react"
import type { DailyRevenue } from "@/lib/mongodb-schemas"
import { RealTimeClock } from "./real-time-clock"

interface RevenueArchiveProps {
  onBack: () => void
}

export function RevenueArchive({ onBack }: RevenueArchiveProps) {
  const [revenues, setRevenues] = useState<DailyRevenue[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [downloadingDate, setDownloadingDate] = useState<string | null>(null)

  const loadRevenues = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/daily-revenue")
      const data = await response.json()

      if (data.success) {
        setRevenues(data.revenues || [])
      } else {
        setError("Errore nel caricamento degli incassi")
      }
    } catch (err) {
      console.error("Error loading revenues:", err)
      setError("Errore di connessione")
    } finally {
      setLoading(false)
    }
  }

  const downloadPDF = async (date: string) => {
    try {
      setDownloadingDate(date)

      // Apri direttamente l'URL in una nuova finestra
      const url = `/api/daily-revenue/pdf?date=${date}`
      window.open(url, "_blank")
    } catch (err) {
      console.error("Error opening PDF:", err)
      setError("Errore nell'apertura del PDF")
    } finally {
      setDownloadingDate(null)
    }
  }

  useEffect(() => {
    loadRevenues()
  }, [])

  const formatDate = (dateString: string) => {
    const [day, month, year] = dateString.split("_")
    return `${day}/${month}/${year}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <Calendar className="animate-pulse h-8 w-8 mx-auto mb-4" />
          <p>Caricamento archivio incassi...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-300 px-6 py-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button onClick={onBack} variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Torna alla Sala
            </Button>
            <h1 className="text-lg font-medium text-gray-800">Archivio Incassi - Visualizza Report</h1>
          </div>
          <RealTimeClock />
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-auto">
          <div className="max-w-4xl mx-auto">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-600">{error}</p>
                <Button onClick={loadRevenues} className="mt-2" size="sm">
                  Riprova
                </Button>
              </div>
            )}

            {revenues.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nessun incasso registrato</h3>
                <p className="text-gray-500">Gli incassi appariranno qui quando chiuderai i primi ordini.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 text-blue-800">
                    <FileText className="h-5 w-5" />
                    <span className="font-medium">Seleziona una data per visualizzare il report degli incassi</span>
                  </div>
                </div>

                {revenues.map((revenue) => (
                  <div
                    key={revenue.date}
                    className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-medium text-gray-800">{formatDate(revenue.date)}</h3>
                        <p className="text-sm text-gray-500">{revenue.soldItems.length} articoli venduti</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-600">EUR {revenue.totalRevenue.toFixed(2)}</div>
                          <div className="text-sm text-gray-500">Incasso totale</div>
                        </div>
                        <Button
                          onClick={() => downloadPDF(revenue.date)}
                          disabled={downloadingDate === revenue.date}
                          className="flex items-center gap-2"
                        >
                          {downloadingDate === revenue.date ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              Aprendo...
                            </>
                          ) : (
                            <>
                              <FileText className="h-4 w-4" />
                              Visualizza Report
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
