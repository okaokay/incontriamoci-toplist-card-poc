/* ============================================================================
   STAT DETAIL MODAL — componente UNICO condiviso dalle 5 modali di dettaglio
   (Follower, Reazioni, Preferiti, Recensioni, Donazioni — Figma node 409:4523
   per il punto di aggancio, e 479:13268/13332/13408/13460/13528 per le 5
   modali). Sono identiche nella struttura (header, chip "utenti anonimi",
   elenco righe, footer "Chiudi"): invece di scrivere 5 file quasi identici,
   un solo componente riceve un "tipo" e si comporta di conseguenza — così
   se domani cambia lo stile della modale, lo si cambia in UN posto solo.

   Questo file è completamente autonomo: non sa nulla della card TopList,
   riceve solo "apri la modale di tipo X" e se ne occupa lui. Può quindi
   essere riusato ovunque nel sito serva questo tipo di lista (non solo
   dalla card TopList).
   ============================================================================ */

(function ($) {
  "use strict";

  /* --------------------------------------------------------------------
     -1) UTENTE LOGGATO — convenzione di integrazione (richiesta del senior)
     Le modali sono ora DINAMICHE: cliccando un'icona reazione, o una delle
     CTA nel footer (Segui, Aggiungi ai preferiti, Scrivi una recensione,
     Fai una donazione), l'azione va eseguita SOLO se l'utente è loggato —
     altrimenti va reindirizzato al login (https://incontriamoci.xxx/user/login).

     Questo file NON PUÒ sapere da solo se l'utente è loggato (è js
     lato client, senza sessione): la pagina Blade che lo include deve
     valorizzare "window.IncontriamociUser" PRIMA che questo script giri,
     tipicamente con un blocco tipo:

         <script>
           window.IncontriamociUser = {
             isLoggedIn: @json(auth()->check()),
             id: @json(auth()->id()),
             name: @json(auth()->user()->name ?? null)
           };
         </script>

     messo PRIMA di <script src=".../stat-detail-modal.js">. Se questo
     oggetto manca del tutto (es. pagina di test, o script caricato fuori
     contesto), il default qui sotto è "non loggato" — comportamento
     sicuro (mai eseguire un'azione a nome di nessuno per errore). */
  var LOGIN_URL = "https://incontriamoci.xxx/user/login";

  function isUserLoggedIn() {
    return !!(window.IncontriamociUser && window.IncontriamociUser.isLoggedIn);
  }

  function getCurrentUserName() {
    return (window.IncontriamociUser && window.IncontriamociUser.name) || "Tu";
  }

  /* Punto di ingresso comune per OGNI azione delle modali (reazione,
     segui, preferiti, recensione, donazione): se l'utente non è loggato,
     lo manda al login e blocca l'azione (ritorna false) — il chiamante
     deve fermarsi subito dopo, non eseguire comunque l'azione. */
  function requireLoginOrRedirect() {
    if (isUserLoggedIn()) {
      return true;
    }
    window.location.href = LOGIN_URL;
    return false;
  }

  function pad2(n) {
    return (n < 10 ? "0" : "") + n;
  }

  /* --------------------------------------------------------------------
     0) BACKEND SIMULATO — CON PAGINAZIONE
     In produzione ognuna di queste liste arriverà da un endpoint dedicato
     (o da un unico endpoint parametrico — da concordare col senior, vedi
     README), con la stessa forma {totalItems, anonymousCount, items} già
     usata qui.

     Su richiesta del cliente le righe NON si caricano più tutte insieme
     al primo apertura della modale (scelta precedente, ribaltata da
     questa): ora c'è un vero infinite scroll paginato, vedi
     "fetchStatRowsPage()"/"calculateTotalPages()" e "PAGINAZIONE E
     INFINITE SCROLL" più sotto. Per poterlo testare davvero (con solo
     3-5 righe non si vede nulla scrollare) i dati finti qui sotto sono
     generati in quantità realistica da "generateMockRows()", non scritti
     a mano uno per uno come nella versione precedente — le prime righe
     di ogni tipo restano ESATTAMENTE quelle del mockup Figma (stessi
     nomi/città/valori), le successive sono sintetiche ma con lo stesso
     formato, per riempire più pagine in modo credibile. */
  var MOCK_FIRST_NAMES = ["Chiara", "Davide", "Federica", "Paolo", "Irene", "Valentina", "Gianluca", "Elena", "Matteo", "Anna", "Carlo", "Stefania", "Marco", "Sofia", "Luca", "Nadia", "Andrea", "Giulia", "Roberto", "Tommaso", "Francesca", "Simone", "Alessia", "Fabio", "Martina", "Riccardo", "Giorgia", "Giorgio", "Laura", "Michele"];
  var MOCK_CITIES = ["Firenze", "Torino", "Venezia", "Bari", "Palermo", "Roma", "Napoli", "Milano", "Bologna", "Genova", "Catania", "Pescara", "Verona", "Padova", "Bergamo", "Trieste", "Cagliari", "Perugia", "Modena", "Parma"];

  /* Genera "count" righe finte con nome/città che ciclano sugli array
     sopra e una data che retrocede di qualche giorno a riga (sempre nel
     formato "gg/mm/aaaa" usato in tutto il componente). "rowBuilder"
     riceve (name, city, date, index) e decide il resto dei campi
     (value/rating/text), diverso per ogni tipo di modale. */
  function generateMockRows(count, rowBuilder) {
    var rows = [];
    var baseDate = new Date(2025, 2, 20); // 20/03/2025, stessa data più recente del mockup originale
    for (var i = 0; i < count; i++) {
      var name = MOCK_FIRST_NAMES[i % MOCK_FIRST_NAMES.length];
      var city = MOCK_CITIES[i % MOCK_CITIES.length];
      var d = new Date(baseDate.getTime() - i * 3 * 24 * 60 * 60 * 1000);
      var date = pad2(d.getDate()) + "/" + pad2(d.getMonth() + 1) + "/" + d.getFullYear();
      rows.push(rowBuilder(name, city, date, i));
    }
    return rows;
  }

  var REACTION_VALUES_CYCLE = ["🖤", "😍", "🔥", "😐"];
  var REVIEW_TEXTS_CYCLE = [
    "Esperienza fantastica, molto professionale!",
    "Molto gentile e disponibile, assolutamente consigliata.",
    "Ottima esperienza, tornerò sicuramente.",
    "Una persona meravigliosa, super raccomandata!",
    "Puntuale e cortese, tutto perfetto."
  ];
  var DONATION_AMOUNTS_CYCLE = ["10", "20", "30", "50", "100"];

  var MOCK_STAT_ROWS = {
    reactions: {
      anonymousCount: 1,
      rows: generateMockRows(38, function (name, city, date, i) {
        return { name: name, city: city, value: REACTION_VALUES_CYCLE[i % REACTION_VALUES_CYCLE.length], date: date };
      })
    },
    followers: {
      anonymousCount: 2,
      rows: generateMockRows(42, function (name, city, date) {
        return { name: name, city: city, date: date };
      })
    },
    saved: {
      anonymousCount: 1,
      rows: generateMockRows(24, function (name, city, date) {
        return { name: name, city: city, date: date };
      })
    },
    reviews: {
      anonymousCount: 2,
      rows: generateMockRows(22, function (name, city, date, i) {
        return { name: name, city: city, rating: 4 + (i % 2), text: REVIEW_TEXTS_CYCLE[i % REVIEW_TEXTS_CYCLE.length], date: date };
      })
    },
    donations: {
      anonymousCount: 0, /* le donazioni non supportano l'anonimato in questo mockup (vedi docx, sezione 7.1.5) */
      rows: generateMockRows(30, function (name, city, date, i) {
        return { name: name, city: city, value: DONATION_AMOUNTS_CYCLE[i % DONATION_AMOUNTS_CYCLE.length], date: date };
      })
    }
  };

  /* Endpoint proposti per LEGGERE le righe di ogni modale (GET) — da
     confermare col senior, vedi README "Come i dati arrivano a ogni
     modale". Un endpoint dedicato per tipo invece di uno parametrico:
     più semplice da cachare/autorizzare lato Laravel per tipo di dato. */
  var STAT_FETCH_ENDPOINTS = {
    followers: "/api/annunci/:id/followers",
    reactions: "/api/annunci/:id/reazioni",
    saved:     "/api/annunci/:id/preferiti",
    reviews:   "/api/annunci/:id/recensioni",
    donations: "/api/annunci/:id/donazioni"
  };

  /* --------------------------------------------------------------------
     PAGINAZIONE E INFINITE SCROLL (richiesta del cliente)
     Prima le righe di ogni modale si caricavano tutte insieme alla prima
     apertura (scelta esplicita precedente, ribaltata da questa nuova
     richiesta): ora la modale carica solo la PRIMA pagina, poi ne
     carica altre via infinite scroll man mano che l'utente arriva in
     fondo alla lista — stesso identico pattern "batch loading" già
     usato in vetrineSlider (loadNextBatch/ensureLoaded), qui applicato
     alle righe delle modali invece che alle card.

     "fetchStatRowsPage(type, listingId, offset, limit)" restituisce
     {totalItems, anonymousCount, items} — "totalItems" e "limit"
     (= itemsPerPage) sono gli unici due numeri che servono a
     "calculateTotalPages()" per sapere quante pagine ci sono in totale,
     nessun altro calcolo manuale nel resto del file. In produzione:

         function fetchStatRowsPage(type, listingId, offset, limit) {
           return $.get(STAT_FETCH_ENDPOINTS[type].replace(":id", listingId), {
             offset: offset,
             limit: limit
           });
         }

     stessa identica interfaccia, solo con una vera chiamata AJAX al
     posto della tabella in memoria — vedi README per il contratto
     completo della risposta attesa. */
  function fetchStatRowsPage(type, listingId, offset, limit) {
    var data = MOCK_STAT_ROWS[type];
    if (!data) {
      return { totalItems: 0, anonymousCount: 0, items: [] };
    }
    return {
      totalItems: data.rows.length,
      anonymousCount: data.anonymousCount,
      items: data.rows.slice(offset, offset + limit)
    };
  }

  /* Calcola quante pagine servono per mostrare "totalItems" righe,
     "itemsPerPage" alla volta — usata da openModal per sapere quando
     l'infinite scroll ha raggiunto l'ultima pagina e deve fermarsi
     (currentPage >= totalPages, vedi loadNextPageIfNearBottom dentro
     openModal). */
  function calculateTotalPages(totalItems, itemsPerPage) {
    return Math.ceil(totalItems / itemsPerPage);
  }

  /* Endpoint proposti per le AZIONI (POST) che le CTA di ogni modale
     eseguono — vedi punto 1bis più sotto per il dettaglio di quale CTA
     appartiene a quale tipo. "reactions" ha un payload aggiuntivo (quale
     reazione), le altre no (sono un semplice toggle on/off). */
  var STAT_ACTION_ENDPOINTS = {
    followers: "/api/annunci/:id/follow",
    reactions: "/api/annunci/:id/reazioni",
    saved:     "/api/annunci/:id/preferiti",
    reviews:   "/api/annunci/:id/recensioni",
    donations: "/api/annunci/:id/donazioni"
  };

  /* Esegue l'azione di una CTA (segui/preferiti/reazione/recensione/
     donazione). Predisposta per la vera chiamata POST, oggi finta
     (nessuna vera richiesta di rete, questo è un POC offline):

         function postStatAction(type, listingId, payload) {
           return $.ajax({
             method: "POST",
             url: STAT_ACTION_ENDPOINTS[type].replace(":id", listingId),
             data: payload
           });
         }

     "$.when()" nel chiamante (vedi bindActionEvents) rende il resto del
     codice compatibile SIA con questo valore finto sincrono SIA con una
     vera Promise/jqXHR, senza nessuna modifica — stesso pattern già
     usato in vetrineSlider/toplistCard per lo stesso motivo. */
  function postStatAction(type, listingId, payload) {
    return { ok: true };
  }

  /* --------------------------------------------------------------------
     1) CONFIGURAZIONE PER TIPO DI MODALE
     Tutto ciò che cambia tra le 5 modali è qui, in un unico posto: icona
     (emoji, esattamente come nel mockup Figma — non servono asset SVG),
     titolo, se mostrare il chip "Utenti anonimi" e come renderizzare la
     singola riga ("rowType"). Il resto (colori, layout, header, footer)
     è IDENTICO per tutte e vive nel CSS (vedi style.css, sezione modale).

     "action" descrive la CTA dinamica di quel tipo (punto 1bis più sotto
     per l'implementazione): "reaction" non ha CTA propria nel footer,
     usa le icone del picker già esistenti; le altre 4 hanno un pulsante
     dedicato nel footer, con etichetta "on"/"off" per i toggle (Segui/
     Preferiti) o un'unica etichetta per le azioni "singole" (Recensione/
     Donazione, che non si "disattivano"). */
  var MODAL_TYPES = {
    followers: { icon: "👤", title: "FOLLOWER",    hasAnonymousChip: true,  rowType: "simple", showReactionPicker: false,
      action: { type: "toggle", labelOn: "Segui", labelOff: "Segui già" } },  /* 👤 */
    reactions: { icon: "🖤", title: "REAZIONI",    hasAnonymousChip: true,  rowType: "value",  showReactionPicker: true,
      action: { type: "reaction" } },  /* 🖤 */
    saved:     { icon: "❤️", title: "PREFERITI",   hasAnonymousChip: true,  rowType: "simple", showReactionPicker: false,
      action: { type: "toggle", labelOn: "Aggiungi ai preferiti", labelOff: "Nei preferiti" } },  /* ❤️ */
    reviews:   { icon: "⭐",       title: "RECENSIONI",  hasAnonymousChip: true,  rowType: "review", showReactionPicker: false,
      action: { type: "review", labelOn: "Scrivi una recensione" } },  /* ⭐ */
    donations: { icon: "💰", title: "DONAZIONI",   hasAnonymousChip: false, rowType: "value",  showReactionPicker: false,
      action: { type: "donation", labelOn: "Fai una donazione" } }   /* 💰 */
  };

  /* --------------------------------------------------------------------
     1bis) REAZIONI DISPONIBILI (icone Font Awesome Free 6.7.2 ufficiali)
     Mostrate SOLO nella modale Reazioni, accanto al chip "Utenti anonimi":
     rappresentano le reazioni che un utente può lasciare (le stesse 4 che
     compaiono già come "valore" nelle righe della lista, vedi
     MOCK_STAT_ROWS.reactions più sopra — 🖤/😍/🔥/😐). Su richiesta
     esplicita del cliente, SOLO icone Font Awesome qui: niente emoji.
     -------------------------------------------------------------------- */
  var REACTION_PICKER_ICONS = [
    { /* corrisponde a 🖤 nelle righe della lista */
      type: "cuore_nero",
      label: "Cuore nero",
      emoji: "🖤",
      svg: '<svg viewBox="0 0 512 512" width="14" height="13" fill="currentColor" aria-hidden="true"><path d="M47.6 300.4L228.3 469.1c7.5 7 17.4 10.9 27.7 10.9s20.2-3.9 27.7-10.9L464.4 300.4c30.4-28.3 47.6-68 47.6-109.5v-5.8c0-69.9-50.5-129.5-119.4-141C347 36.5 300.6 51.4 268 84L256 96 244 84c-32.6-32.6-79-47.5-124.6-39.9C50.5 55.6 0 115.2 0 185.1v5.8c0 41.5 17.2 81.2 47.6 109.5z"/></svg>'
    },
    { /* corrisponde a 😍 nelle righe della lista (Font Awesome "face-grin-hearts") */
      type: "innamorato",
      label: "Innamorato",
      emoji: "😍",
      svg: '<svg viewBox="0 0 512 512" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM388.1 312.8c12.3-3.8 24.3 6.9 19.3 18.7C382.4 390.6 324.2 432 256.3 432s-126.2-41.4-151.1-100.5c-5-11.8 7-22.5 19.3-18.7c39.7 12.2 84.5 19 131.8 19s92.1-6.8 131.8-19zM199.3 129.1c17.8 4.8 28.4 23.1 23.6 40.8l-17.4 65c-2.3 8.5-11.1 13.6-19.6 11.3l-65.1-17.4c-17.8-4.8-28.4-23.1-23.6-40.8s23.1-28.4 40.8-23.6l16.1 4.3 4.3-16.1c4.8-17.8 23.1-28.4 40.8-23.6zm154.3 23.6l4.3 16.1 16.1-4.3c17.8-4.8 36.1 5.8 40.8 23.6s-5.8 36.1-23.6 40.8l-65.1 17.4c-8.5 2.3-17.3-2.8-19.6-11.3l-17.4-65c-4.8-17.8 5.8-36.1 23.6-40.8s36.1 5.8 40.9 23.6z"/></svg>'
    },
    { /* corrisponde a 🔥 nelle righe della lista (Font Awesome "fire") */
      type: "fuoco",
      label: "Fuoco",
      emoji: "🔥",
      svg: '<svg viewBox="0 0 448 512" width="12" height="14" fill="currentColor" aria-hidden="true"><path d="M159.3 5.4c7.8-7.3 19.9-7.2 27.7 .1c27.6 25.9 53.5 53.8 77.7 84c11-14.4 23.5-30.1 37-42.9c7.9-7.4 20.1-7.4 28 .1c34.6 33 63.9 76.6 84.5 118c20.3 40.8 33.8 82.5 33.8 111.9C448 404.2 348.2 512 224 512C98.4 512 0 404.1 0 276.5c0-38.4 17.8-85.3 45.4-131.7C73.3 97.7 112.7 48.6 159.3 5.4zM225.7 416c25.3 0 47.7-7 68.8-21c42.1-29.4 53.4-88.2 28.1-134.4c-4.5-9-16-9.6-22.5-2l-25.2 29.3c-6.6 7.6-18.5 7.4-24.7-.5c-16.5-21-46-58.5-62.8-79.8c-6.3-8-18.3-8.1-24.7-.1c-33.8 42.5-50.8 69.3-50.8 99.4C112 375.4 162.6 416 225.7 416z"/></svg>'
    },
    { /* corrisponde a 😐 nelle righe della lista (Font Awesome "face-meh") */
      type: "indifferente",
      label: "Indifferente",
      emoji: "😐",
      svg: '<svg viewBox="0 0 512 512" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M464 256A208 208 0 1 1 48 256a208 208 0 1 1 416 0zM256 0a256 256 0 1 0 0 512A256 256 0 1 0 256 0zM176.4 240a32 32 0 1 0 0-64 32 32 0 1 0 0 64zm192-32a32 32 0 1 0 -64 0 32 32 0 1 0 64 0zM184 328c-13.3 0-24 10.7-24 24s10.7 24 24 24l144 0c13.3 0 24-10.7 24-24s-10.7-24-24-24l-144 0z"/></svg>'
    }
  ];

  /* Le icone sono ora CLICCABILI (prima erano solo informative, "cursor:
     default" in CSS): al click aggiungono una reazione, vedi bindActionEvents
     più sotto. "data-reaction-type" fa da chiave per ritrovare l'emoji/label
     giusti al click, senza dover ripetere la ricerca nell'array ogni volta. */
  function buildReactionPickerHtml() {
    var html = '<div class="stat-modal__reaction-picker" aria-label="Reazioni disponibili">';
    $.each(REACTION_PICKER_ICONS, function (index, reaction) {
      html += '<button type="button" class="stat-modal__reaction-picker-icon" data-reaction-type="' + reaction.type + '" title="' + reaction.label + '">' + reaction.svg + "</button>";
    });
    html += "</div>";
    return html;
  }

  /* --------------------------------------------------------------------
     2) TEMPLATE DELLA SINGOLA RIGA
     Tre varianti, scelte dal "rowType" della configurazione (punto 1):
     - "simple": avatar + nome (città) + data soltanto (Follower, Preferiti)
     - "value":  come sopra ma con una colonna valore a destra prima della
                 data (emoji per Reazioni, importo "€" per Donazioni)
     - "review": layout diverso (riga più alta): nome (città) + data sulla
                 stessa riga in alto, poi stelle, poi testo recensione
     -------------------------------------------------------------------- */
  function buildRowHtml(row, rowType) {
    /* Iniziale per l'avatar: sempre la prima lettera del nome, maiuscola.
       Dato "fidato" (nomi finti definiti da noi, punto 0): in produzione,
       se il nome arriva da input utente reale, andrà sanificato prima di
       finire in HTML (evitare XSS), qui non serve. */
    var avatarLetter = row.name.charAt(0).toUpperCase();
    var avatarHtml = '<div class="stat-modal__avatar">' + avatarLetter + "</div>";

    /* Le righe aggiunte DINAMICAMENTE dalle CTA (vedi bindActionEvents)
       hanno "row.isOwn = true" e nessuna città (l'utente loggato non ha
       una città nel contesto dell'azione) — qui gestiamo la parentesi
       "(città)" come opzionale invece di darla per scontata, e aggiungiamo
       una classe modificatore per evidenziare visivamente la propria riga
       appena aggiunta. */
    var cityHtml = row.city ? " (" + row.city + ")" : "";
    var ownClass = row.isOwn ? " stat-modal__row--own" : "";

    if (rowType === "review") {
      /* Le stelle sono generate come sequenza di ★ piene + ☆ vuote in base
         a "rating" (1-5): niente icone SVG, sono caratteri di testo, più
         semplice e leggero per un elemento puramente decorativo. */
      var starsHtml = "";
      for (var i = 1; i <= 5; i++) {
        starsHtml += i <= row.rating ? "★" : "☆"; /* ★ : ☆ */
      }
      return (
        '<div class="stat-modal__row stat-modal__row--review' + ownClass + '">' +
          avatarHtml +
          '<div class="stat-modal__row-body">' +
            '<div class="stat-modal__row-top">' +
              '<span class="stat-modal__name">' + row.name + cityHtml + "</span>" +
              '<span class="stat-modal__date">' + row.date + "</span>" +
            "</div>" +
            '<div class="stat-modal__stars">' + starsHtml + "</div>" +
            '<p class="stat-modal__review-text">' + row.text + "</p>" +
          "</div>" +
        "</div>"
      );
    }

    /* "simple" e "value" condividono la stessa struttura base: cambia solo
       se compare la colonna valore in mezzo (Reazioni/Donazioni) o no
       (Follower/Preferiti). */
    var valueHtml = "";
    if (rowType === "value") {
      /* Donazioni mostra un numero (senza simbolo "€", su richiesta
         esplicita — solo la cifra), Reazioni un'emoji: li distinguiamo
         controllando se il valore è composto solo da cifre. */
      var isAmount = /^\d+$/.test(row.value);
      valueHtml = '<span class="stat-modal__value' + (isAmount ? " stat-modal__value--amount" : "") + '">' +
        row.value +
        "</span>";
    }

    return (
      '<div class="stat-modal__row' + ownClass + '">' +
        avatarHtml +
        '<div class="stat-modal__row-info">' +
          '<div class="stat-modal__name">' + row.name + "</div>" +
          (row.city ? '<div class="stat-modal__city">(' + row.city + ")</div>" : "") +
        "</div>" +
        valueHtml +
        '<span class="stat-modal__date">' + row.date + "</span>" +
      "</div>"
    );
  }

  /* Data odierna nello stesso formato "gg/mm/aaaa" dei dati finti (punto
     0, "pad2" già definito lì), per le righe aggiunte dalle azioni
     dell'utente. */
  function formatTodayDate() {
    var d = new Date();
    return pad2(d.getDate()) + "/" + pad2(d.getMonth() + 1) + "/" + d.getFullYear();
  }

  function findReactionByType(reactionType) {
    for (var i = 0; i < REACTION_PICKER_ICONS.length; i++) {
      if (REACTION_PICKER_ICONS[i].type === reactionType) {
        return REACTION_PICKER_ICONS[i];
      }
    }
    return null;
  }

  /* --------------------------------------------------------------------
     2bis) AZIONI DINAMICHE DELLE MODALI (richiesta del senior)
     Ogni modale ha una CTA che dipende dal suo "tipo" (vedi MODAL_TYPES,
     punto 1): Reazioni usa le icone del picker già in alto, le altre 4
     un pulsante nel footer. TUTTE le azioni passano prima da
     "requireLoginOrRedirect()" (punto -1): se l'utente non è loggato,
     la funzione lo manda al login e l'azione si ferma lì — nessuna
     modifica visiva, nessuna chiamata a "postStatAction".

     Se loggato, il pattern è sempre lo stesso:
     1. "$.when(postStatAction(...))" — oggi risolve subito (POC offline),
        in produzione sarà una vera POST, il resto del codice non cambia
        (stesso pattern già usato in vetrineSlider/toplistCard).
     2. In caso di successo, la riga con "isOwn:true" viene aggiunta in
        cima alla lista SUBITO (aggiornamento ottimistico): l'utente vede
        il risultato senza dover ricaricare la modale. In produzione, se
        la POST fallisce, andrà gestito anche il caso ".fail()" (qui
        omesso: senza una vera rete non può mai fallire).

     "$(document).trigger('incontriamoci:statAction', ...)" avvisa il
     resto della pagina che è successo qualcosa (es. per aggiornare in
     futuro anche il contatore mostrato sulla card TopList, fuori da
     questa modale) — nessun listener collegato ancora in questo POC, è
     un aggancio pronto per quando servirà. */
  function bindActionEvents($overlay, type, listingId, config) {
    function notifyActionDone(payload) {
      $(document).trigger("incontriamoci:statAction", [$.extend({ type: type, listingId: listingId }, payload)]);
    }

    /* --- Reazioni: click su un'icona del picker in alto --- */
    $overlay.on("click", ".stat-modal__reaction-picker-icon", function () {
      if (!requireLoginOrRedirect()) {
        return;
      }
      var $icon = $(this);
      var reaction = findReactionByType($icon.data("reaction-type"));
      if (!reaction) {
        return;
      }

      $.when(postStatAction("reactions", listingId, { tipo: reaction.type })).done(function () {
        var newRow = { name: getCurrentUserName(), city: "", value: reaction.emoji, date: formatTodayDate(), isOwn: true };
        $overlay.find(".stat-modal__rows").prepend(buildRowHtml(newRow, "value"));
        $overlay.find(".stat-modal__reaction-picker-icon").removeClass("is-selected");
        $icon.addClass("is-selected");
        notifyActionDone({ reactionType: reaction.type });
      });
    });

    /* --- Segui / Preferiti: toggle on-off --- */
    $overlay.on("click", '.stat-modal__action-button[data-action="toggle"]', function () {
      if (!requireLoginOrRedirect()) {
        return;
      }
      var $button = $(this);
      var nextActive = !$button.hasClass("is-active");

      $.when(postStatAction(type, listingId, { attivo: nextActive })).done(function () {
        $button.toggleClass("is-active", nextActive);
        $button.text(nextActive ? config.action.labelOff : config.action.labelOn);

        if (nextActive) {
          var newRow = { name: getCurrentUserName(), city: "", date: formatTodayDate(), isOwn: true };
          $overlay.find(".stat-modal__rows").prepend(buildRowHtml(newRow, config.rowType));
        } else {
          /* Toglie la PROPRIA riga aggiunta in precedenza (non una a
             caso): è sempre la prima con la classe "--own", perché viene
             sempre inserita in cima. */
          $overlay.find(".stat-modal__row--own").first().remove();
        }
        notifyActionDone({ active: nextActive });
      });
    });

    /* --- Recensioni: la CTA apre un mini-form (stelle + testo) invece di
       eseguire subito l'azione, serve raccogliere voto e testo prima di
       poter chiamare l'endpoint. --- */
    $overlay.on("click", '.stat-modal__action-button[data-action="review"]', function () {
      if (!requireLoginOrRedirect()) {
        return;
      }
      $overlay.find(".stat-modal__review-form").removeAttr("hidden");
      $(this).hide();
    });

    $overlay.on("click", ".stat-modal__review-form-star", function () {
      var rating = $(this).data("star");
      $overlay.find(".stat-modal__review-form-stars").attr("data-rating", rating);
      $overlay.find(".stat-modal__review-form-star").each(function (index) {
        $(this).text(index + 1 <= rating ? "★" : "☆"); /* ★ : ☆ */
      });
    });

    $overlay.on("click", ".stat-modal__review-form-cancel", function () {
      $overlay.find(".stat-modal__review-form").attr("hidden", true);
      $overlay.find('.stat-modal__action-button[data-action="review"]').show();
    });

    $overlay.on("click", ".stat-modal__review-form-submit", function () {
      var rating = parseInt($overlay.find(".stat-modal__review-form-stars").attr("data-rating"), 10) || 0;
      var text = $.trim($overlay.find(".stat-modal__review-form-text").val());

      /* Validazione minima lato client (voto scelto + testo non vuoto):
         quella "vera" resta comunque lato server in produzione. */
      if (!rating || !text) {
        return;
      }

      $.when(postStatAction("reviews", listingId, { valutazione: rating, testo: text })).done(function () {
        var newRow = { name: getCurrentUserName(), city: "", rating: rating, text: text, date: formatTodayDate(), isOwn: true };
        $overlay.find(".stat-modal__rows").prepend(buildRowHtml(newRow, "review"));
        $overlay.find(".stat-modal__review-form").attr("hidden", true);
        $overlay.find(".stat-modal__review-form-text").val("");
        /* Un utente scrive una sola recensione per annuncio: la CTA non
           torna visibile dopo l'invio (coerente con la maggior parte dei
           siti di recensioni). */
        notifyActionDone({ rating: rating });
      });
    });

    /* --- Donazioni: l'importo oggi è un semplice prompt() del browser —
       QUESTO È UN PLACEHOLDER, non un vero flusso di pagamento (fuori
       scope per un componente di sola UI): in produzione la CTA aprirà
       un vero flusso (Stripe/PayPal/ecc.), il pattern $.when()/
       postStatAction però resta lo stesso. */
    $overlay.on("click", '.stat-modal__action-button[data-action="donation"]', function () {
      if (!requireLoginOrRedirect()) {
        return;
      }
      var amountRaw = window.prompt("Quanto vuoi donare? (solo numero, €)");
      var amount = parseInt(amountRaw, 10);
      if (!amount || amount <= 0) {
        return;
      }

      $.when(postStatAction("donations", listingId, { importo: amount })).done(function () {
        var newRow = { name: getCurrentUserName(), city: "", value: String(amount), date: formatTodayDate(), isOwn: true };
        $overlay.find(".stat-modal__rows").prepend(buildRowHtml(newRow, "value"));
        notifyActionDone({ amount: amount });
      });
    });
  }

  /* --------------------------------------------------------------------
     3) APERTURA MODALE
     Punto di ingresso pubblico: qualunque altro script (oggi solo
     toplist-card.js, in futuro magari anche un'altra pagina) chiama
     StatDetailModal.open("reactions", "listing-1") e la modale compare in
     overlay con i dati DI QUELL'ANNUNCIO. "listingId" è facoltativo solo
     per comodità di test manuale in console — nell'uso reale dalla card
     (toplist-card.js) viene sempre passato.
     -------------------------------------------------------------------- */
  /* Quante righe per pagina: usata sia per la prima pagina (caricata
     all'apertura) sia per ogni pagina successiva caricata dall'infinite
     scroll. Valore ragionevole per una lista di sole righe di testo
     dentro un overlay (più piccolo delle 10 card dello slider vetrine,
     che occupano molto più spazio a schermo ciascuna). */
  var ITEMS_PER_PAGE = 15;

  /* Quanti px mancano al fondo dello scroll prima di anticipare il
     caricamento della pagina successiva — così la nuova pagina è già
     pronta quando l'utente arriva davvero in fondo, invece di fargli
     vedere lo spinner e aspettare. */
  var SCROLL_LOAD_THRESHOLD_PX = 80;

  function openModal(type, listingId) {
    var config = MODAL_TYPES[type];
    if (!config) {
      return; /* tipo sconosciuto: nessuna modale da aprire (difesa, non dovrebbe mai succedere) */
    }

    /* Solo la PRIMA pagina viene caricata all'apertura (vedi
       "PAGINAZIONE E INFINITE SCROLL" più sopra) — le successive
       arrivano scrollando, vedi il binding "scroll" più sotto.
       "totalPages" (da "calculateTotalPages") è il criterio di stop
       dell'infinite scroll: quando "currentPage" lo raggiunge, non c'è
       più nulla da caricare. */
    var firstPage = fetchStatRowsPage(type, listingId, 0, ITEMS_PER_PAGE);
    var totalItems = firstPage.totalItems;
    var totalPages = calculateTotalPages(totalItems, ITEMS_PER_PAGE);
    var currentPage = totalItems > 0 ? 1 : 0; // pagina 1 (0-based: la prima) già caricata sopra
    var isLoadingNextPage = false;

    var chipHtml = "";
    if (config.hasAnonymousChip || config.showReactionPicker) {
      chipHtml =
        '<div class="stat-modal__anonymous-bar">' +
          (config.hasAnonymousChip
            ? '<span class="stat-modal__anonymous-chip">Utenti anonimi ' + firstPage.anonymousCount + " " + config.icon + "</span>"
            : "<span></span>" /* placeholder vuoto: mantiene il picker allineato a destra anche senza chip */) +
          (config.showReactionPicker ? buildReactionPickerHtml() : "") +
        "</div>";
    }

    var rowsHtml = "";
    $.each(firstPage.items, function (index, row) {
      rowsHtml += buildRowHtml(row, config.rowType);
    });

    /* CTA dinamica nel footer, in base a "config.action.type" (punto 1
       più sopra): "reaction" non ha CTA propria qui (usa le icone del
       picker già nel chip in alto), le altre 4 hanno un pulsante. Il
       click è gestito da bindActionEvents più sotto, con lo stesso
       controllo login di tutte le altre azioni. */
    var actionButtonHtml = "";
    if (config.action.type !== "reaction") {
      actionButtonHtml = '<button type="button" class="stat-modal__action-button" data-action="' + config.action.type + '">' + config.action.labelOn + "</button>";
    }

    /* Form inline per la recensione (stelle + testo): nascosto finché non
       si clicca la CTA "Scrivi una recensione", vedi bindActionEvents. Le
       stelle sono pulsanti (non l'emoji ★/☆ statica delle righe, qui
       devono essere cliccabili per scegliere il voto). */
    var reviewFormHtml = "";
    if (config.action.type === "review") {
      var starButtonsHtml = "";
      for (var starIndex = 1; starIndex <= 5; starIndex++) {
        starButtonsHtml += '<button type="button" class="stat-modal__review-form-star" data-star="' + starIndex + '" aria-label="' + starIndex + ' stelle">☆</button>';
      }
      reviewFormHtml =
        '<div class="stat-modal__review-form" hidden>' +
          '<div class="stat-modal__review-form-stars" data-rating="0">' + starButtonsHtml + "</div>" +
          '<textarea class="stat-modal__review-form-text" rows="3" maxlength="300" placeholder="Scrivi la tua recensione..."></textarea>' +
          '<div class="stat-modal__review-form-actions">' +
            '<button type="button" class="stat-modal__review-form-cancel">Annulla</button>' +
            '<button type="button" class="stat-modal__review-form-submit">Invia recensione</button>' +
          "</div>" +
        "</div>";
    }

    var modalHtml =
      '<div class="stat-modal__overlay" id="statDetailModalOverlay">' +
        '<div class="stat-modal" role="dialog" aria-modal="true" aria-label="' + config.title + '">' +
          '<div class="stat-modal__header">' +
            '<div class="stat-modal__header-title">' +
              '<span class="stat-modal__header-icon">' + config.icon + "</span>" +
              "<span>" + config.title + "</span>" +
            "</div>" +
            '<button type="button" class="stat-modal__close-icon" aria-label="Chiudi">✕</button>' +
          "</div>" +
          chipHtml +
          reviewFormHtml +
          '<div class="stat-modal__rows">' +
            rowsHtml +
            /* Indicatore "Caricamento…" SEMPRE presente come ultimo
               figlio di ".stat-modal__rows" (nascosto di default): le
               pagine successive si inseriscono sempre appena PRIMA di
               questo elemento (vedi ".before()" più sotto), così resta
               sempre l'ultima cosa visibile mentre carica. */
            '<div class="stat-modal__loading-more" hidden>Caricamento…</div>' +
          "</div>" +
          '<div class="stat-modal__footer">' +
            actionButtonHtml +
            '<button type="button" class="stat-modal__close-button">✕ Chiudi</button>' +
          "</div>" +
        "</div>" +
      "</div>";

    /* Il contenitore della modale viene creato QUI se non esiste già,
       invece di richiederlo scritto a mano nell'HTML di ogni pagina
       (com'era prima: <div id="statDetailModalRoot"></div> in index.html).
       Motivo: se in futuro più componenti che usano questo stesso file
       (card TopList, e potenzialmente altri) finiscono sulla STESSA
       pagina reale, avere l'id scritto in ciascun template Blade avrebbe
       prodotto id duplicati nell'HTML finale — non valido, e con
       comportamento imprevedibile su quale dei due nodi jQuery
       effettivamente aggiorna. Creandolo da JS al primo utilizzo (e
       riusando lo stesso se già presente) il problema sparisce: questo
       file diventa autosufficiente, non richiede più nessun markup
       preesistente nella pagina che lo include. */
    var $root = $("#statDetailModalRoot");
    if (!$root.length) {
      $root = $('<div id="statDetailModalRoot"></div>').appendTo("body");
    }
    $root.html(modalHtml);

    /* Blocchiamo lo scroll della pagina sotto mentre la modale è aperta
       (pattern standard per gli overlay): lo ripristiniamo alla chiusura. */
    $("body").css("overflow", "hidden");

    var $overlay = $("#statDetailModalOverlay");

    /* Chiusura: tre modi, tutti equivalenti (stessa funzione closeModal) —
       il pulsante "✕" in alto, il pulsante "✕ Chiudi" in basso, e il click
       sull'overlay scuro FUORI dal riquadro bianco della modale. */
    function closeModal() {
      $root.empty();
      $("body").css("overflow", "");
      $(document).off("keydown.statDetailModal");
    }

    $overlay.on("click", function (jqEvent) {
      /* Chiudiamo solo se il click è avvenuto esattamente sull'overlay
         (lo sfondo), non su un suo discendente (la modale stessa) — senza
         questo controllo, cliccare DENTRO la modale chiuderebbe comunque
         tutto, perché il click "risale" (bubbling) fino all'overlay. */
      if (jqEvent.target === this) {
        closeModal();
      }
    });
    $overlay.find(".stat-modal__close-icon, .stat-modal__close-button").on("click", closeModal);

    bindActionEvents($overlay, type, listingId, config);

    /* --------------------------------------------------------------------
       INFINITE SCROLL — carica la pagina successiva quando l'utente si
       avvicina al fondo della lista (già scrollabile via CSS,
       "overflow-y:auto" su ".stat-modal__rows"). Stesso pattern
       "$.when()" usato ovunque nel progetto: oggi "fetchStatRowsPage"
       risolve subito (dati in memoria), in produzione la stessa riga
       funzionerà senza modifiche con una vera Promise/jqXHR asincrona.
       -------------------------------------------------------------------- */
    var $rowsContainer = $overlay.find(".stat-modal__rows");
    var $loadingIndicator = $overlay.find(".stat-modal__loading-more");

    function loadNextPageIfNearBottom() {
      if (isLoadingNextPage || currentPage >= totalPages) {
        return; // sta già caricando, oppure non c'è più nulla da caricare (ultima pagina raggiunta)
      }
      var el = $rowsContainer[0];
      var distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      if (distanceFromBottom > SCROLL_LOAD_THRESHOLD_PX) {
        return; // ancora lontano dal fondo, niente da fare
      }

      isLoadingNextPage = true;
      $loadingIndicator.removeAttr("hidden");

      var nextOffset = currentPage * ITEMS_PER_PAGE;
      $.when(fetchStatRowsPage(type, listingId, nextOffset, ITEMS_PER_PAGE)).done(function (page) {
        var pageHtml = "";
        $.each(page.items, function (index, row) {
          pageHtml += buildRowHtml(row, config.rowType);
        });
        $loadingIndicator.before(pageHtml);

        currentPage += 1;
        isLoadingNextPage = false;
        $loadingIndicator.attr("hidden", true);
      });
    }

    $rowsContainer.on("scroll", loadNextPageIfNearBottom);

    /* Chiusura anche con il tasto ESC, comportamento atteso per qualunque
       modale. Namespace ".statDetailModal" sull'evento così possiamo
       rimuovere SOLO questo handler alla chiusura (closeModal sopra),
       senza toccare altri eventuali handler "keydown" della pagina. */
    $(document).on("keydown.statDetailModal", function (jqEvent) {
      if (jqEvent.key === "Escape") {
        closeModal();
      }
    });
  }

  /* Esponiamo un solo oggetto globale con un solo metodo pubblico: API
     minima e chiara per chi deve integrare (oggi toplist-card.js, domani
     magari un'altra pagina del sito che ha bisogno delle stesse modali). */
  window.StatDetailModal = {
    open: openModal
  };

})(jQuery);
