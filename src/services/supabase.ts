import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = 'https://nxheocovjzhsmrpaxeql.supabase.co'; 
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54aGVvY292anpoc21ycGF4ZXFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3MTcxNzQsImV4cCI6MjA3ODI5MzE3NH0.yoL7clkIGXRjQXIYzY1kisX_k3CGUqd2UMsLQ2cgsOI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});