import * as XLSX from 'xlsx'
import { formatDateDMY } from './utils'

/**
 * Convert a date-like value to the DD/MM/YYYY string used in exports.
 * Returns an empty string for `null`/`undefined`.
 */
export function formatDateForExport(d?: Date | null | string): string {
  if (!d) return ''
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return formatDateDMY(d)
}

/**
 * Generate a workbook from headers+rows and trigger a download as an .xlsx file.
 *
 * @param headers  first row containing column titles
 * @param rows     array of row arrays (cells must be primitive values)
 * @param filename suggested file name (should end in .xlsx)
 * @param sheetName visible sheet name inside the workbook
 */
export function downloadExcel(
  headers: any[],
  rows: any[][],
  filename: string,
  sheetName = 'Sheet1',
) {
  const aoa: any[][] = [headers, ...rows]
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet(aoa)

  XLSX.utils.book_append_sheet(wb, ws, sheetName)
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([wbout], { type: 'application/octet-stream' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
