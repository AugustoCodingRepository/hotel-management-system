"use client"

import { useState, useEffect } from "react"

export function RealTimeClock() {
  const [time, setTime] = useState<Date | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setTime(new Date())

    const timer = setInterval(() => {
      setTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const formatDateTime = (date: Date) => {
    const day = date.getDate().toString().padStart(2, "0")
    const month = (date.getMonth() + 1).toString().padStart(2, "0")
    const year = date.getFullYear()
    const hours = date.getHours().toString().padStart(2, "0")
    const minutes = date.getMinutes().toString().padStart(2, "0")
    const seconds = date.getSeconds().toString().padStart(2, "0")

    return `${day}/${month}/${year}, ${hours}:${minutes}:${seconds}`
  }

  if (!mounted || !time) {
    return <div className="text-sm font-medium text-gray-700">--/--/----, --:--:--</div>
  }

  return <div className="text-sm font-medium text-gray-700">{formatDateTime(time)}</div>
}
