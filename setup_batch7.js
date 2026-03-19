
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Use native loadEnvFile supported in Node 20.6.0+
try {
    process.loadEnvFile(path.join(__dirname, '.env.local'));
} catch (e) {
    console.warn('.env.local not found, relying on existing environment variables');
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase URL or Key missing in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupBatch7() {
    console.log('Setting up Batch 7 inventory...');

    const items = [
        { name: 'Box of 3', stock: 40 },
        { name: 'Box of 4', stock: 30 },
        { name: 'Box of 6', stock: 10 }
    ];

    for (const item of items) {
        // Upsert item
        const { data, error } = await supabase
            .from('inventory')
            .update({ stock_count: item.stock })
            .eq('item_name', item.name);

        if (error) {
            console.error(`Error updating ${item.name}:`, error);
        } else {
            console.log(`Successfully set ${item.name} stock to ${item.stock}`);
        }
    }
}

setupBatch7();
