'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { addDays, addMonths, format, getDay, getYear, isSameDay, parse, setMonth as setDateMonth, setYear as setDateYear, startOfMonth } from 'date-fns'
import { CalendarDays, ChevronLeft, ChevronRight, Clock3 } from 'lucide-react'
import { cn } from '@/lib/utils'

type Mode = 'date' | 'time'
const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

type Props = {
  value?: string
  onChange: (value: string) => void
  mode?: Mode
  required?: boolean
  className?: string
}

export function DateTimePicker({ value = '', onChange, mode = 'date', required, className }: Props) {
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<'days' | 'months' | 'years'>('days')
  const buttonRef = useRef<HTMLButtonElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const currentYearRef = useRef<HTMLButtonElement>(null)
  const [position, setPosition] = useState({ left: 0, top: 0, width: 0 })
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null)
  const [month, setMonth] = useState(() => value && mode === 'date' ? startOfMonth(parse(value, 'yyyy-MM-dd', new Date())) : startOfMonth(new Date()))
  const selected = value && mode === 'date' ? parse(value, 'yyyy-MM-dd', new Date()) : new Date()
  const days = Array.from({ length: 42 }, (_, index) => addDays(startOfMonth(month), index - getDay(startOfMonth(month))))
  const currentYear = new Date().getFullYear()
  const years = [currentYear, ...Array.from({ length: 10 }, (_, index) => currentYear + index + 1), ...Array.from({ length: 60 }, (_, index) => currentYear - index - 1)]
  const hours = Array.from({ length: 24 }, (_, index) => index)
  const minutes = Array.from({ length: 60 }, (_, index) => index)

  const label = mode === 'time'
    ? value ? format(parse(value, 'HH:mm', new Date()), 'h:mm a') : 'Select time'
    : value ? format(selected, 'dd MMM yyyy') : 'Select date'

  useEffect(() => {
    if (!open || !buttonRef.current) return
    setPortalTarget((buttonRef.current.closest('[data-slot="sheet-content"]') as HTMLElement | null) || document.body)
    const updatePosition = () => {
      const rect = buttonRef.current!.getBoundingClientRect()
      setPosition({ left: rect.left, top: rect.bottom + 8, width: rect.width })
    }
    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [open])

  useEffect(() => {
    if (view === 'years') currentYearRef.current?.focus()
  }, [view])

  useEffect(() => {
    if (!open) return
    const closeOnOutside = (event: Event) => {
      const target = event.target as Node
      if (!rootRef.current?.contains(target) && !panelRef.current?.contains(target)) setOpen(false)
    }
    document.addEventListener('pointerdown', closeOnOutside)
    document.addEventListener('focusin', closeOnOutside)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutside)
      document.removeEventListener('focusin', closeOnOutside)
    }
  }, [open])

  if (mode === 'time') {
    const currentTime = value ? parse(value, 'HH:mm', new Date()) : new Date()
    const selectedHour = value ? currentTime.getHours() : 0
    const selectedMinute = value ? currentTime.getMinutes() : 0
    const chooseTime = (hour: number, minute: number) => onChange(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`)
    return <div ref={rootRef} className="relative"><button ref={buttonRef} type="button" aria-label="Select time" aria-expanded={open} onClick={() => setOpen(!open)} className={cn('flex h-11 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3.5 text-left text-sm text-slate-700 shadow-sm outline-none transition hover:border-amber-300 focus:border-amber-400 focus:ring-2 focus:ring-amber-100', !value && 'text-slate-400', className)}><span>{value ? format(currentTime, 'HH:mm') : 'Select time'}</span><Clock3 className="h-4 w-4 text-slate-400" /></button>{open && portalTarget && createPortal(<div ref={panelRef} style={{ position: 'fixed', left: position.left, top: position.top, width: position.width }} className="z-[100] flex gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-900/10"><div className="min-w-0 flex-1"><p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Hour</p><div className="max-h-[220px] overflow-y-auto pr-1">{hours.map(hour => <button autoFocus={hour === selectedHour} type="button" key={hour} onClick={() => chooseTime(hour, selectedMinute)} className={cn('mb-1 block w-full rounded-lg px-3 py-2 text-center text-xs text-slate-700 hover:bg-amber-50', hour === selectedHour && 'bg-amber-400 font-semibold text-slate-950')}>{String(hour).padStart(2, '0')}</button>)}</div></div><div className="min-w-0 flex-1"><p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Minute</p><div className="max-h-[220px] overflow-y-auto pr-1">{minutes.map(minute => <button type="button" key={minute} onClick={() => chooseTime(selectedHour, minute)} className={cn('mb-1 block w-full rounded-lg px-3 py-2 text-center text-xs text-slate-700 hover:bg-amber-50', minute === selectedMinute && 'bg-amber-400 font-semibold text-slate-950')}>{String(minute).padStart(2, '0')}</button>)}</div></div></div>, portalTarget)}</div>
  }

  return (
    <div ref={rootRef} className="relative">
      <button ref={buttonRef} type="button" aria-label={label} aria-expanded={open} onClick={() => { setOpen(!open); setView('days') }} className={cn('flex h-11 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-left shadow-sm transition hover:border-amber-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200', !value && 'text-slate-400', className)}>
        <span>{label}</span>
        <CalendarDays className="h-4 w-4 text-slate-400" />
      </button>
      {required && <input tabIndex={-1} required value={value} onChange={() => undefined} className="sr-only" aria-hidden="true" />}
      {open && mode === 'date' && (
        portalTarget && createPortal(<div ref={panelRef} style={{ position: 'fixed', left: position.left, top: position.top }} className="z-[100] w-[280px] rounded-2xl border border-slate-200 bg-white p-3 shadow-xl shadow-slate-900/10">
          <div className="mb-2 flex items-center justify-between">
            <button type="button" onClick={() => setMonth(addMonths(month, -1))} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"><ChevronLeft className="h-4 w-4" /></button>
            <div className="flex items-center gap-1"><button type="button" onClick={() => setView(view === 'months' ? 'days' : 'months')} className="rounded-lg bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-800 hover:bg-amber-50">{monthNames[month.getMonth()]}</button><button type="button" onClick={() => setView(view === 'years' ? 'days' : 'years')} className="rounded-lg bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-800 hover:bg-amber-50">{getYear(month)}</button></div>
            <button type="button" onClick={() => setMonth(addMonths(month, 1))} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"><ChevronRight className="h-4 w-4" /></button>
          </div>
          <div className="grid grid-cols-7 text-center text-[10px] font-semibold uppercase text-slate-400">{['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => <span key={day} className="py-1">{day}</span>)}</div>
          {view === 'days' && <div className="grid grid-cols-7 gap-1">
            {days.map(day => <button type="button" key={day.toISOString()} onClick={() => { onChange(format(day, 'yyyy-MM-dd')); setOpen(false) }} className={cn('h-8 rounded-lg text-xs transition hover:bg-amber-50', day.getMonth() !== month.getMonth() && 'text-slate-300', value && isSameDay(day, selected) && day.getMonth() === month.getMonth() && 'bg-amber-400 font-semibold text-slate-950 hover:bg-amber-400')}>{day.getDate()}</button>)}
          </div>}
          {view === 'months' && <div className="grid grid-cols-3 gap-2">{monthNames.map((name, index) => <button type="button" key={name} onClick={() => { setMonth(setDateMonth(month, index)); setView('days') }} className={cn('rounded-lg px-2 py-2 text-xs text-slate-700 hover:bg-amber-50', index === month.getMonth() && 'bg-amber-400 font-semibold text-slate-950')}>{name.slice(0, 3)}</button>)}</div>}
          {view === 'years' && <div className="flex max-h-[232px] flex-col gap-1 overflow-y-auto pr-1">{years.map(year => <button ref={year === currentYear ? currentYearRef : undefined} type="button" key={year} onClick={() => { setMonth(setDateYear(month, year)); setView('months') }} className={cn('rounded-lg px-3 py-2 text-left text-xs text-slate-700 hover:bg-amber-50', year === getYear(month) && 'bg-amber-400 font-semibold text-slate-950')}>{year}</button>)}</div>}
        </div>, portalTarget)
      )}
    </div>
  )
}
