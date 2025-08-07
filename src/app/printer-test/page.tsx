import { PrinterTest } from '@/components/printer-test'

export default function PrinterTestPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Test Stampante KUBE2</h1>
        <p className="text-gray-600">
          Diagnosi avanzata per stampante - replicando il Python funzionante
        </p>
      </div>
      
      <PrinterTest />
    </div>
  )
}
