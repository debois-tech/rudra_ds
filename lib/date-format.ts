export function parseManualDate(text: string): Date | null {
  const match = text.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (!match) return null
  const day = Number(match[1])
  const monthNum = Number(match[2])
  const year = Number(match[3])
  if (monthNum < 1 || monthNum > 12) return null
  const date = new Date(year, monthNum - 1, day)
  if (date.getFullYear() !== year || date.getMonth() !== monthNum - 1 || date.getDate() !== day) return null
  return date
}

export function formatManualDate(date: Date): string {
  const dd = String(date.getDate()).padStart(2, '0')
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  return `${dd}/${mm}/${date.getFullYear()}`
}


export function autoFormatDateInput(text: string): string {
  const digits = text.replace(/\D/g, '').slice(0, 8)
  const parts: string[] = []
  if (digits.length > 0) parts.push(digits.slice(0, 2))
  if (digits.length > 2) parts.push(digits.slice(2, 4))
  if (digits.length > 4) parts.push(digits.slice(4, 8))
  return parts.join('/')
}
