const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

type SupabasePublicEnv = {
  url: string
  publishableKey: string
}

export function getSupabaseEnv(): SupabasePublicEnv {
  if (!supabaseUrl) {
    throw new Error('Missing required Supabase environment variable: NEXT_PUBLIC_SUPABASE_URL')
  }

  if (!supabasePublishableKey) {
    throw new Error('Missing required Supabase environment variable: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY')
  }

  return {
    url: supabaseUrl,
    publishableKey: supabasePublishableKey,
  }
}
