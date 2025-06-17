import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  const { email, password, pic_name, role } = await req.json();

  // Buat akun di Supabase Auth
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true // ⬅️ penting!
  });

  if (authError) {
    return NextResponse.json({ success: false, error: authError.message }, { status: 500 });
  }

  // Tambahkan ke tabel allowed_users
  const { error: dbError } = await supabase
    .from('allowed_users')
    .insert({ email, pic_name, role });

  if (dbError) {
    return NextResponse.json({ success: false, error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
