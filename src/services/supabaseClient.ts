import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

const stub = {
  from: (tableName: string) => ({
    select: (columns = '*') => ({
      eq: (column: string, value: any) => ({
        limit: (limitCount: number) => ({
          data: [],
          error: 'supabase_not_configured'
        }),
        single: () => ({
          data: null,
          error: 'supabase_not_configured'
        })
      }),
      single: () => ({
        data: null,
        error: 'supabase_not_configured'
      })
    }),
    insert: (data: any) => ({
      select: () => ({
        single: () => ({
          data: null,
          error: 'supabase_not_configured'
        })
      }),
      error: 'supabase_not_configured'
    }),
    update: (data: any) => ({
      eq: (column: string, value: any) => ({
        error: 'supabase_not_configured'
      }),
      error: 'supabase_not_configured'
    }),
    delete: () => ({
      eq: (column: string, value: any) => ({
        error: 'supabase_not_configured'
      }),
      error: 'supabase_not_configured'
    })
  })
  , storage: {
    from: (bucket: string) => ({
      upload: async (path: string, file: any, opts?: any) => ({ data: null, error: 'supabase_not_configured' }),
      getPublicUrl: (path: string) => ({ data: { publicUrl: '' } })
    })
    , createBucket: async (name: string, opts?: any) => ({ data: null, error: 'supabase_not_configured' }),
    getBucket: async (name: string) => ({ data: null, error: 'supabase_not_configured' }),
    listBuckets: async () => ({ data: [], error: 'supabase_not_configured' }),
    createSignedUrl: async (bucket: string, path: string, seconds: number) => ({ data: { signedUrl: '' }, error: 'supabase_not_configured' })
  }
} as any

export const supabase = url && anonKey ? createClient(url, anonKey) : stub
