export function joinBase(base: string, path: string): string {
  const normalizedBase = base.endsWith('/') ? base : `${base}/`
  return normalizedBase + path.replace(/^\/+/, '')
}

export function routerBasename(base: string = import.meta.env.BASE_URL ?? '/'): string {
  const trimmed = base.replace(/\/+$/, '')
  return trimmed === '' ? '/' : trimmed
}

export function asset(path: string): string {
  return joinBase(import.meta.env.BASE_URL ?? '/', path)
}
