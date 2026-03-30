
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

try {
    process.loadEnvFile(path.join(__dirname, '.env.local'));
} catch (e) {}

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkOrders() {
    const { data, error } = await supabase.from('orders').select('id, created_at, status').order('created_at', { ascending: false }).limit(20);
    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Recent Orders:', JSON.stringify(data, null, 2));
    }
}

checkOrders();
