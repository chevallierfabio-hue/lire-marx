// Shell partagé du site Lire Marx (topbar 44 px + sidebar 208 px + modales).
//
// Cette première version pilote les pages d'atelier qui n'embarquent pas
// encore tout le code (auth Supabase, forum public, modération, recherche).
// Sur ces pages, les boutons compte / messages / notifications / forum
// renvoient vers oeuvres/capital-1.html, qui héberge encore la coquille
// applicative complète.
//
// Capital-1.html continue d'inliner sa propre coquille HTML + JS. À terme
// (mission future), il consommera aussi installShell() pour devenir un
// simple livre comme les autres.
//
// Utilisation, sur la page d'un livre :
//
//   <link rel="stylesheet" href="atelier.css">
//   <link rel="stylesheet" href="shell.css">
//   <link rel="stylesheet" href="<id-oeuvre>.css">
//   <script src="shell.js"></script>
//   <script>
//     installShell({
//       workId: 'manuscrits-1844',
//       workTitle: 'Manuscrits de 1844',
//       tabs: [
//         {id:'accueil', label:'Accueil'},
//         {id:'nav',     label:'Parcourir'},
//         {id:'lire',    label:'Texte intégral'},
//         ...
//       ]
//     });
//   </script>
//
// La page doit aussi exposer une fonction `window.activateTab(id)` qui
// affiche le panel correspondant — c'est elle qui fait le lien entre la
// sidebar et le contenu propre au livre.

