"use client"

import * as React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, Legend, CartesianGrid, BarChart, Bar, Brush } from 'recharts'
import { Download, ChevronDown, Check } from 'lucide-react'
import * as Select from '@radix-ui/react-select' ;
import { Button } from '@/components/ui/button'
import useMasters from '@/hooks/useMasters'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'
import { downloadExcel } from '@/lib/excel'

type Employee = {
  id: number
  departamento: string
  ocupacion: string
  estado: string
  fechaLlegadaPlanificada: string | Date
  fechaSalidaPlanificada: string | Date
}

const COLORS = ['#6366F1','#EF4444','#F59E0B','#10B981','#06B6D4','#8B5CF6','#EC4899','#F97316','#64748B']

function formatMonthKey(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

function monthLabel(key: string) {
  const [y, m] = key.split('-')
  const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
  return `${months[Number(m) - 1]} ${y}`
}

export default function DashboardPage() {
  const { masters } = useMasters()
  const [employees, setEmployees] = useState<Employee[] | null>(null)
  const [monthsRange, setMonthsRange] = useState(12)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        params.set('page', '1')
        params.set('pageSize', '10000')
        const resp = await fetch(`/api/planning/employees?${params.toString()}`)
        const json = await resp.json()
        setEmployees((json.data || []).map((e: any) => ({ ...e, fechaLlegadaPlanificada: e.fechaLlegadaPlanificada ? new Date(e.fechaLlegadaPlanificada).toISOString() : null, fechaSalidaPlanificada: e.fechaSalidaPlanificada ? new Date(e.fechaSalidaPlanificada).toISOString() : null })))
      } catch (err) {
        console.error(err)
        setEmployees([])
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const total = employees?.length ?? 0
  const active = (employees || []).filter((e) => e.estado === 'activo').length
  const inactive = total - active

  const deptCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    (employees || []).forEach((e) => { counts[e.departamento] = (counts[e.departamento] || 0) + 1 })
    const ordered = Object.entries(counts).sort((a, b) => b[1] - a[1])
    return ordered
  }, [employees])

  const departments = masters?.departments?.length ? masters.departments : Array.from(new Set((employees || []).map((e) => e.departamento))).slice(0, 8)

  const monthlySeries = useMemo(() => {
    const now = new Date()
    const points: string[] = []
    for (let i = monthsRange - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      points.push(formatMonthKey(d))
    }

    const data = points.map((key) => {
      const obj: any = { month: key }
      departments.forEach((dept) => obj[dept] = 0)

      ;(employees || []).forEach((e) => {
        if (!e.fechaLlegadaPlanificada) return
        const fd = new Date(e.fechaLlegadaPlanificada)
        const k = formatMonthKey(fd)
        if (k === key) {
          obj[e.departamento] = (obj[e.departamento] || 0) + 1
        }
      })
      return obj
    })
    return data
  }, [employees, departments, monthsRange])

  const exportExcel = () => {
    if (!monthlySeries || !monthlySeries.length) return
    const headers = ['Mes', ...departments]
    const rows = monthlySeries.map((row) => [monthLabel(row.month), ...departments.map((d) => row[d] || 0)])

    downloadExcel(headers, rows, `reporte_vision_general.xlsx`, 'Serie')
    toast.success('Datos exportados correctamente')
  }

  return (
    <div className="w-full text-gray-50 font-sans">
      <div className="max-w-full mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 mb-4 border-b border-gray-800 gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Dashboard</h1>
            <p className="text-sm sm:text-base text-gray-400 mt-1">Visión general — KPI y tendencias por departamento.</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="ghost" onClick={exportExcel} className="text-sm"><Download className="mr-2 h-4 w-4" /> Exportar serie</Button>
            <Select.Root value={String(monthsRange)} onValueChange={(v) => setMonthsRange(Number(v))}>
              <Select.Trigger className="flex items-center justify-between px-3 py-2 text-sm bg-gray-900 border border-gray-800 rounded text-gray-200">
                <Select.Value />
                <Select.Icon>
                  <ChevronDown size={16} className="text-gray-400" />
                </Select.Icon>
              </Select.Trigger>
              <Select.Portal>
                <Select.Content className="overflow-hidden bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-lg z-50">
                  <Select.Viewport className="p-1">
                    <Select.Item value={"6"} className="relative flex items-center px-8 py-2 text-sm text-slate-900 dark:text-slate-200 rounded cursor-pointer select-none outline-none hover:bg-slate-100 dark:hover:bg-slate-600">
                      <Select.ItemIndicator className="absolute left-2 inline-flex items-center"><Check size={14} /></Select.ItemIndicator>
                      <Select.ItemText>Últimos 6 meses</Select.ItemText>
                    </Select.Item>
                    <Select.Item value={"12"} className="relative flex items-center px-8 py-2 text-sm text-slate-900 dark:text-slate-200 rounded cursor-pointer select-none outline-none hover:bg-slate-100 dark:hover:bg-slate-600">
                      <Select.ItemIndicator className="absolute left-2 inline-flex items-center"><Check size={14} /></Select.ItemIndicator>
                      <Select.ItemText>Últimos 12 meses</Select.ItemText>
                    </Select.Item>
                    <Select.Item value={"24"} className="relative flex items-center px-8 py-2 text-sm text-slate-900 dark:text-slate-200 rounded cursor-pointer select-none outline-none hover:bg-slate-100 dark:hover:bg-slate-600">
                      <Select.ItemIndicator className="absolute left-2 inline-flex items-center"><Check size={14} /></Select.ItemIndicator>
                      <Select.ItemText>Últimos 24 meses</Select.ItemText>
                    </Select.Item>
                  </Select.Viewport>
                </Select.Content>
              </Select.Portal>
            </Select.Root>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="card p-4 bg-gray-900 border border-gray-800 rounded">
            <div className="text-sm text-gray-400">Total empleados</div>
            <div className="text-2xl font-semibold mt-2">{loading ? '—' : total}</div>
          </div>
          <div className="card p-4 bg-gray-900 border border-gray-800 rounded">
            <div className="text-sm text-gray-400">Activos</div>
            <div className="text-2xl font-semibold mt-2">{loading ? '—' : active}</div>
          </div>
          <div className="card p-4 bg-gray-900 border border-gray-800 rounded">
            <div className="text-sm text-gray-400">No activos</div>
            <div className="text-2xl font-semibold mt-2">{loading ? '—' : inactive}</div>
          </div>
        </div>

        <div className="card p-4 bg-gray-900 border border-gray-800 rounded mb-6">
          <h3 className="text-base sm:text-lg font-semibold mb-4">Tendencia de altas por departamento</h3>
          <div className="w-full overflow-x-auto">
            <div style={{ minWidth: '600px', height: 320 }}>
              <ResponsiveContainer>
              <AreaChart data={monthlySeries} stackOffset="expand">
                <CartesianGrid stroke="#111827" strokeDasharray="3 3" />
                <XAxis dataKey="month" tickFormatter={monthLabel} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Brush dataKey="month" height={30} stroke="#374151" />
                {departments.map((d, i) => (
                  <Area key={d} type="monotone" dataKey={d} stackId="1" stroke={COLORS[i % COLORS.length]} fill={COLORS[i % COLORS.length]} />
                ))}
              </AreaChart>
            </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="card p-4 bg-gray-900 border border-gray-800 rounded">
          <h3 className="text-base sm:text-lg font-semibold mb-4">Distribución actual por departamento</h3>
          <div className="w-full overflow-x-auto">
            <div style={{ minWidth: '500px', height: 300 }}>
              <ResponsiveContainer>
              <BarChart data={deptCounts.map(([k, v]) => ({ name: k, value: v }))}>
                <CartesianGrid stroke="#111827" strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill={COLORS[0]} />
              </BarChart>
            </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}