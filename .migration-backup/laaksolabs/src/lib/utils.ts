import { type ClassValue, clsx } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatCurrencyShort(amount: number): string {
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(1)}K`
  }
  return formatCurrency(amount)
}

export function calcMargin(hdCost: number, clientPrice: number): number {
  if (clientPrice === 0) return 0
  return Math.round(((clientPrice - hdCost) / clientPrice) * 100)
}

export function getFirstOfMonth(date?: Date): string {
  const d = date ?? new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0]
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function isOverdue(dueDateStr: string | null): boolean {
  if (!dueDateStr) return false
  return new Date(dueDateStr) < new Date(new Date().toDateString())
}

export function isDueToday(dueDateStr: string | null): boolean {
  if (!dueDateStr) return false
  return dueDateStr === new Date().toISOString().split('T')[0]
}
