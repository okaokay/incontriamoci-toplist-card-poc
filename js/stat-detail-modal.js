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
    followers: { icon: "👤", title: "FOLLOWER",    hasAnonymousChip: true,  rowType: "simple" },  /* 👤 */
    reactions: { icon: "🖤", title: "REAZIONI",    hasAnonymousChip: true,  rowType: "value"  },  /* 🖤 */
    saved:     { icon: "❤️", title: "PREFERITI",   hasAnonymousChip: true,  rowType: "simple" },  /* ❤️ */
    reviews:   { icon: "⭐",       title: "RECENSIONI",  hasAnonymousChip: true,  rowType: "review" },  /* ⭐ */
    donations: { icon: "💰", title: "DONAZIONI",   hasAnonymousChip: false, rowType: "value"  }   /* 💰 */
  };

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
    if (config.hasAnonymousChip) {
      chipHtml =
        '<div class="stat-modal__anonymous-bar">' +
          '<span class="stat-modal__anonymous-chip">Utenti anonimi ' + data.anonymousCount + " " + config.icon + "</span>" +
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
