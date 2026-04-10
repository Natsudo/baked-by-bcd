
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

try {
    process.loadEnvFile(path.join(__dirname, '.env.local'));
} catch (e) {}

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function setupBatch12() {
    console.log('--- Setting up BATCH 12 ---');

    // 1. Set release time to TODAY (April 10) 7:30 PM
    const releaseTime = new Date('2026-04-10T19:30:00+08:00');
    const epochSeconds = Math.floor(releaseTime.getTime() / 1000);
    
    console.log(`Setting RELEASE_TIME to ${releaseTime.toLocaleString()} (${epochSeconds})...`);
    const { error: releaseError } = await supabase
        .from('inventory')
        .update({ stock_count: epochSeconds })
        .eq('item_name', 'RELEASE_TIME');
    
    if (releaseError) console.error('Error updating release time:', releaseError);
    else console.log('Successfully updated release time.');

    // 2. Lock site for now (manual override)
    console.log('Locking site...');
    await supabase.from('inventory').update({ stock_count: 1 }).eq('item_name', 'SITE_LOCK');

    // 3. Reset stock for products
    const stockToSet = 40; 
    const items = ['Box of 3', 'Box of 4', 'Box of 6', 'Biscoff Box of 4', 'Biscoff and Pistacio Mixed'];

    for (const item of items) {
        console.log(`Setting ${item} to ${stockToSet}...`);
        const { error } = await supabase.from('inventory').update({ stock_count: stockToSet }).eq('item_name', item);
        if (error) console.error(`Error updating ${item}:`, error);
        else console.log(`Successfully updated ${item}.`);
    }

    console.log('\n--- Batch 12 setup complete! ---');
}

setupBatch12();
