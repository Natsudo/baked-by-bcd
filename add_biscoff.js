import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

try {
    process.loadEnvFile(path.join(__dirname, '.env.local'));
} catch (e) {}

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function addBiscoff() {
    const itemName = 'Biscoff Box of 4';
    const initialStock = 40;

    // Check if it exists
    const { data: existing } = await supabase.from('inventory').select('*').eq('item_name', itemName).single();

    if (existing) {
        console.log('Item already exists, updating stock...');
        const { error } = await supabase.from('inventory').update({ stock_count: initialStock }).eq('item_name', itemName);
        if (error) console.error('Error updating stock:', error);
        else console.log('Successfully updated stock to', initialStock);
    } else {
        console.log('Item doesn\'t exist, inserting...');
        const { error } = await supabase.from('inventory').insert([{ item_name: itemName, stock_count: initialStock }]);
        if (error) console.error('Error inserting item:', error);
        else console.log('Successfully added', itemName, 'with stock', initialStock);
    }
}

addBiscoff();
