import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

async function listTables() {
  try {
    // PostgREST exposes table information via a GET request to the root or a specialized query
    // A reliable way for Supabase is often checking the OpenAPI definition or just trying to select from a common table
    // However, if we want all tables, we can query information_schema if the anon key allows it (it usually doesn't).
    
    // Better: Fetch the OpenAPI definition from the base URL
    const response = await fetch(`${process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL}/rest/v1/`, {
      headers: {
        'apikey': process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY}`
      }
    });
    
    const data = await response.json();
    if (data.definitions) {
      const tables = Object.keys(data.definitions);
      console.log('TABLES_FOUND:' + JSON.stringify(tables));
    } else {
      console.log('ERROR: No definitions found in OpenAPI spec');
    }
  } catch (error) {
    console.error('ERROR:' + error.message);
  }
}

listTables();
