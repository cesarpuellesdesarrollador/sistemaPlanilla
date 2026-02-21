"use client"

import { useEffect, useState } from 'react'

export default function useMasters() {
  const [masters, setMasters] = useState<{ departments: string[]; occupations: string[]; states: string[]; usage?: { departments?: Record<string, number>; occupations?: Record<string, number>; states?: Record<string, number> } } | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchMasters = async () => {
    setLoading(true)
    try {
      const resp = await fetch('/api/planning/masters')
      const json = await resp.json()
      setMasters(json)
    } catch (err) {
      console.error('error fetching masters', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMasters()
  }, [])

  const add = async (type: 'department' | 'occupation' | 'state', value: string) => {
    const resp = await fetch('/api/planning/masters', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type, value }) })
    const j = await resp.json()
    if (resp.ok) await fetchMasters()
    return j
  }

  const update = async (type: 'department' | 'occupation' | 'state', oldValue: string, newValue: string) => {
    const resp = await fetch('/api/planning/masters', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type, oldValue, newValue }) })
    const j = await resp.json()
    if (resp.ok) await fetchMasters()
    return j
  }

  const remove = async (type: 'department' | 'occupation' | 'state', value: string) => {
    const resp = await fetch(`/api/planning/masters?type=${encodeURIComponent(type)}&value=${encodeURIComponent(value)}`, { method: 'DELETE' })
    const j = await resp.json()
    if (resp.ok) await fetchMasters()
    return j
  }

  return { masters, loading, refresh: fetchMasters, add, update, remove }
}
