// supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qzgsfifqyeoiakbqjfrx.supabase.co'; 
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6Z3NmaWZxeWVvaWFrYnFqZnJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2ODc3NTEsImV4cCI6MjA2MDI2Mzc1MX0.EY8eHKMUhMpdP_IvOZsNjveX3bYOfF-Or7mLHW_CxEo'; // 🔁 Replace with your key

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

