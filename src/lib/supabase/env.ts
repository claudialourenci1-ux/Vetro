const requiredEnvironmentVariables = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
] as const

export function getSupabaseEnv() {
  const values = requiredEnvironmentVariables.map((name) => [name, process.env[name]] as const)
  const missing = values.filter(([, value]) => !value).map(([name]) => name)

  if (missing.length > 0) {
    throw new Error(`Missing required Supabase environment variables: ${missing.join(', ')}`)
  }

  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  }
}
