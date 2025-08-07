import { PrinterTest } from "@/app/components/printer-test"

export default function PrinterTestPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Test Stampante</h1>
          <p className="text-gray-600">Verifica la connessione alla stampante KUBE2</p>
        </div>
        
        <PrinterTest />
      </div>
    </div>
  )
}
