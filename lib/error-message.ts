export function getErrorMessage(error: unknown, fallback = 'Something went wrong. Try again.') {
  const message = error instanceof Error ? error.message.toLowerCase() : ''
  if (message.includes('fetch') || message.includes('network') || message.includes('offline')) return 'Network issue. Check your connection.'
  if (message.includes('invalid login') || message.includes('invalid credentials')) return 'Email or password is incorrect.'
  if (message.includes('duplicate') || message.includes('already exists')) return 'This record already exists.'
  if (message.includes('permission') || message.includes('not authorized')) return 'You do not have permission for this action.'
  return fallback
}

export function logClientError(operation: string, error: unknown, context?: Record<string, unknown>) {
  const value = error as { message?: string; code?: string; details?: string; hint?: string; status?: number } | null
  console.error(`[${operation}]`, {
    ...context,
    message: value?.message || String(error),
    code: value?.code,
    details: value?.details,
    hint: value?.hint,
    status: value?.status,
    raw: error,
  })
}
