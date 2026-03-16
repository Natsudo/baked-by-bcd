
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
try {
    process.loadEnvFile(path.join(__dirname, '.env.local'));
} catch (e) {}

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function update() {
    console.log('Attempting to update Box of 4 to 10...');
    const { error: err4 } = await supabase.from('inventory').update({ stock_count: 10 }).eq('item_name', 'Box of 4');
    if (err4) console.error('Error Box 4:', err4);
    else console.log('Updated Box 4');

    console.log('Attempting to update Box of 6 to 4...');
    const { error: err6 } = await supabase.from('inventory').update({ stock_count: 4 }).eq('item_name', 'Box of 6');
    if (err6) console.error('Error Box 6:', err6);
    else console.log('Updated Box 6');

    console.log('Attempting to insert Box of 3 with 20...');
    const { error: err3 } = await supabase.from('inventory').insert([{ item_name: 'Box of 3', stock_count: 20 }]);
    if (err3) console.error('Error Box 3:', err3);
    else console.log('Inserted Box 3');
}

update();
