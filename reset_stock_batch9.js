
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

try {
    process.loadEnvFile(path.join(__dirname, '.env.local'));
} catch (e) {}

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function resetStock() {
    const stockToSet = 40;
    const items = ['Box of 3', 'Box of 4', 'Box of 6', 'Biscoff Box of 4', 'Biscoff and Pistacio Mixed'];

    console.log('Resetting stock for Batch 9...');

    for (const item of items) {
        console.log(`Setting ${item} to ${stockToSet}...`);
        const { error } = await supabase.from('inventory').update({ stock_count: stockToSet }).eq('item_name', item);
        if (error) console.error(`Error updating ${item}:`, error);
        else console.log(`Successfully updated ${item}.`);
    }

    // Also update RELEASE_TIME to now + 5 mins? Or leave it to the user.
    // I'll leave it as is if they haven't asked for a specific release time.
}

resetStock();
