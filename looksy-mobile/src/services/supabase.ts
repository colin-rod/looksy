import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for our database
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          gender: string | null;
          sizes: any | null;
          personal_styles: any | null;
          privacy_settings: any | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          gender?: string | null;
          sizes?: any | null;
          personal_styles?: any | null;
          privacy_settings?: any | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          gender?: string | null;
          sizes?: any | null;
          personal_styles?: any | null;
          privacy_settings?: any | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      // Add other table types as we build them
    };
  };
}