"use client"

import { useState, useEffect, useRef } from "react"

interface DebugLog {
  timestamp: string
  action: string
  roomNumber: number
  data: any
  type: "info" | "success" | "error"
}

export function DebugPanel({ roomNumber }: { roomNumber: number }) {
  const [logs, setLogs] = useState<DebugLog[]>([])
  const [isVisible, setIsVisible] = useState(false)
  const isSetupRef = useRef(false)

  useEffect(() => {
    if (isSetupRef.current) return
    isSetupRef.current = true

    const originalConsoleLog = console.log
    const originalConsoleError = console.error

    console.log = (...args) => {
      originalConsoleLog(...args)

      // Use setTimeout to avoid setState during render
      setTimeout(() => {
        const message = args.join(" ")
        if (message.includes("💾") || message.includes("✅") || message.includes("🔄") || message.includes("🆕")) {
          setLogs((prev) => [
            ...prev.slice(-9),
            {
              timestamp: new Date().toLocaleTimeString(),
              action: message,
              roomNumber,
              data: args[1] || null,
              type: message.includes("✅") ? "success" : "info",
            },
          ])
        }
      }, 0)
    }

    console.error = (...args) => {
      originalConsoleError(...args)

      // Use setTimeout to avoid setState during render
      setTimeout(() => {
        const message = args.join(" ")
        setLogs((prev) => [
          ...prev.slice(-9),
          {
            timestamp: new Date().toLocaleTimeString(),
            action: `ERROR: ${message}`,
            roomNumber,
            data: args[1] || null,
            type: "error",
          },
        ])
      }, 0)
    }

    return () => {
      console.log = originalConsoleLog
      console.error = originalConsoleError
    }
  }, [roomNumber])

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-gray-800 text-white px-3 py-2 rounded text-xs z-50 hover:bg-gray-700"
      >
        🐛 Debug ({logs.length})
      </button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 text-white p-4 rounded-lg shadow-lg max-w-md z-50">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-bold">Debug Log - Room {roomNumber}</h3>
        <button onClick={() => setIsVisible(false)} className="text-gray-400 hover:text-white">
          ✕
        </button>
      </div>

      <div className="max-h-60 overflow-y-auto text-xs space-y-1">
        {logs.length === 0 ? (
          <p className="text-gray-400">No logs yet...</p>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="border-b border-gray-700 pb-1">
              <div className="text-gray-400">{log.timestamp}</div>
              <div
                className={`${
                  log.type === "error" ? "text-red-400" : log.type === "success" ? "text-green-400" : "text-blue-400"
                }`}
              >
                {log.action}
              </div>
              {log.data && (
                <div className="text-gray-300 text-xs mt-1 bg-gray-800 p-1 rounded">
                  {typeof log.data === "object" ? JSON.stringify(log.data, null, 2).substring(0, 200) : log.data}...
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="flex space-x-2 mt-2">
        <button onClick={() => setLogs([])} className="bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-xs">
          Clear
        </button>
        <div className="text-xs text-gray-400">Errors: {logs.filter((l) => l.type === "error").length}</div>
      </div>
    </div>
  )
}
