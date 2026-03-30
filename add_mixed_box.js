
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

async function addMixedBox() {
    console.log('Adding "Biscoff and Pistacio Mixed" to inventory...');

    // First check if it exists
    const { data: existing } = await supabase
        .from('inventory')
        .select('*')
        .eq('item_name', 'Biscoff and Pistacio Mixed')
        .single();

    if (existing) {
        console.log('Item already exists. Updating stock to 40.');
        await supabase.from('inventory').update({ stock_count: 40 }).eq('item_name', 'Biscoff and Pistacio Mixed');
    } else {
        const { error } = await supabase
            .from('inventory')
            .insert([{ item_name: 'Biscoff and Pistacio Mixed', stock_count: 40 }]);

        if (error) {
            console.error('Error adding item:', error);
        } else {
            console.log('Successfully added "Biscoff and Pistacio Mixed" with 40 stock.');
        }
    }
}

addMixedBox();
