
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase URL or Key missing in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupInventory() {
    console.log('Setting up inventory...');
    
    const items = [
        { item_name: 'Box of 4', stock_count: 80 },
        { item_name: 'Box of 6', stock_count: 15 }
    ];

    for (const item of items) {
        const { data, error } = await supabase
            .from('inventory')
            .upsert(item, { onConflict: 'item_name' });

        if (error) {
            console.error(`Error updating ${item.item_name}:`, error);
        } else {
            console.log(`Successfully set ${item.item_name} to ${item.stock_count}`);
        }
    }
}

setupInventory();
