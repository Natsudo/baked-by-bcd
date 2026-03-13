
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf8');
const urlMatch = env.match(/VITE_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

const url = urlMatch ? urlMatch[1].trim() : '';
const key = keyMatch ? keyMatch[1].trim() : '';

const supabase = createClient(url, key);

async function checkInventory() {
  const { data, error } = await supabase.from('inventory').select('*');
  if (error) {
    console.error("Error fetching inventory:", error);
  } else {
    console.log("Inventory Table Content:");
    console.table(data);
  }
}

checkInventory();
