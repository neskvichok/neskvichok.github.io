"use client";
import { createClient } from "@/lib/supabase-client";
export default function SignOutButton() {
  const supabase = createClient();
  return (
    <button
      className="btn btn-primary"
      onClick={async () => { await supabase.auth.signOut(); location.assign("/"); }}
    >Вийти</button>
  )
}
