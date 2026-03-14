import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kcwygyaehqjuocqgbkni.supabase.co'
const supabaseAnonKey = 'sb_publishable_KJd8FUti5aMAgqgT_9TWog_29tf5f4w'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)