(function(){
  // Page principale qui héberge encore la coquille applicative complète :
  // c'est là qu'on redirige pour les fonctionnalités pas encore extraites
  // (compte, forum, recherche, etc.).
  var SHELL_HOST = 'capital-1.html';

  function esc(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }

  function el(html){
    var t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }

  function buildTopbar(){
    return el(
      '<header class="topbar"><div class="topbar-in">' +
        '<button id="sbToggle" class="sb-toggle" type="button" aria-label="Ouvrir le menu">☰</button>' +
        '<button class="brandmark" type="button" id="shellBrand" aria-label="Lire Marx — revenir à la bibliothèque">Lire<span class="d">.</span>Marx</button>' +
        '<div class="tb-search">' +
          '<span class="tb-search-ic" aria-hidden="true">⌕</span>' +
          '<input id="tbSearch" type="text" autocomplete="off" spellcheck="false" placeholder="Rechercher un concept, une date, un chapitre…" aria-label="Rechercher">' +
          '<div id="tbResults" class="tb-results" role="listbox" hidden></div>' +
        '</div>' +
        '<div class="topbar-right">' +
          '<button id="supportBtn" class="tb-btn tb-support" type="button" aria-label="Nous soutenir">' +
            '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 20.3l-1-1.4C5.9 14.3 3 11.7 3 8.4 3 5.9 4.9 4 7.4 4 9 4 10.4 4.8 11.2 6 12 4.8 13.4 4 15 4c2.5 0 4.4 1.9 4.4 4.4 0 3.3-2.9 5.9-8 10.5l-1 1.4z"/></svg>' +
            '<span class="tb-lbl">Nous soutenir</span>' +
          '</button>' +
          '<button id="msgBtn" class="tb-btn tb-icon tb-msg" type="button" aria-label="Messages">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h16v12H7l-3 3z"/></svg>' +
            '<span class="tb-dot" id="msgDot"></span>' +
          '</button>' +
          '<button id="notifBtn" class="tb-btn tb-icon tb-notif" type="button" aria-label="Notifications">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>' +
            '<span class="tb-dot" id="notifDot"></span>' +
          '</button>' +
          '<button id="acctChip" class="acct-chip" type="button" aria-haspopup="dialog">Se connecter</button>' +
        '</div>' +
      '</div></header>'
    );
  }

  function buildSidebar(cfg){
    var tabs = cfg.tabs || [];
    var workTitle = cfg.workTitle || '';
    var tabsHtml = tabs.map(function(t){
      return '<button class="sb-item" type="button" data-act="tab:' + esc(t.id) + '"><span class="sb-dot"></span>' + esc(t.label) + '</button>';
    }).join('');
    var sbWork = tabs.length
      ? '<div class="sb-work" id="sbWork"><div class="sb-h">' + esc(workTitle) + '</div>' + tabsHtml + '</div>'
      : '';
    return el(
      '<aside class="sidebar" id="sidebar" aria-label="Navigation de l\'atelier">' +
        '<button class="sb-item sb-disc" type="button" data-act="biblio" aria-expanded="false"><span class="sb-dot" style="background:var(--ink-soft)"></span>Bibliothèque<span class="sb-chev" aria-hidden="true">▸</span></button>' +
        '<div class="sb-sub" id="sbBiblio" hidden>' +
          '<button class="sb-item sb-subitem" type="button" data-act="open-capital"><span class="sb-dot" style="background:var(--gold)"></span>Le Capital — Livre I</button>' +
          '<button class="sb-item sb-subitem" type="button" data-act="open-manuscrits-1844"><span class="sb-dot" style="background:var(--gold)"></span>Manuscrits de 1844</button>' +
          '<button class="sb-item sb-soon sb-subitem" disabled><span class="sb-dot" style="background:var(--gold)"></span>6 en préparation<span class="sb-soon-tag">à venir</span></button>' +
        '</div>' +
        '<button class="sb-item" type="button" data-act="commune"><span class="sb-dot" style="background:var(--red)"></span>Place publique</button>' +
        '<button class="sb-item" type="button" data-act="contacts"><span class="sb-dot" style="background:var(--blue)"></span>Contacts</button>' +
        '<button class="sb-item sb-soon" type="button" disabled><span class="sb-dot" style="background:var(--gold)"></span>Jeux<span class="sb-soon-tag">à venir</span></button>' +
        '<button class="sb-item sb-soon" type="button" disabled><span class="sb-dot" style="background:var(--blue)"></span>À propos<span class="sb-soon-tag">à venir</span></button>' +
        '<button class="sb-item" type="button" data-act="cgu"><span class="sb-dot" style="background:var(--ink-soft)"></span>CGU &amp; règles</button>' +
        sbWork +
      '</aside>'
    );
  }

  function buildBackdrop(){
    return el('<div class="sb-backdrop" id="sbBackdrop"></div>');
  }

  function buildAcctModal(){
    return el(
      '<div id="acctModal" class="acct-modal" hidden>' +
        '<div class="acct-modal-box" role="dialog" aria-modal="true" aria-label="Mon compte">' +
          '<button class="acct-modal-x" type="button" aria-label="Fermer">&times;</button>' +
          '<div id="acctView"></div>' +
        '</div>' +
      '</div>'
    );
  }

  function buildPrivacyModal(){
    return el(
      '<div id="privacyModal" class="acct-modal" hidden>' +
        '<div class="acct-modal-box" role="dialog" aria-modal="true" aria-label="Confidentialité">' +
          '<button class="acct-modal-x" type="button" aria-label="Fermer">&times;</button>' +
          '<div class="ac-card privacy-text">' +
            '<h3>Confidentialité &amp; données</h3>' +
            '<p class="pz-warn">Modèle de départ, à relire et compléter ; ce n\'est pas un conseil juridique.</p>' +
            '<p>Pour la version complète de l\'avis et la fonction « Supprimer mes données », ouvre cette page depuis <a href="' + SHELL_HOST + '">l\'atelier du Capital</a>, où la coquille applicative est complète.</p>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  // Quelques boutons renvoient vers la page hôte tant que la coquille
  // applicative (auth, forum, recherche, etc.) n'y est pas factorisée.
  function gotoHost(hash){
    location.href = SHELL_HOST + (hash || '');
  }

  function wire(cfg){
    var sb = document.getElementById('sidebar');
    var bk = document.getElementById('sbBackdrop');
    var topbar = document.querySelector('header.topbar');

    // Ouverture/fermeture sidebar (mobile : toggle ; desktop : collapse)
    document.getElementById('sbToggle').addEventListener('click', function(){
      if(window.matchMedia('(max-width:860px)').matches){
        document.body.classList.toggle('sb-open');
      } else {
        document.body.classList.toggle('sb-collapsed');
      }
    });
    bk.addEventListener('click', function(){ document.body.classList.remove('sb-open'); });

    // Brandmark → page d'accueil (vue home dans capital-1.html aujourd'hui)
    document.getElementById('shellBrand').addEventListener('click', function(){ gotoHost(); });

    // Bibliothèque : ouvre / ferme le sous-menu
    var bib = sb.querySelector('[data-act="biblio"]');
    var bibSub = document.getElementById('sbBiblio');
    bib.addEventListener('click', function(){
      var open = bib.getAttribute('aria-expanded') === 'true';
      bib.setAttribute('aria-expanded', open ? 'false' : 'true');
      bibSub.hidden = open;
    });

    // Items de navigation inter-pages
    sb.querySelectorAll('.sb-item[data-act]').forEach(function(b){
      var act = b.dataset.act;
      if(act === 'biblio' || (act && act.indexOf('tab:') === 0)) return; // déjà gérés
      b.addEventListener('click', function(){
        if(act === 'open-capital'){ location.href = 'capital-1.html'; return; }
        if(act === 'open-manuscrits-1844'){ location.href = 'manuscrits-1844.html'; return; }
        if(act === 'commune' || act === 'contacts' || act === 'cgu'){
          gotoHost('#' + act);
          return;
        }
      });
    });

    // sb-work : aiguillage vers les onglets de l'œuvre courante
    sb.querySelectorAll('.sb-item[data-act^="tab:"]').forEach(function(b){
      b.addEventListener('click', function(){
        var id = b.dataset.act.slice(4);
        if(typeof window.activateTab === 'function'){
          window.activateTab(id);
          if(window.matchMedia('(max-width:860px)').matches){
            document.body.classList.remove('sb-open');
          }
        } else {
          gotoHost();
        }
      });
    });

    // Boutons qui dépendent encore de la coquille hébergée par capital-1.html
    var hostBtns = ['supportBtn','msgBtn','notifBtn','acctChip'];
    hostBtns.forEach(function(id){
      var b = document.getElementById(id);
      if(b) b.addEventListener('click', function(){ gotoHost(); });
    });

    // Recherche : pour l'instant, l'index vit dans capital-1.html.
    var search = document.getElementById('tbSearch');
    if(search){
      search.addEventListener('focus', function(){ gotoHost(); });
    }
  }

  window.installShell = function(cfg){
    cfg = cfg || {};
    var body = document.body;
    body.prepend(buildTopbar());
    var sidebar = buildSidebar(cfg);
    document.querySelector('header.topbar').after(sidebar);
    sidebar.after(buildBackdrop());
    body.appendChild(buildAcctModal());
    body.appendChild(buildPrivacyModal());
    wire(cfg);
  };
})();
