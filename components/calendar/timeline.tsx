"use client"

import * as React from "react"
import { format, differenceInCalendarDays, addDays, isBefore, isAfter, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

type Entry = {
  id: number | string
  label: string
  departamento?: string
  estado?: string
  start?: string | null // ISO date
  end?: string | null // ISO date
}

export function Timeline({
  entries,
  startDate,
  days,
  dayWidth = 28,
  onRowClick,
}: {
  entries: Entry[]
  startDate: Date
  days: number
  dayWidth?: number
  onRowClick?: (entry: Entry) => void
}) {
  const totalWidth = days * dayWidth

  const toX = (iso?: string | null) => {
    if (!iso) return 0
    const d = typeof iso === 'string' ? parseISO(iso) : (iso as unknown as Date)
    return Math.max(0, differenceInCalendarDays(d, startDate)) * dayWidth
  }

  const toSpan = (s?: string | null, e?: string | null) => {
    if (!s || !e) return 0
    const sd = parseISO(s)
    const ed = parseISO(e)
    const left = Math.max(0, differenceInCalendarDays(sd, startDate))
    const right = Math.min(days - 1, Math.max(0, differenceInCalendarDays(ed, startDate)))
    const span = right - left + 1
    return Math.max(0, span) * dayWidth
  }

  return (
    <div className="w-full overflow-auto border border-gray-800 rounded bg-gray-900/20">
      <div className="flex items-stretch border-b border-gray-800 bg-gray-950 text-xs text-gray-400 sticky top-0 z-10">
        <div className="w-64 p-2">Persona / Cargo</div>
        <div className="flex-1 flex gap-0 overflow-auto" style={{ minWidth: totalWidth }}>
          {Array.from({ length: days }).map((_, i) => {
            const day = addDays(startDate, i)
            const initials = ['D','L','M','X','J','V','S'] // Domingo..Sábado (es) — miércoles = X
            const initial = initials[day.getDay()]
            return (
              <div key={i} className="w-full border-l border-gray-800 text-center py-2" style={{ width: dayWidth }}>
                <div className="text-[10px]">{format(day, 'dd')}</div>
                <div className="text-[9px] text-gray-500" title={format(day, 'EEEE', { locale: es })}>{initial}</div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="divide-y divide-gray-800">
        {entries.map((entry, idx) => {
          const left = toX(entry.start)
          const width = toSpan(entry.start, entry.end)
          const color = entry.estado === 'no activo' ? 'bg-red-500' : 'bg-indigo-500'
          return (
            <div key={entry.id} className="flex items-center gap-3 p-2 hover:bg-gray-900/40">
              <div className="w-64 text-sm text-gray-200 pr-2">
                <div className="font-medium truncate">{entry.label}</div>
                <div className="text-xs text-gray-400 truncate">{entry.departamento}</div>
              </div>
              <div className="flex-1 relative overflow-auto" style={{ minWidth: totalWidth }} onClick={() => onRowClick?.(entry)}>
                <div className="relative h-8">
                  <div className="absolute left-0 top-3 h-2 w-full bg-gray-800/50 rounded" />
                  {width > 0 && (
                    <div
                      className={`${color} absolute top-1.5 h-5 rounded shadow-lg cursor-pointer`}
                      style={{ left, width }}
                      title={`${entry.label}: ${entry.start || '—'} → ${entry.end || '—'}`}
                      role="button"
                    />
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
