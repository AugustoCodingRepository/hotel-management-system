import { PrinterTest } from '@/app/components/printer-test'

export default function PrinterTestPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Diagnosi Stampante KUBE2</h1>
        <p className="text-gray-600">
          Strumenti avanzati per diagnosticare problemi di connessione alla stampante
        </p>
      </div>
      
      <PrinterTest />
    </div>
  )
}
