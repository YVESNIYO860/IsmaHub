import type { VercelResponse } from '@vercel/node'

export class ApiError extends Error {
  public readonly status: number

  constructor(
    status: number,
    message: string,
  ) {
    super(message)
    this.status = status
  }
}

export function sendError(res: VercelResponse, error: unknown): void {
  if (error instanceof ApiError) {
    res.status(error.status).json({ error: error.message })
    return
  }

  console.error('Unhandled API error')
  res.status(500).json({ error: 'An unexpected server error occurred.' })
}

