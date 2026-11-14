import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";

const GRUPO_RECEIVER = "https://chatroom-origin.yaarzo.com/sso/consume.php";

function GrupoChatroomEntry() {
  const started = useRef(false);
  const [message, setMessage] = useState("Connecting to Grupo chatroom...");

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    async function enterGrupo() {
      try {
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        if (!token) { setMessage("Please sign in to Yaarzo first."); return; }

        const response = await fetch("/api/chat/grupo-sso", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          credentials: "same-origin",
        });
        const result = await response.json();
        if (!response.ok || !result.ok || !result.ticket) {
          setMessage(result.error || "Unable to connect to Grupo.");
          return;
        }
        if (result.receiverUrl !== GRUPO_RECEIVER) {
          setMessage("Invalid Grupo receiver configuration.");
          return;
        }

        const form = document.createElement("form");
        form.method = "POST";
        form.action = GRUPO_RECEIVER;
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = "ticket";
        input.value = result.ticket;
        form.appendChild(input);
        document.body.appendChild(form);
        form.submit();
      } catch {
        setMessage("Unable to connect to Grupo. Please try again.");
      }
    }

    void enterGrupo();
  }, []);

  return <main className="flex min-h-screen items-center justify-center bg-[#080b18] px-4 text-center text-white"><p className="text-lg font-semibold">{message}</p></main>;
}

export const Route = createFileRoute("/chatroom")({
  head: () => ({ meta: [{ title: "Yaarzo Chatroom" }] }),
  component: GrupoChatroomEntry,
});
