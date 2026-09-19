import { ALERT_TYPES, type Alert, type AlertType } from './types'

const isAlertType = (value: unknown): value is AlertType =>
  ALERT_TYPES.includes(value as AlertType)

export function parseAlert(raw: unknown): Alert | null {
  if (typeof raw !== 'string') return null

  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    return null
  }

  if (typeof data !== 'object' || data === null) return null
  const { id, type, text, timestamp } = data as Record<string, unknown>

  if (typeof id !== 'string' || !isAlertType(type) || typeof text !== 'string') {
    return null
  }

  return {
    id,
    type,
    text,
    timestamp: typeof timestamp === 'number' ? timestamp : Date.now(),
  }
}
