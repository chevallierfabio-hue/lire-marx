/* ============================================================
   Lire Marx — configuration Supabase
   ------------------------------------------------------------
   Remplis les deux valeurs ci-dessous UNE SEULE FOIS, puis
   commit ce fichier. Les mises à jour d'index.html n'y touchent
   jamais : tes clés survivent à tous les redéploiements.

   Où trouver ces valeurs : tableau de bord Supabase
     - url  : Project Settings → API  (Project URL,
              de la forme https://xxxx.supabase.co)
     - anon : Project Settings → API Keys → clé « Publishable »
              (sb_publishable_...) ou, pour un projet ancien,
              la clé « anon » de l'onglet Legacy API Keys.

   La clé publishable / anon est PUBLIQUE par conception : il est
   normal qu'elle figure dans ce fichier commité. Ne mets JAMAIS
   ici la clé « secret » / « service_role ».
   ============================================================ */
window.LIREMARX_SUPABASE = {
  url:  'https://VOTRE-PROJET.supabase.co',
  anon: 'VOTRE_CLE_PUBLISHABLE_OU_ANON'
};
