import { supabase } from "@/lib/supabase";

export async function provisionRegisteredCodySession() {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return false;

  const response = await fetch("/api/chat/registered-login", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) return false;

  const result = (await response.json()) as { authenticated?: boolean };
  return Boolean(result.authenticated);
}
