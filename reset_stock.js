
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

async function resetStock() {
    const { data, error } = await supabase
        .from('inventory')
        .update({ stock_count: 200 })
        .eq('item_name', 'Chewy Cookie');

    if (error) {
        console.error('Error updating stock:', error);
    } else {
        console.log('Stock successfully reset to 200!');
    }
}

resetStock();
