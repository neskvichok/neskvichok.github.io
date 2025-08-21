"use client";
import { createClient } from "@/lib/supabase-client";
import { withBasePath } from "@/lib/utils";

export default function SignOutButton() {
  const supabase = createClient();
  return (
    <button
      className="btn btn-primary"
      onClick={async () => { 
        await supabase.auth.signOut(); 
        location.assign(withBasePath("/")); 
      }}
    >Вийти</button>
  )
}
