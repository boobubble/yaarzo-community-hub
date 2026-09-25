import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

import { validateSameOrigin } from "@/lib/codychat-adapter";

type LoginBody = {
  username?: string;
  password?: string;
};

const invalidCredentials = () =>
  Response.json(
    { error: "Invalid username or password." },
    {
      status: 401,
      headers: { "Cache-Control": "no-store" },
    },
  );

export const Route = createFileRoute("/api/auth/username-login")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!validateSameOrigin(request)) {
          return Response.json(
            { error: "Invalid request origin." },
            { status: 403 },
          );
        }

        const supabaseUrl = process.env["VITE_SUPABASE_URL"];
        const publishableKey = process.env["VITE_SUPABASE_ANON_KEY"];
        const serviceRoleKey = process.env["SUPABASE_SERVICE_ROLE_KEY"];

        if (!supabaseUrl || !publishableKey || !serviceRoleKey) {
          return Response.json(
            { error: "Username login is not configured." },
            { status: 503 },
          );
        }

        let body: LoginBody;

        try {
          body = (await request.json()) as LoginBody;
        } catch {
          return invalidCredentials();
        }

        const username = String(body.username ?? "").trim();
        const password = String(body.password ?? "");

        if (
          !username ||
          username.length > 64 ||
          !password ||
          password.length > 512
        ) {
          return invalidCredentials();
        }

        try {
          const admin = createClient(supabaseUrl, serviceRoleKey, {
            auth: {
              autoRefreshToken: false,
              persistSession: false,
            },
          });

          const { data: profile, error: profileError } = await admin
            .from("profiles")
            .select("id")
            .ilike("username", username)
            .limit(1)
            .maybeSingle();

          if (profileError || !profile?.id) {
            return invalidCredentials();
          }

          const { data: authUser, error: authUserError } =
            await admin.auth.admin.getUserById(profile.id);

          const email = authUser.user?.email;

          if (authUserError || !email) {
            return invalidCredentials();
          }

          const auth = createClient(supabaseUrl, publishableKey, {
            auth: {
              autoRefreshToken: false,
              persistSession: false,
            },
          });

          const { data, error } = await auth.auth.signInWithPassword({
            email,
            password,
          });

          if (error || !data.session || !data.user) {
            return invalidCredentials();
          }

          return Response.json(
            {
              authenticated: true,
              session: {
                access_token: data.session.access_token,
                refresh_token: data.session.refresh_token,
                expires_in: data.session.expires_in,
                expires_at: data.session.expires_at,
                token_type: data.session.token_type,
              },
              user: {
                id: data.user.id,
              },
            },
            {
              headers: {
                "Cache-Control": "no-store",
              },
            },
          );
        } catch {
          return invalidCredentials();
        }
      },
    },
  },
});