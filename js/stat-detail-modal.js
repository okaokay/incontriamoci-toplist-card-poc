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
     0) BACKEND SIMULATO
     In produzione ognuna di queste liste arriverà da un endpoint dedicato
     (o da un unico endpoint parametrico, es. GET /api/annunci/:id/stats/
     :tipo — da concordare col senior, vedi README). Qui i dati sono quelli
     ESATTI mostrati nel mockup Figma (stessi nomi/città/date), non dati
     inventati a caso: così il confronto visivo con Figma resta affidabile.

     A differenza dello slider vetrine, qui NON serve caricamento a batch:
     l'utente apre la modale volontariamente (non è uno scroll passivo), e
     su richiesta esplicita del cliente le righe vengono caricate tutte in
     un colpo solo. Se in futuro alcuni annunci avessero centinaia di
     interazioni, si potrà aggiungere paginazione qui dentro senza
     toccare la card (è un componente separato) — per ora la funzione
     fetchStatRows() è già isolata apposta, pronta a diventare paginata
     senza cambiare la sua firma esterna.
     -------------------------------------------------------------------- */
  var MOCK_STAT_ROWS = {
    reactions: {
      anonymousCount: 1,
      rows: [
        { name: "Chiara",   city: "Firenze", value: "🖤", date: "19/03/2025" }, /* 🖤 */
        { name: "Davide",   city: "Torino",  value: "😍", date: "14/03/2025" }, /* 😍 */
        { name: "Federica", city: "Venezia", value: "🔥", date: "09/03/2025" }, /* 🔥 */
        { name: "Paolo",    city: "Bari",    value: "🖤", date: "04/03/2025" }, /* 🖤 */
        { name: "Irene",    city: "Palermo", value: "😐", date: "25/02/2025" }  /* 😐 */
      ]
    },
    followers: {
      anonymousCount: 2,
      rows: [
        { name: "Valentina", city: "Roma",    date: "18/03/2025" },
        { name: "Gianluca",  city: "Napoli",  date: "10/03/2025" },
        { name: "Elena",     city: "Milano",  date: "02/03/2025" },
        { name: "Matteo",    city: "Bologna", date: "22/02/2025" }
      ]
    },
    saved: {
      anonymousCount: 1,
      rows: [
        { name: "Anna",      city: "Genova",  date: "17/03/2025" },
        { name: "Carlo",     city: "Roma",    date: "11/03/2025" },
        { name: "Stefania",  city: "Catania", date: "05/03/2025" }
      ]
    },
    reviews: {
      anonymousCount: 2,
      rows: [
        { name: "Marco", city: "Pescara", rating: 5, text: "Esperienza fantastica, molto professionale!", date: "12/03/2025" },
        { name: "Sofia", city: "Roma",    rating: 5, text: "Molto gentile e disponibile, assolutamente consigliata.", date: "08/02/2025" },
        { name: "Luca",  city: "Milano",  rating: 4, text: "Ottima esperienza, tornerò sicuramente.", date: "15/01/2025" },
        { name: "Nadia", city: "Verona",  rating: 5, text: "Una persona meravigliosa, super raccomandata!", date: "03/01/2025" }
      ]
    },
    donations: {
      anonymousCount: 0, /* le donazioni non supportano l'anonimato in questo mockup (vedi docx, sezione 7.1.5) */
      rows: [
        { name: "Andrea",  city: "Torino",  value: "50",  date: "20/03/2025" },
        { name: "Giulia",  city: "Napoli",  value: "30",  date: "05/02/2025" },
        { name: "Roberto", city: "Firenze", value: "20",  date: "28/01/2025" },
        { name: "Tommaso", city: "Roma",    value: "100", date: "14/01/2025" }
      ]
    }
  };

  /* Simula la chiamata di rete: sincrona qui (nessun setTimeout), stessa
     scelta già fatta per lo slider vetrine — vedi il commento sopra per
     come diventerà una vera chiamata AJAX in produzione. */
  function fetchStatRows(type) {
    return MOCK_STAT_ROWS[type] || { anonymousCount: 0, rows: [] };
  }

  /* --------------------------------------------------------------------
     1) CONFIGURAZIONE PER TIPO DI MODALE
     Tutto ciò che cambia tra le 5 modali è qui, in un unico posto: icona
     (emoji, esattamente come nel mockup Figma — non servono asset SVG),
     titolo, se mostrare il chip "Utenti anonimi" e come renderizzare la
     singola riga ("rowType"). Il resto (colori, layout, header, footer)
     è IDENTICO per tutte e vive nel CSS (vedi style.css, sezione modale).
     -------------------------------------------------------------------- */
  var MODAL_TYPES = {
    followers: { icon: "👤", title: "FOLLOWER",    hasAnonymousChip: true,  rowType: "simple", showReactionPicker: false },  /* 👤 */
    reactions: { icon: "🖤", title: "REAZIONI",    hasAnonymousChip: true,  rowType: "value",  showReactionPicker: true  },  /* 🖤 */
    saved:     { icon: "❤️", title: "PREFERITI",   hasAnonymousChip: true,  rowType: "simple", showReactionPicker: false },  /* ❤️ */
    reviews:   { icon: "⭐",       title: "RECENSIONI",  hasAnonymousChip: true,  rowType: "review", showReactionPicker: false },  /* ⭐ */
    donations: { icon: "💰", title: "DONAZIONI",   hasAnonymousChip: false, rowType: "value",  showReactionPicker: false }   /* 💰 */
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
      label: "Cuore nero",
      svg: '<svg viewBox="0 0 512 512" width="14" height="13" fill="currentColor" aria-hidden="true"><path d="M47.6 300.4L228.3 469.1c7.5 7 17.4 10.9 27.7 10.9s20.2-3.9 27.7-10.9L464.4 300.4c30.4-28.3 47.6-68 47.6-109.5v-5.8c0-69.9-50.5-129.5-119.4-141C347 36.5 300.6 51.4 268 84L256 96 244 84c-32.6-32.6-79-47.5-124.6-39.9C50.5 55.6 0 115.2 0 185.1v5.8c0 41.5 17.2 81.2 47.6 109.5z"/></svg>'
    },
    { /* corrisponde a 😍 nelle righe della lista (Font Awesome "face-grin-hearts") */
      label: "Innamorato",
      svg: '<svg viewBox="0 0 512 512" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM388.1 312.8c12.3-3.8 24.3 6.9 19.3 18.7C382.4 390.6 324.2 432 256.3 432s-126.2-41.4-151.1-100.5c-5-11.8 7-22.5 19.3-18.7c39.7 12.2 84.5 19 131.8 19s92.1-6.8 131.8-19zM199.3 129.1c17.8 4.8 28.4 23.1 23.6 40.8l-17.4 65c-2.3 8.5-11.1 13.6-19.6 11.3l-65.1-17.4c-17.8-4.8-28.4-23.1-23.6-40.8s23.1-28.4 40.8-23.6l16.1 4.3 4.3-16.1c4.8-17.8 23.1-28.4 40.8-23.6zm154.3 23.6l4.3 16.1 16.1-4.3c17.8-4.8 36.1 5.8 40.8 23.6s-5.8 36.1-23.6 40.8l-65.1 17.4c-8.5 2.3-17.3-2.8-19.6-11.3l-17.4-65c-4.8-17.8 5.8-36.1 23.6-40.8s36.1 5.8 40.9 23.6z"/></svg>'
    },
    { /* corrisponde a 🔥 nelle righe della lista (Font Awesome "fire") */
      label: "Fuoco",
      svg: '<svg viewBox="0 0 448 512" width="12" height="14" fill="currentColor" aria-hidden="true"><path d="M159.3 5.4c7.8-7.3 19.9-7.2 27.7 .1c27.6 25.9 53.5 53.8 77.7 84c11-14.4 23.5-30.1 37-42.9c7.9-7.4 20.1-7.4 28 .1c34.6 33 63.9 76.6 84.5 118c20.3 40.8 33.8 82.5 33.8 111.9C448 404.2 348.2 512 224 512C98.4 512 0 404.1 0 276.5c0-38.4 17.8-85.3 45.4-131.7C73.3 97.7 112.7 48.6 159.3 5.4zM225.7 416c25.3 0 47.7-7 68.8-21c42.1-29.4 53.4-88.2 28.1-134.4c-4.5-9-16-9.6-22.5-2l-25.2 29.3c-6.6 7.6-18.5 7.4-24.7-.5c-16.5-21-46-58.5-62.8-79.8c-6.3-8-18.3-8.1-24.7-.1c-33.8 42.5-50.8 69.3-50.8 99.4C112 375.4 162.6 416 225.7 416z"/></svg>'
    },
    { /* corrisponde a 😐 nelle righe della lista (Font Awesome "face-meh") */
      label: "Indifferente",
      svg: '<svg viewBox="0 0 512 512" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M464 256A208 208 0 1 1 48 256a208 208 0 1 1 416 0zM256 0a256 256 0 1 0 0 512A256 256 0 1 0 256 0zM176.4 240a32 32 0 1 0 0-64 32 32 0 1 0 0 64zm192-32a32 32 0 1 0 -64 0 32 32 0 1 0 64 0zM184 328c-13.3 0-24 10.7-24 24s10.7 24 24 24l144 0c13.3 0 24-10.7 24-24s-10.7-24-24-24l-144 0z"/></svg>'
    }
  ];

  function buildReactionPickerHtml() {
    var html = '<div class="stat-modal__reaction-picker" aria-label="Reazioni disponibili">';
    $.each(REACTION_PICKER_ICONS, function (index, reaction) {
      html += '<span class="stat-modal__reaction-picker-icon" title="' + reaction.label + '">' + reaction.svg + "</span>";
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

    if (rowType === "review") {
      /* Le stelle sono generate come sequenza di ★ piene + ☆ vuote in base
         a "rating" (1-5): niente icone SVG, sono caratteri di testo, più
         semplice e leggero per un elemento puramente decorativo. */
      var starsHtml = "";
      for (var i = 1; i <= 5; i++) {
        starsHtml += i <= row.rating ? "★" : "☆"; /* ★ : ☆ */
      }
      return (
        '<div class="stat-modal__row stat-modal__row--review">' +
          avatarHtml +
          '<div class="stat-modal__row-body">' +
            '<div class="stat-modal__row-top">' +
              '<span class="stat-modal__name">' + row.name + " (" + row.city + ")</span>" +
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
      /* Donazioni mostra un importo in euro, Reazioni un'emoji: li
         distinguiamo controllando se il valore è composto solo da cifre. */
      var isAmount = /^\d+$/.test(row.value);
      valueHtml = '<span class="stat-modal__value' + (isAmount ? " stat-modal__value--amount" : "") + '">' +
        (isAmount ? row.value + "€" : row.value) +
        "</span>";
    }

    return (
      '<div class="stat-modal__row">' +
        avatarHtml +
        '<div class="stat-modal__row-info">' +
          '<div class="stat-modal__name">' + row.name + "</div>" +
          '<div class="stat-modal__city">(' + row.city + ")</div>" +
        "</div>" +
        valueHtml +
        '<span class="stat-modal__date">' + row.date + "</span>" +
      "</div>"
    );
  }

  /* --------------------------------------------------------------------
     3) APERTURA MODALE
     Punto di ingresso pubblico: qualunque altro script (oggi solo
     toplist-card.js, in futuro magari anche un'altra pagina) chiama
     StatDetailModal.open("reactions") e la modale compare in overlay.
     -------------------------------------------------------------------- */
  function openModal(type) {
    var config = MODAL_TYPES[type];
    if (!config) {
      return; /* tipo sconosciuto: nessuna modale da aprire (difesa, non dovrebbe mai succedere) */
    }

    var data = fetchStatRows(type);

    var chipHtml = "";
    if (config.hasAnonymousChip || config.showReactionPicker) {
      chipHtml =
        '<div class="stat-modal__anonymous-bar">' +
          (config.hasAnonymousChip
            ? '<span class="stat-modal__anonymous-chip">Utenti anonimi ' + data.anonymousCount + " " + config.icon + "</span>"
            : "<span></span>" /* placeholder vuoto: mantiene il picker allineato a destra anche senza chip */) +
          (config.showReactionPicker ? buildReactionPickerHtml() : "") +
        "</div>";
    }

    var rowsHtml = "";
    $.each(data.rows, function (index, row) {
      rowsHtml += buildRowHtml(row, config.rowType);
    });

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
          '<div class="stat-modal__rows">' + rowsHtml + "</div>" +
          '<div class="stat-modal__footer">' +
            '<button type="button" class="stat-modal__close-button">✕ Chiudi</button>' +
          "</div>" +
        "</div>" +
      "</div>";

    var $root = $("#statDetailModalRoot");
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
