import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function DELETE(req) {
  const { email } = await req.json();

  // 1. Ambil user ID dari email
  const { data: userData, error: fetchError } = await supabase
    .auth
    .admin
    .listUsers({ page: 1, perPage: 1000 }); // sesuaikan bila banyak user

  if (fetchError) {
    return NextResponse.json({ success: false, error: fetchError.message }, { status: 500 });
  }

  const user = userData.users.find(u => u.email === email);
  if (!user) {
    return NextResponse.json({ success: false, error: 'User not found in Auth' }, { status: 404 });
  }

  const userId = user.id;

  // 2. Hapus dari Supabase Auth
  const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(userId);
  if (deleteAuthError) {
    return NextResponse.json({ success: false, error: deleteAuthError.message }, { status: 500 });
  }

  // 3. Hapus dari allowed_users
  const { error: deleteDbError } = await supabase
    .from('allowed_users')
    .delete()
    .eq('email', email);

  if (deleteDbError) {
    return NextResponse.json({ success: false, error: deleteDbError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
