
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'YOUR_URL'; // I should get these from .env.local or process.env
const supabaseKey = 'YOUR_KEY';

// Actually, I can just read .env.local myself
import fs from 'fs';
const env = fs.readFileSync('.env.local', 'utf8');
const urlMatch = env.match(/VITE_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

const url = urlMatch ? urlMatch[1].trim() : '';
const key = keyMatch ? keyMatch[1].trim() : '';

const supabase = createClient(url, key);

async function setupInventory() {
  console.log("Setting up inventory...");
  
  // Upsert 'Box of 4'
  const { error: err4 } = await supabase
    .from('inventory')
    .upsert({ item_name: 'Box of 4', stock_count: 80 }, { onConflict: 'item_name' });
  
  if (err4) console.error("Error upserting Box of 4:", err4);
  else console.log("Upserted Box of 4: 80");

  // Upsert 'Box of 6'
  const { error: err6 } = await supabase
    .from('inventory')
    .upsert({ item_name: 'Box of 6', stock_count: 15 }, { onConflict: 'item_name' });

  if (err6) console.error("Error upserting Box of 6:", err6);
  else console.log("Upserted Box of 6: 15");
  
  // Also keep 'Chewy Cookie' if needed for legacy, or just leave it.
}

setupInventory();
