import { PrinterTest } from '@/app/components/printer-test'

export default function PrinterTestPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Debug Stampante - Metodi Sistema</h1>
        <p className="text-gray-600">
          Test con comandi di sistema per bypassare i problemi di Node.js Socket
        </p>
      </div>
      
      <PrinterTest />
    </div>
  )
}
