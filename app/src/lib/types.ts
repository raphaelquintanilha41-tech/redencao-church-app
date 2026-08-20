// Mirrors public.profiles from supabase/migrations/0001_phase1_foundation.sql.
export interface Profile {
id: string;
user_id: string;
full_name: string | null;
avatar_url: string | null;
email: string | null;
created_at: string;
updated_at: string;
}
