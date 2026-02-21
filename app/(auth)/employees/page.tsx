"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { PlusCircle, Trash, Upload, Download, Edit, Check, ChevronDown, MoreHorizontal } from "lucide-react"
import SearchBox from "@/components/ui/SearchBox"
import * as Select from '@radix-ui/react-select';
import { toast } from 'sonner'
import * as XLSX from 'xlsx'
import { downloadExcel, formatDateForExport } from '@/lib/excel'

import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { AdvancedFilters, FilterConfig } from "@/components/filters/AdvancedFilters"
import EmployeeForm from "@/components/employee/EmployeeForm"
import BulkEdit from "@/components/employee/BulkEdit"
import { columns as baseColumns } from "@/components/dashboard-columns"
import { Worker } from "@/lib/data"
import useMasters from '@/hooks/useMasters'
import { validateEmployeePayload } from '@/lib/validators'
import { formatDateDMY } from '@/lib/utils' // display dates as dd/mm/yyyy
function selectionColumn<T>(): ColumnDef<T, any> {
  return {
    id: 'select',
    header: ({ table }) => {
      const ref = React.useRef<HTMLInputElement>(null)
      React.useEffect(() => {
        if (ref.current) {
          ref.current.indeterminate = table.getIsSomeRowsSelected()
        }
      }, [table.getIsSomeRowsSelected()])
      return (
        <input
          ref={ref}
          aria-label="Seleccionar todo"
          type="checkbox"
          onChange={(e) => table.toggleAllRowsSelected(!!e.target.checked)}
          checked={table.getIsAllRowsSelected()}
        />
      )
    },
    cell: ({ row }) => (
      <input
        aria-label={`Seleccionar fila ${row.id}`}
        type="checkbox"
        onChange={(e) => row.toggleSelected(!!e.target.checked)}
        checked={row.getIsSelected()}
      />
    ),
  }
}

