export function makeApiError(payload, status, fallbackMessage) {
  const errorPayload = payload?.error
  const message =
    (typeof errorPayload === 'object' && typeof errorPayload?.message === 'string' && errorPayload.message.trim()) ||
    (typeof errorPayload === 'string' && errorPayload.trim()) ||
    fallbackMessage

  const error = new Error(message)
  error.status = status
  error.code = typeof errorPayload === 'object' ? errorPayload?.code ?? null : null
  error.fields = typeof errorPayload === 'object' ? errorPayload?.fields ?? null : null
  return error
}
