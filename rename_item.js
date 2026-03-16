
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
try {
    process.loadEnvFile(path.join(__dirname, '.env.local'));
} catch (e) {}

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function rename() {
    console.log('Attempting to rename Chewy Cookie to Box of 3 and set stock to 20...');
    const { data, error } = await supabase
        .from('inventory')
        .update({ item_name: 'Box of 3', stock_count: 20 })
        .eq('item_name', 'Chewy Cookie')
        .select();

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Success:', JSON.stringify(data, null, 2));
    }
}

rename();
