import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const bulan = searchParams.get('bulan');
    const tahun = searchParams.get('tahun');

    if (!bulan || !tahun) {
      return new Response(JSON.stringify({ error: 'bulan dan tahun wajib diisi' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const start = `${tahun}-${bulan.padStart(2, '0')}-01T00:00:00Z`;
    const end = new Date(Number(tahun), Number(bulan), 0).toISOString();

    let allData = [];
    let from = 0;
    const batchSize = 1000;
    let keepFetching = true;

    while (keepFetching) {
      const to = from + batchSize - 1;
      const { data, error } = await supabase
        .from('input_db')
        .select('*')
        .gte('timestamp', start)
        .lte('timestamp', end)
        .range(from, to);

      if (error) {
        console.error('❌ Supabase Error:', error.message);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      allData = allData.concat(data);

      console.log(`📦 Fetched ${data.length} rows (from ${from} to ${to})`);

      if (data.length < batchSize) {
        keepFetching = false;
      } else {
        from += batchSize;
      }
    }

    return new Response(JSON.stringify(allData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('💥 Uncaught Error:', err);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
