import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

// Try to load from .env.local
const env = dotenv.parse(fs.readFileSync('.env.local'));
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateStock() {
    console.log('Updating stock for Batch 6...');
    const { error: error4 } = await supabase
        .from('inventory')
        .update({ stock_count: 30 })
        .eq('item_name', 'Box of 4');

    const { error: error6 } = await supabase
        .from('inventory')
        .update({ stock_count: 5 })
        .eq('item_name', 'Box of 6');

    if (error4 || error6) {
        console.error('Error updating stock:', error4 || error6);
    } else {
        console.log('Successfully updated stock: Box of 4 (30), Box of 6 (5)');
    }
}

updateStock();
