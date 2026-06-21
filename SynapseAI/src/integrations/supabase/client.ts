import { createClient } from "@supabase/supabase-js"

const SUPABASE_URL = "https://ldjdixnnbxsyxhpplrwt.supabase.co"
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkamRpeG5uYnhzeXhocHBscnd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzMDc5NDcsImV4cCI6MjA5Njg4Mzk0N30.VzhcFQ1v26TycqmehtvMGmYspyOscK5ubMU0Yk3x4V4"

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
