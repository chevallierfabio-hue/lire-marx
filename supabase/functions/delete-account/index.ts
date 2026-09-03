// =====================================================================
//  Edge Function : delete-account
//  Supprime DÉFINITIVEMENT le compte de l'utilisateur appelant
//  (ligne auth.users). Par cascade, cela efface aussi son profil, ses
//  annotations privées, ses notes et réponses publiques, et ses
//  signalements. La clé service_role reste confinée ici, côté serveur.
//
//  Sécurité : la fonction n'accepte AUCUN identifiant dans le corps de
//  la requête. Elle identifie l'appelant à partir de SON propre jeton
//  (Authorization) et ne supprime que ce compte-là. Personne ne peut
//  donc supprimer le compte d'autrui.
//
//  Déploiement (voir README). En bref :
//    supabase functions deploy delete-account --no-verify-jwt
//  --no-verify-jwt laisse passer le préflight CORS du navigateur ;
//  l'authentification est vérifiée ci-dessous, dans la fonction.
//  Les variables SUPABASE_URL / SUPABASE_ANON_KEY /
//  SUPABASE_SERVICE_ROLE_KEY sont injectées automatiquement.
// =====================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const token = (req.headers.get("Authorization") ?? "")
      .replace("Bearer ", "")
      .trim();
    if (!token) return json({ error: "Non authentifié." }, 401);

    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // 1) Identifier l'appelant à partir de SON jeton.
    const caller = createClient(url, anon, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const {
      data: { user },
      error: uErr,
    } = await caller.auth.getUser();
    if (uErr || !user) return json({ error: "Session invalide." }, 401);

    // 2) Supprimer ce compte avec les droits admin (cascade sur ses données).
    const admin = createClient(url, service);
    const { error: dErr } = await admin.auth.admin.deleteUser(user.id);
    if (dErr) return json({ error: dErr.message }, 400);

    return json({ ok: true }, 200);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