export default function EmployeesPage() {
  const [data, setData] = useState<Worker[]>([])
  const [allData, setAllData] = useState<Worker[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const [filters, setFilters] = useState<Record<string, string>>({ departamento: 'TODOS', ocupacion: 'TODOS', estado: 'TODOS' })
  const [searchQ, setSearchQ] = useState("")

  const handleSearchChange = React.useCallback((q: string) => {
    setSearchQ(q)
    setPage(1)
  }, [])
  // ensure page resets when search changes
  useEffect(() => {
    setPage(1)
  }, [searchQ])
  const [showFilters, setShowFilters] = useState(true)

  const [editing, setEditing] = useState<null | Worker>(null)
  const [creating, setCreating] = useState(false)
  const [bulkEditOpen, setBulkEditOpen] = useState(false)

  // Import / Export states
  const [importPreview, setImportPreview] = useState<any[] | null>(null)
  const [importErrors, setImportErrors] = useState<string[]>([])
  const [isImporting, setIsImporting] = useState(false)
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)
  const [importMode, setImportMode] = useState<'create-only' | 'merge' | 'overwrite' | 'reject-duplicates'>('merge')

  // import states
  const [importFileContent, setImportFileContent] = useState<string | null>(null)
  const [importFileName, setImportFileName] = useState<string | null>(null)
  const [importTotalRows, setImportTotalRows] = useState<number | null>(null)

  // Preview row edit (correct invalid rows before importing)
  const [previewEditIndex, setPreviewEditIndex] = useState<number | null>(null)
  const [previewEditInitial, setPreviewEditInitial] = useState<Partial<Worker> | null>(null)

  // simple in-memory cache for query results
  const cacheRef = React.useRef<Map<string, { data: Worker[]; total: number; fetchedAt: number }>>(new Map())

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', '1')
      params.set('pageSize', '10000')
      const resp = await fetch(`/api/planning/employees?${params.toString()}`)
      const json = await resp.json()
      const rows: Worker[] = json.data || []
      setAllData(rows)
      // apply current filters immediately to data vector
      applyFilters(rows)
    } catch (err) {
      console.error('fetchData', err)
      setAllData([])
      setData([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }

  // Helpers for CSV parsing / mapping
  const stripAccents = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/[^a-z0-9]/gi, '').toLowerCase()

  const mapHeaderToKey = (h: string) => {
    const n = stripAccents(h)
    if (n.includes('depart')) return 'departamento'
    if (n.includes('ocup')) return 'ocupacion'
    if (n.includes('estado')) return 'estado'

    if (n.includes('llegadaplan') || n.includes('llegadaplanificada') || n.includes('fechallegadaplan')) return 'fechaLlegadaPlanificada'
    if (n.includes('llegadareal') || n.includes('fechallegadareal')) return 'fechaLlegadaReal'

    if (n.includes('salidaplan') || n.includes('salidaplanificada') || n.includes('fechasalidaplan')) return 'fechaSalidaPlanificada'
    if (n.includes('salidareal') || n.includes('fechasalidareal')) return 'fechaSalidaReal'

    if (n.includes('iniciopermiso') || n.includes('fechainiciopermiso') || n.includes('fechainiciopermisotrabajo')) return 'inicioPermisoTrabajo'
    if (n.includes('finpermiso') || n.includes('fechafinpermiso') || n.includes('fechafinpermisotrabajo')) return 'finPermisoTrabajo'

    return null
  }

  const parseDateString = (v: string | null) => {
    if (!v) return null
    const t = String(v).trim()
    if (!t) return null
    // ISO yyyy-mm-dd
    if (/^\d{4}-\d{2}-\d{2}/.test(t)) return t
    // dd/mm/yyyy or dd-mm-yyyy
    const m = t.match(/^(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{4})$/)
    if (m) {
      const dd = m[1].padStart(2, '0')
      const mm = m[2].padStart(2, '0')
      const yyyy = m[3]
      return `${yyyy}-${mm}-${dd}`
    }
    // fallback: try Date parse
    const d = new Date(t)
    if (!isNaN(d.getTime())) return d.toISOString()
    return t
  }

  const parseCSV = (text: string) => {
    text = String(text || '').replace(/^\uFEFF/, '')
    // detect delimiter from first non-empty line (support semicolon-delimited CSVs)
    const firstLine = (text.split(/\r?\n/).find(Boolean) || '')
    const commaCount = (firstLine.match(/,/g) || []).length
    const semiCount = (firstLine.match(/;/g) || []).length
    const delimiter = semiCount > commaCount ? ';' : ','

    const rows: string[][] = []
    let cur = ''
    let row: string[] = []
    let inQuotes = false
    for (let i = 0; i < text.length; i++) {
      const ch = text[i]
      const nxt = text[i + 1]
      if (ch === '"') {
        if (inQuotes && nxt === '"') {
          cur += '"'
          i++
          continue
        }
        inQuotes = !inQuotes
        continue
      }
      if (ch === delimiter && !inQuotes) {
        row.push(cur)
        cur = ''
        continue
      }
      if ((ch === '\n' || ch === '\r') && !inQuotes) {
        if (cur !== '' || row.length > 0) {
          row.push(cur)
          rows.push(row)
          row = []
          cur = ''
        }
        // handle \r\n by skipping extra char
        if (ch === '\r' && nxt === '\n') i++
        continue
      }
      cur += ch
    }
    if (cur !== '' || row.length > 0) {
      row.push(cur)
      rows.push(row)
    }
    const header = rows.shift() || []
    return { header: header.map(h => h.trim()), rows }
  }

  const mapCsvRowToPayload = (header: string[], row: string[]) => {
    const obj: any = {}
    header.forEach((h, idx) => {
      const key = mapHeaderToKey(h)
      const val = (row[idx] || '').trim()
      if (!key) return
      if (key.startsWith('fecha') || key.includes('Permiso')) {
        obj[key] = parseDateString(val)
      } else if (key === 'estado') {
        obj[key] = val.toLowerCase() === 'activo' ? 'activo' : 'no activo'
      } else {
        obj[key] = val
      }
    })
    return obj
  }

  // parent just reacts to searchQ; actual input handled in memoized child below

  const [isPending, startTransition] = React.useTransition()
  // debounce timer for data fetching
  const fetchTimeout = React.useRef<number | null>(null)

  useEffect(() => {
    // initial load or reload after modifications
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // recalc view whenever underlying data or any control changes
  useEffect(() => {
    applyFilters(allData)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, searchQ, page, pageSize, allData])

  // --- Import handlers ---
  const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
    let binary = ''
    const bytes = new Uint8Array(buffer)
    const len = bytes.byteLength
    for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i])
    return btoa(binary)
  }

  const onSelectFile = async (file?: File | null) => {
    if (!file) return
    try {
      const name = (file.name || '').toLowerCase()

      // store base64 for background import if needed
      const buf = await file.arrayBuffer()
      const b64 = arrayBufferToBase64(buf)
      setImportFileContent(b64)
      setImportFileName(file.name)

      // XLSX/XLS -> ask server for preview (server parses binary)
      if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
        const resp = await fetch('/api/planning/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ filename: file.name, content: b64, preview: true }) })
        const json = await resp.json().catch(() => ({}))
        if (!resp.ok || !json.previewRows) {
          console.error('preview xlsx failed', json)
          return toast.error(json.error || 'No se pudo obtener vista previa del archivo')
        }
        setImportPreview(json.previewRows.slice(0, 500))
        setImportErrors([])
        setImportTotalRows(json.totalRows || json.previewRows.length)
        return toast.success(`Vista previa (XLSX): ${json.totalRows || json.previewRows.length} filas (mostrando ${Math.min(500, json.previewRows.length)})`)
      }

      // otherwise treat as CSV -> ask server for preview (server will detect matches + header mapping)
      const resp = await fetch('/api/planning/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ filename: file.name, content: b64, preview: true }) })
      const json = await resp.json().catch(() => ({}))
      if (!resp.ok || !json.previewRows) {
        console.error('preview csv failed', json)
        return toast.error(json.error || 'No se pudo obtener vista previa del archivo')
      }
      setImportPreview(json.previewRows.slice(0, 500))
      setImportErrors([])
      setImportTotalRows(json.totalRows || json.previewRows.length)
      return toast.success(`Vista previa: ${json.totalRows || json.previewRows.length} filas (mostrando ${Math.min(500, json.previewRows.length)})`)
    } catch (err) {
      console.error(err)
      toast.error('Error al leer el archivo')
    }
  }

  const confirmImport = async () => {
    if (!importPreview || !importPreview.length) return toast.error('Nada que importar')
    setIsImporting(true)

    // thresholds for "long" imports
    const LONG_IMPORT_ROW_THRESHOLD = 200
    const LONG_IMPORT_FILE_BYTES = 500 * 1024 // 500KB
    const LONG_IMPORT_DELAY_MS = 2000

    let longImportTimer: ReturnType<typeof setTimeout> | null = null
    try {
      const validRows = importPreview.filter((r) => r.valid)
      const invalidRows = importPreview.filter((r) => !r.valid)
      if (validRows.length === 0) {
        toast.error('No hay filas válidas para importar')
        setIsImporting(false)
        return
      }

      // determine whether this is a "large" import
      const isLargeFile = importFileContent && importFileContent.length * 0.75 > LONG_IMPORT_FILE_BYTES
      const isLargeRows = (importTotalRows && importTotalRows > LONG_IMPORT_ROW_THRESHOLD) || (importPreview.length > LONG_IMPORT_ROW_THRESHOLD)
      const isLarge = Boolean(isLargeFile || isLargeRows)

      // if large, show an informational toast only if the import actually takes > LONG_IMPORT_DELAY_MS
      if (isLarge) {
        longImportTimer = setTimeout(() => {
          toast('Importación en curso — esto puede tardar varios segundos...')
        }, LONG_IMPORT_DELAY_MS)
      }

      // always perform synchronous import via /api/planning/import
      if (importFileContent && importFileName) {
        // send full file content for server-side parsing + import
        const resp = await fetch('/api/planning/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ filename: importFileName, content: importFileContent, mode: importMode }) })
        const json = await resp.json().catch(() => ({}))
        if (!resp.ok) {
          toast.error(json.error || 'Error en importación de archivo')
          setIsImporting(false)
          return
        }

        const succeeded = json.imported || 0
        const failed = json.failed || 0
        if (json.errorsCsv) {
          const blob = new Blob([json.errorsCsv], { type: 'text/csv;charset=utf-8;' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `import_errors.csv`
          document.body.appendChild(a)
          a.click()
          a.remove()
          URL.revokeObjectURL(url)
        }

        setImportPreview(null)
        setImportFileContent(null)
        setImportFileName(null)
        setImportTotalRows(null)

        if (succeeded > 0) toast.success(`${succeeded} filas importadas correctamente`)
        if (failed > 0) toast.error(`${failed} filas fallaron al importar`)
        fetchData()
        setIsImporting(false)
        return
      }

      // small import — do synchronous bulk import for the previewed rows
      const payloads = validRows.map((r) => r.normalized || r.payload)
      const resp = await fetch('/api/planning/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rows: payloads, mode: importMode }) })
      const json = await resp.json().catch(() => ({}))

      const succeeded = json.imported || 0
      const failed = json.failed || 0

      // download errors CSV if provided
      if (json.errorsCsv) {
        const blob = new Blob([json.errorsCsv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `import_errors.csv`
        document.body.appendChild(a)
        a.click()
        a.remove()
        URL.revokeObjectURL(url)
      }

      setImportPreview(null)
      if (succeeded > 0) toast.success(`${succeeded} filas importadas correctamente`)
      if (failed > 0) toast.error(`${failed} filas fallaron al importar`)
      if (invalidRows.length > 0) toast.error(`${invalidRows.length} filas tenían errores y fueron omitidas`)

      fetchData()
    } catch (err) {
      console.error(err)
      toast.error('Error al importar')
    } finally {
      if (longImportTimer) clearTimeout(longImportTimer)
      setIsImporting(false)
    }
  }

  const cancelImport = () => {
    setImportPreview(null)
    setImportErrors([])
    setImportFileContent(null)
    setImportFileName(null)
    setImportTotalRows(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // --- Export Excel ---
  // NOTE: formatDateForExport is imported from lib/excel; defined there to keep code DRY
  const handleExportExcel = async () => {
    try {
      const params = new URLSearchParams()
      params.set('page', '1')
      params.set('pageSize', '10000')
      if (filters.departamento && filters.departamento !== 'TODOS') params.set('departamento', filters.departamento)
      if (filters.ocupacion && filters.ocupacion !== 'TODOS') params.set('ocupacion', filters.ocupacion)
      if (filters.estado && filters.estado !== 'TODOS') params.set('estado', filters.estado)
      if (searchQ) params.set('search', searchQ)

      const resp = await fetch(`/api/planning/employees?${params.toString()}`)
      const json = await resp.json()
      const rows: Worker[] = json.data || []

      // include all significant worker properties so export matches full table rows
      const headers = [
        'ID',
        'Nombre',
        'Departamento',
        'Ocupación',
        'Estado',
        'Fecha llegada planificada',
        'Fecha llegada real',
        'Fecha salida planificada',
        'Fecha salida real',
        'Fecha inicio permiso trabajo',
        'Fecha fin permiso trabajo',
        'Empleado #',
        'Email',
      ]

      // build rows array identical to header order
      const rowsData = rows.map((r) => [
        r.id,
        r.fullName || '',
        r.departamento || '',
        r.ocupacion || '',
        r.estado || '',
        formatDateForExport(r.fechaLlegadaPlanificada),
        formatDateForExport(r.fechaLlegadaReal),
        formatDateForExport(r.fechaSalidaPlanificada),
        formatDateForExport(r.fechaSalidaReal),
        formatDateForExport(r.inicioPermisoTrabajo),
        formatDateForExport(r.finPermisoTrabajo),
        r.employeeNumber || '',
        r.email || '',
      ])

      downloadExcel(headers, rowsData, `empleados_export.xlsx`, 'Empleados')
      toast.success('Datos exportados correctamente')
    } catch (err) {
      console.error(err)
      toast.error('Error al exportar')
    }
  }

  // fetch masters early so columns can depend on it
  const { masters } = useMasters()

  // helper: apply filters/search/page locally
  const applyFilters = (source: Worker[]) => {
    let items = source.slice()

    if (filters.departamento && filters.departamento !== 'TODOS') {
      items = items.filter((i) => i.departamento === filters.departamento)
    }
    if (filters.ocupacion && filters.ocupacion !== 'TODOS') {
      items = items.filter((i) => i.ocupacion === filters.ocupacion)
    }
    if (filters.estado && filters.estado !== 'TODOS') {
      items = items.filter((i) => i.estado === filters.estado)
    }
    if (searchQ && searchQ.trim()) {
      const q = searchQ.toLowerCase()
      items = items.filter((i) =>
        i.ocupacion.toLowerCase().includes(q) ||
        i.departamento.toLowerCase().includes(q) ||
        i.id.toString() === q ||
        (i.fullName && i.fullName.toLowerCase().includes(q)) ||
        (i.firstName && i.firstName.toLowerCase().includes(q)) ||
        (i.lastName && i.lastName.toLowerCase().includes(q))
      )
    }

    const tot = items.length
    const start = (Math.max(1, page) - 1) * pageSize
    const end = start + pageSize
    const paged = items.slice(start, end)
    setData(paged)
    setTotal(tot)
  }

  // build columns: reuse baseColumns but override actions so that edit works
  const employeeColumns: ColumnDef<Worker>[] = React.useMemo(() => [
    selectionColumn<Worker>(),
    ...baseColumns.filter((c) => c.id !== 'actions') as ColumnDef<Worker>[],
    {
      id: 'actions',
      cell: ({ row }) => {
        const worker = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-gray-700">
                <span className="sr-only">Abrir menú</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700 text-white">
              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => {
                  // build copy object converting dates to project format
                  const normalized: any = { ...worker }
                  const dateKeys = [
                    'fechaLlegadaPlanificada',
                    'fechaLlegadaReal',
                    'fechaSalidaPlanificada',
                    'fechaSalidaReal',
                    'inicioPermisoTrabajo',
                    'finPermisoTrabajo',
                  ]
                  dateKeys.forEach((k) => {
                    if (normalized[k]) {
                      try {
                        normalized[k] = formatDateDMY(normalized[k])
                      } catch {}
                    }
                  })
                  // replace null/undefined with empty string for better UX when copying
                  Object.keys(normalized).forEach((k) => {
                    if (normalized[k] == null) normalized[k] = ''
                  })
                  const text = JSON.stringify(normalized, null, 2)
                  navigator.clipboard.writeText(text).then(() => {
                    toast.success('Datos del trabajador copiados')
                  }).catch(() => {
                    toast.error('Error al copiar')
                  })
                }}
                className="focus:bg-gray-700 cursor-pointer"
              >
                Copiar datos de trabajador
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-gray-700"/>
              <DropdownMenuItem
                onClick={() => setEditing(worker)}
                className="focus:bg-gray-700 cursor-pointer"
              >
                Editar trabajador
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      }
    }
  ], [masters])

  // create table instance directly; do not wrap hook in useMemo
  const table = useReactTable({
    data,
    columns: employeeColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {},
  })



  const filterConfigs: FilterConfig[] = React.useMemo(() => [
    { key: 'departamento', label: 'Departamento', options: [{ value: 'TODOS', label: 'Todos' }, ...(masters?.departments || []) .map((d) => ({ value: d, label: d }))] },
    { key: 'ocupacion', label: 'Ocupación', options: [{ value: 'TODOS', label: 'Todos' }, ...(masters?.occupations || []).map((o) => ({ value: o, label: o }))] },
    { key: 'estado', label: 'Estado', options: [{ value: 'TODOS', label: 'Todos' }, ...(masters?.states || ['activo', 'no activo']).map((s: any) => ({ value: s, label: s }))] },
  ], [masters])

  // Pagination helpers (consistent with /shifts)
  const totalPages = total > 0 ? Math.ceil(total / pageSize) : 0
  const getVisiblePageNumbers = (tp: number, cur: number): (number | string)[] => {
    if (tp <= 7) return Array.from({ length: tp }, (_, i) => i + 1)
    const pages: (number | string)[] = []
    const left = Math.max(2, cur - 1)
    const right = Math.min(tp - 1, cur + 1)
    pages.push(1)
    if (left > 2) pages.push('...')
    for (let i = left; i <= right; i++) pages.push(i)
    if (right < tp - 1) pages.push('...')
    pages.push(tp)
    return pages
  }
  const visiblePages = getVisiblePageNumbers(totalPages, page) 

  const onFilterChange = React.useCallback((key: string, value: string) => {
    startTransition(() => {
      setFilters((s) => ({ ...s, [key]: value }))
      setPage(1)
    })
  }, [])

  const clearFilters = React.useCallback(() => {
    setFilters({ departamento: 'TODOS', ocupacion: 'TODOS', estado: 'TODOS' })
    setPage(1)
  }, [])

  const createEmptyWorker = (): Partial<Worker> => ({
    departamento: masters?.departments?.[0] ?? 'Administración',
    ocupacion: masters?.occupations?.[0] ?? 'Empleado/a',
    estado: (masters?.states?.[0] as Worker['estado']) ?? 'activo',
    fullName: 'Empleado/a Ejemplo',
    firstName: 'Empleado',
    lastName: 'Ejemplo',
    employeeNumber: null,
    email: null,
    fechaLlegadaPlanificada: new Date(),
    fechaLlegadaReal: null,
    fechaSalidaPlanificada: new Date(),
    fechaSalidaReal: null,
    inicioPermisoTrabajo: new Date(),
    finPermisoTrabajo: new Date(),
  })

  const handleCreate = async (payload: Partial<Worker>) => {
    try {
      const resp = await fetch('/api/planning/employees', { method: 'POST', body: JSON.stringify(payload), headers: { 'Content-Type': 'application/json' } })
      if (!resp.ok) {
        const j = await resp.json().catch(() => ({}))
        toast.error(j.error || 'Error al crear empleado')
        return
      }
      toast.success('Empleado creado')
      // refresh data set
      await fetchData()
    } catch (err) {
      console.error(err)
      toast.error('Error al crear empleado')
    } finally {
      setCreating(false)
    }
  }

  const handleUpdate = async (id: number, payload: Partial<Worker>) => {
    try {
      const resp = await fetch('/api/planning/employees', { method: 'PUT', body: JSON.stringify({ id, ...payload }), headers: { 'Content-Type': 'application/json' } })
      if (!resp.ok) {
        const j = await resp.json().catch(() => ({}))
        toast.error(j.error || 'Error al actualizar empleado')
        return
      }
      toast.success('Empleado actualizado')
      await fetchData()
    } catch (err) {
      console.error(err)
      toast.error('Error al actualizar empleado')
    } finally {
      setEditing(null)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      const resp = await fetch(`/api/planning/employees?id=${id}`, { method: 'DELETE' })
      const j = await resp.json().catch(() => ({}))
      if (!resp.ok || j.success === false) return toast.error('Error al eliminar')
      toast.success('Empleado eliminado')
    } catch (err) {
      console.error(err)
      toast.error('Error al eliminar')
    } finally {
      fetchData()
    }
  }

  const handleBulkDelete = async () => {
    const selected = Object.keys(table.getState().rowSelection).map((k) => Number(k))
    if (!selected.length) return toast.error('No hay empleados seleccionados')
    let succeeded = 0
    for (const id of selected) {
      try {
        const resp = await fetch(`/api/planning/employees?id=${id}`, { method: 'DELETE' })
        const j = await resp.json().catch(() => ({}))
        if (resp.ok && j.success !== false) succeeded += 1
      } catch (err) {
        console.error('bulk delete error', err)
      }
    }
    table.resetRowSelection()
    await fetchData()
    toast.success(`${succeeded} / ${selected.length} eliminados`)
  }

  return (
    <div className="w-full text-gray-50 font-sans">
      <div className="max-w-full mx-auto">
        <div className="flex flex-col gap-3 pb-4 mb-4 border-b border-gray-800">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Empleados</h1>
            <p className="text-sm sm:text-base text-gray-400 mt-1">Lista, filtros y edición de la planificación del personal.</p>
          </div>
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv,.xlsx,.xls"
                className="hidden"
                onChange={async (e) => {
                  const f = e.target.files?.[0] || null
                  await onSelectFile(f || undefined)
                }}
              />

              <Button variant="outline" size="sm" className="bg-gray-900 border-gray-700 hover:bg-gray-800 text-white w-full sm:w-auto" onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4 mr-2" />Importar
              </Button>

              <Button variant="outline" size="sm" className="bg-gray-900 border-gray-700 hover:bg-gray-800 text-white w-full sm:w-auto" onClick={handleExportExcel}>
                <Download className="h-4 w-4 mr-2" />Exportar
              </Button>

              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white w-full sm:w-auto" onClick={() => setCreating((c) => !c)}>
                <PlusCircle className="h-4 w-4 mr-2" />Añadir
              </Button>
            </div>

            {
              (() => {
                const selectedCount = Object.keys(table.getState().rowSelection).length;
                const disabled = selectedCount === 0;
                return (
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button
                      size="sm"
                      className="bg-amber-600 hover:bg-amber-700 text-white w-full sm:w-auto"
                      onClick={() => {
                        const selectedRows = table.getFilteredSelectedRowModel().rows;
                        if (selectedRows.length === 1) {
                          setEditing(selectedRows[0].original);
                        } else {
                          setBulkEditOpen(true);
                        }
                      }}
                      disabled={disabled}
                    >
                      <Edit className="h-4 w-4 mr-2" />Editar seleccionados
                    </Button>

                    <Button
                      size="sm"
                      className="bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto"
                      onClick={handleBulkDelete}
                      disabled={disabled}
                    >
                      <Trash className="h-4 w-4 mr-2" />Eliminar seleccionados
                    </Button>
                  </div>
                )
              })()
            }
          </div>
        </div>

        <div className="pb-4">
          <SearchBox
            value={searchQ}
            onChange={handleSearchChange}
          />
        </div>

        <AdvancedFilters
          filters={filters}
          filterConfigs={filterConfigs}
          onFilterChange={onFilterChange}
          onClearFilters={clearFilters}
          activeFiltersCount={Object.values(filters).filter((v) => v && v !== 'TODOS').length}
          resultCount={total}
          showFilters={showFilters}
          onToggleFilters={() => setShowFilters((s) => !s)}
        />

        {creating && (
          <div className="card mt-4 p-4">
            <h3 className="text-lg font-semibold mb-2">Crear trabajador</h3>
            <EmployeeForm initial={createEmptyWorker()} onCancel={() => setCreating(false)} onSubmit={handleCreate} />
          </div>
        )}

        {editing && (
          <div className="card mt-4 p-4">
            <h3 className="text-lg font-semibold mb-2">Editar trabajador #{editing.id}</h3>
            <EmployeeForm initial={editing} onCancel={() => setEditing(null)} onSubmit={(payload) => handleUpdate(editing.id, payload)} />
          </div>
        )}

        {/* Bulk edit modal */}
        <BulkEdit
          selectedIds={table.getFilteredSelectedRowModel().rows.map((r) => r.original.id)}
          open={bulkEditOpen}
          onOpenChange={(v) => setBulkEditOpen(v)}
          onDone={() => { table.resetRowSelection(); fetchData() }}
        />

        {/* Import preview */}
        {importPreview && (
          <div className="card mt-4 p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-lg font-semibold">Importar CSV — vista previa</h3>
                <p className="text-sm text-gray-400">Revise las primeras filas antes de confirmar la importación.</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-sm text-gray-400">Modo:</div>
                <Select.Root value={importMode} onValueChange={(v) => setImportMode(v as any)}>
                  <Select.Trigger className="flex items-center justify-between px-3 py-2 text-sm bg-gray-900 border border-gray-800 rounded text-gray-200">
                    <Select.Value />
                    <Select.Icon>
                      <ChevronDown size={16} className="text-gray-400" />
                    </Select.Icon>
                  </Select.Trigger>
                  <Select.Portal>
                    <Select.Content className="overflow-hidden bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-lg z-50">
                      <Select.Viewport className="p-1">
                        <Select.Item value={"merge"} className="relative flex items-center px-8 py-2 text-sm text-slate-900 dark:text-slate-200 rounded cursor-pointer select-none outline-none hover:bg-slate-100 dark:hover:bg-slate-600">
                          <Select.ItemIndicator className="absolute left-2 inline-flex items-center"><Check size={14} /></Select.ItemIndicator>
                          <Select.ItemText>Merge — combinar sin sobrescribir campos existentes</Select.ItemText>
                        </Select.Item>
                        <Select.Item value={"create-only"} className="relative flex items-center px-8 py-2 text-sm text-slate-900 dark:text-slate-200 rounded cursor-pointer select-none outline-none hover:bg-slate-100 dark:hover:bg-slate-600">
                          <Select.ItemIndicator className="absolute left-2 inline-flex items-center"><Check size={14} /></Select.ItemIndicator>
                          <Select.ItemText>Crear solo — no actualizar existentes</Select.ItemText>
                        </Select.Item>
                        <Select.Item value={"overwrite"} className="relative flex items-center px-8 py-2 text-sm text-slate-900 dark:text-slate-200 rounded cursor-pointer select-none outline-none hover:bg-slate-100 dark:hover:bg-slate-600">
                          <Select.ItemIndicator className="absolute left-2 inline-flex items-center"><Check size={14} /></Select.ItemIndicator>
                          <Select.ItemText>Sobrescribir — reemplazar registros existentes</Select.ItemText>
                        </Select.Item>
                        <Select.Item value={"reject-duplicates"} className="relative flex items-center px-8 py-2 text-sm text-slate-900 dark:text-slate-200 rounded cursor-pointer select-none outline-none hover:bg-slate-100 dark:hover:bg-slate-600">
                          <Select.ItemIndicator className="absolute left-2 inline-flex items-center"><Check size={14} /></Select.ItemIndicator>
                          <Select.ItemText>Rechazar duplicados — abortar filas que ya existen</Select.ItemText>
                        </Select.Item>
                      </Select.Viewport>
                    </Select.Content>
                  </Select.Portal>
                </Select.Root>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={cancelImport}>Cancelar</Button>
                  <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={confirmImport} disabled={isImporting}>
                    {isImporting ? 'Importando...' : 'Confirmar importación'}
                  </Button>
                </div>
              </div>
            </div>

            <div className="overflow-auto max-h-60 border border-gray-800 rounded">
              <table className="w-full text-sm">
                <thead className="bg-gray-900 text-gray-300">
                  <tr>
                    <th className="p-2 text-left">#</th>
                    <th className="p-2 text-left">Departamento</th>
                    <th className="p-2 text-left">Ocupación</th>
                    <th className="p-2 text-left">Estado</th>
                    <th className="p-2 text-left">Llegada plan.</th>
                    <th className="p-2 text-left">Salida plan.</th>
                    <th className="p-2 text-left">Resultado</th>
                    <th className="p-2 text-left">Errores</th>
                    <th className="p-2 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {importPreview.map((r, idx) => (
                    <tr key={idx} className={`border-t border-gray-800 even:bg-gray-950 ${!r.valid ? 'bg-red-950/30' : ''}`}>
                      <td className="p-2 align-top text-sm">{r.row}</td>
                      <td className="p-2 align-top text-sm">{r.payload.departamento || r.normalized?.departamento || ''}</td>
                      <td className="p-2 align-top text-sm">{r.payload.ocupacion || r.normalized?.ocupacion || ''}</td>
                      <td className="p-2 align-top text-sm">{r.payload.estado || r.normalized?.estado || ''}</td>
                      <td className="p-2 align-top text-sm">{formatDateDMY(r.payload.fechaLlegadaPlanificada || r.normalized?.fechaLlegadaPlanificada)}</td>
                      <td className="p-2 align-top text-sm">{formatDateDMY(r.payload.fechaSalidaPlanificada || r.normalized?.fechaSalidaPlanificada)}</td>

                      <td className="p-2 align-top text-sm">
                        {r.match ? (
                          importMode === 'reject-duplicates' ? (
                            <span className="px-2 py-1 rounded text-xs bg-red-700/20 text-red-300">Rechazado (coincide)</span>
                          ) : importMode === 'create-only' ? (
                            <span className="px-2 py-1 rounded text-xs bg-yellow-700/20 text-yellow-300">Omitido (existe)</span>
                          ) : importMode === 'merge' ? (
                            <span className="px-2 py-1 rounded text-xs bg-amber-700/20 text-amber-300">Actualizar (merge)</span>
                          ) : (
                            <span className="px-2 py-1 rounded text-xs bg-blue-700/20 text-blue-300">Sobrescribir</span>
                          )
                        ) : (
                          <span className="px-2 py-1 rounded text-xs bg-green-700/20 text-green-300">Crear</span>
                        )}
                      </td>

                      <td className="p-2 align-top text-xs text-red-300">{r.errors.length ? r.errors.join('; ') : '—'}</td>
                      <td className="p-2 text-right">
                        {!r.valid ? (
                          <Button size="sm" variant="outline" className="mr-2" onClick={() => { setPreviewEditIndex(idx); setPreviewEditInitial(r.normalized || r.payload); }}>
                            <Edit className="mr-2 h-3 w-3" /> Corregir
                          </Button>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-green-700/30 rounded text-green-200"><Check className="h-3 w-3" /> Válido</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="rounded-lg border border-gray-800 mt-4 overflow-x-auto">
          <Table className="min-w-[800px]">
            <TableHeader className="bg-gray-900">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="border-gray-800 hover:bg-gray-800/50">
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="text-gray-300 px-4">
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header as any, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'} className="border-gray-800 hover:bg-gray-800/50">
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="px-4 py-3">
                        {flexRender(cell.column.columnDef.cell as any, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={baseColumns.length + 1} className="h-24 text-center text-gray-400">
                    {loading ? 'Cargando datos...' : 'No hay resultados.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-col gap-3 py-4">
          <div className="text-xs sm:text-sm text-gray-400 text-center">
            {loading ? '' : total > 0 ? `${Math.min((page - 1) * pageSize + 1, total)}–${Math.min(page * pageSize, total)} de ${total}` : 'Sin resultados'}
          </div>

          {!loading && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Select.Root value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
              <Select.Trigger id="employees-page-size" className="flex items-center justify-between px-3 py-2 text-xs sm:text-sm bg-gray-900 border border-gray-800 rounded text-gray-200" aria-label="Filas por página">
                <Select.Value />
                <Select.Icon>
                  <ChevronDown size={16} className="text-gray-400" />
                </Select.Icon>
              </Select.Trigger>
              <Select.Portal>
                <Select.Content className="overflow-hidden bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-lg z-50">
                  <Select.Viewport className="p-1">
                    <Select.Item value={"10"} className="relative flex items-center px-8 py-2 text-sm text-slate-900 dark:text-slate-200 rounded cursor-pointer select-none outline-none hover:bg-slate-100 dark:hover:bg-slate-600">
                      <Select.ItemIndicator className="absolute left-2 inline-flex items-center"><Check size={14} /></Select.ItemIndicator>
                      <Select.ItemText>10</Select.ItemText>
                    </Select.Item>
                    <Select.Item value={"20"} className="relative flex items-center px-8 py-2 text-sm text-slate-900 dark:text-slate-200 rounded cursor-pointer select-none outline-none hover:bg-slate-100 dark:hover:bg-slate-600">
                      <Select.ItemIndicator className="absolute left-2 inline-flex items-center"><Check size={14} /></Select.ItemIndicator>
                      <Select.ItemText>20</Select.ItemText>
                    </Select.Item>
                    <Select.Item value={"50"} className="relative flex items-center px-8 py-2 text-sm text-slate-900 dark:text-slate-200 rounded cursor-pointer select-none outline-none hover:bg-slate-100 dark:hover:bg-slate-600">
                      <Select.ItemIndicator className="absolute left-2 inline-flex items-center"><Check size={14} /></Select.ItemIndicator>
                      <Select.ItemText>50</Select.ItemText>
                    </Select.Item>
                    <Select.Item value={"100"} className="relative flex items-center px-8 py-2 text-sm text-slate-900 dark:text-slate-200 rounded cursor-pointer select-none outline-none hover:bg-slate-100 dark:hover:bg-slate-600">
                      <Select.ItemIndicator className="absolute left-2 inline-flex items-center"><Check size={14} /></Select.ItemIndicator>
                      <Select.ItemText>100</Select.ItemText>
                    </Select.Item>
                  </Select.Viewport>
                </Select.Content>
              </Select.Portal>
            </Select.Root>

            <nav aria-label="Paginación" className="flex items-center gap-1 flex-wrap justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="bg-gray-900 border-gray-700 hover:bg-gray-800"
                aria-label="Página anterior"
              >
                ‹
              </Button>

              {visiblePages.length === 0 ? null : visiblePages.map((p, idx) => (
                typeof p === 'string' ? (
                  <span key={`e-${idx}`} className="px-2 text-gray-500">{p}</span>
                ) : (
                  <Button
                    key={p}
                    size="sm"
                    variant="outline"
                    onClick={() => setPage(Number(p))}
                    className={
                      `px-2 ${p === page ? 'bg-gray-800 text-white border-gray-600' : 'bg-gray-900 text-gray-200 border-gray-700'} h-8`
                    }
                    aria-current={p === page ? 'page' : undefined}
                    aria-label={`Ir a la página ${p}`}
                  >
                    {p}
                  </Button>
                )
              ))}

              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages || p + 1, p + 1))}
                disabled={totalPages === 0 || page >= totalPages}
                className="bg-gray-900 border-gray-700 hover:bg-gray-800"
                aria-label="Página siguiente"
              >
                ›
              </Button>
            </nav>
          </div>
          )}
        </div>
      </div>
    </div>
  )
}

