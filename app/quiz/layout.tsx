import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";

export default async function QuizLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) redirect("/auth/sign-in");

  return (
    <div className="container mx-auto p-6">
      {children}
    </div>
  );
}


