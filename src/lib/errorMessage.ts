/** Extrai uma mensagem legível de qualquer erro, incluindo erros do Supabase (PostgrestError),
 * que não são instâncias de `Error` mas têm um campo `.message`. */
export function getErrorMessage(err: unknown, fallback = 'Erro inesperado'): string {
  if (err instanceof Error) return err.message
  if (err && typeof err === 'object' && 'message' in err && typeof err.message === 'string') {
    return err.message
  }
  return fallback
}
