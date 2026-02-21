import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://vjeheraucusqfgnvbenl.supabase.co', 'sb_publishable_canMNn3oqz4mq3hQpNhzJA_Vujn2lxg');

async function test() {
    const { error } = await supabase.from('orders').insert([{
        full_name: 'Test',
        contact_number: '12345',
        quantity_type: 'per-piece',
        quantity: 1,
        total_price: 70,
        payment_mode: 'cash',
        delivery_mode: 'meetup'
    }]);

    if (error) {
        console.error('Insert Error:', error);
    } else {
        console.log('Success!');
    }
}

test();
