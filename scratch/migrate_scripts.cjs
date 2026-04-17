const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hywlytsbogbassecflbw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5d2x5dHNib2diYXNzZWNmbGJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzODI2ODMsImV4cCI6MjA4OTk1ODY4M30.1FB0-PMfuTBJ9oJWRJMkKA3vQKkIS1LrNFXEvtmHpWY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrate() {
    console.log('Iniciando migración de estados...');
    
    const { data, error } = await supabase
        .from('scripts')
        .update({ status: 'writing' })
        .in('status', ['drafting', 'structuring', 'refined']);

    if (error) {
        console.error('Error en la migración:', error);
    } else {
        console.log('Migración completada exitosamente.');
    }
}

migrate();
