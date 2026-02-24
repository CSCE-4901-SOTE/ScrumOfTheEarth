// Edge Function to create a user using the service_role key.
// Protected by a shared header X-ADMIN-CREATE-SECRET that must match the ADMIN_CREATE_SECRET env var.

import { createClient } from 'npm:@supabase/supabase-js@2.33.0';
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ADMIN_CREATE_SECRET = Deno.env.get('ADMIN_CREATE_SECRET')!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment');
}

if (!ADMIN_CREATE_SECRET) {
  console.error('Missing ADMIN_CREATE_SECRET in environment');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

serve(async (req: Request) => {
  try {
    if (req.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    // Validate header secret
    const headerSecret = req.headers.get('x-admin-create-secret') || '';
    console.log('Received header secret:', headerSecret);
    console.log('Expected secret:', ADMIN_CREATE_SECRET);
    if (!ADMIN_CREATE_SECRET || headerSecret !== ADMIN_CREATE_SECRET) {
      console.log('Unauthorized: secret mismatch');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await req.json().catch(() => null);
    const email = body?.email;
    const password = body?.password;

    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'email and password are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create user with email confirmed to avoid sending confirmation emails
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (error) {
      // Return Supabase error as-is (status 400)
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ user: data.user }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    console.error('admin-create-user error', err);
    return new Response(JSON.stringify({ error: err?.message || 'Internal error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});