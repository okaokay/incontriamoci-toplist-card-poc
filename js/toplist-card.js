/* ============================================================================
   TOPLIST CARD — logica jQuery
   Riferimento Figma: node 409:4482 ("Toplist Item 1"). Card annuncio in
   evidenza a pagamento: badge di stato, carosello foto, titolo/descrizione,
   riga statistiche cliccabile (apre le modali di stat-detail-modal.js) e
   pulsanti Chiama/WhatsApp.

   File autonomo, dipende solo da jQuery + StatDetailModal (vedi
   stat-detail-modal.js, caricato prima di questo in index.html).
   ============================================================================ */

(function ($) {
  "use strict";

  /* --------------------------------------------------------------------
     0) ICONE (SVG inline, fill="currentColor")
     Stesso approccio già validato nello slider vetrine: le icone sono
     inline invece che <img src="..."> così ereditano il colore del testo
     circostante via CSS, senza bisogno di più varianti dello stesso file.
     Le icone dell'header/carosello (video, foto, stella TOPLIST, cuore
     preferiti) sono quelle del node Figma 409:4482; quelle della riga
     statistiche footer (Followers/Preferiti/Recensioni/Donazioni) sono
     quelle ESATTE del node 516:9277 mostrato dal cliente — vedi
     img/icons/*.svg per le fonti originali di entrambi i node, tenute
     anche come file per riferimento/riuso in altri contesti.
     -------------------------------------------------------------------- */
  var ICON_VIDEO =
    '<svg viewBox="0 0 13.3333 10.6667" width="13" height="11" fill="currentColor" aria-hidden="true">' +
    '<path d="M9.33333 2.66667L13.3333 0V10.6667L9.33333 8V2.66667V2.66667M0 9.33333V1.33333C0 0.966667 0.130556 0.652778 0.391667 0.391667C0.652778 0.130556 0.966667 0 1.33333 0H8C8.36667 0 8.68056 0.130556 8.94167 0.391667C9.20278 0.652778 9.33333 0.966667 9.33333 1.33333V9.33333C9.33333 9.7 9.20278 10.0139 8.94167 10.275C8.68056 10.5361 8.36667 10.6667 8 10.6667H1.33333C0.966667 10.6667 0.652778 10.5361 0.391667 10.275C0.130556 10.0139 0 9.7 0 9.33333V9.33333M1.33333 9.33333H8V9.33333V9.33333V1.33333V1.33333V1.33333H1.33333V1.33333V1.33333V9.33333V9.33333Z"/>' +
    "</svg>";
  var ICON_PHOTO =
    '<svg viewBox="0 0 13.3333 12" width="13" height="12" fill="currentColor" aria-hidden="true">' +
    '<path d="M1.33333 12C0.966667 12 0.652778 11.8694 0.391667 11.6083C0.130556 11.3472 0 11.0333 0 10.6667V1.33333C0 0.966667 0.130556 0.652778 0.391667 0.391667C0.652778 0.130556 0.966667 0 1.33333 0H12C12.3667 0 12.6806 0.130556 12.9417 0.391667C13.2028 0.652778 13.3333 0.966667 13.3333 1.33333V10.6667C13.3333 11.0333 13.2028 11.3472 12.9417 11.6083C12.6806 11.8694 12.3667 12 12 12H1.33333V12M1.33333 10.6667H12V10.6667V10.6667V1.33333V1.33333V1.33333H1.33333V1.33333V1.33333V10.6667V10.6667M2 9.33333H11.3333L8.66667 5.83333L6.66667 8.5L5.16667 6.5L2 9.33333Z"/>' +
    "</svg>";
  var ICON_STAR =
    '<svg viewBox="0 0 10 9.5" width="10" height="10" fill="currentColor" aria-hidden="true">' +
    '<path d="M5 0L6.53333 3.10833L10 3.63333L7.5 6.03333L8.08333 9.5L5 7.85833L1.91667 9.5L2.5 6.03333L0 3.63333L3.46667 3.10833L5 0Z"/>' +
    "</svg>";
  /* Cuoricino "preferiti": DUE varianti Font Awesome Free 6.7.2 ufficiali
     (non un'unica forma riusata con solo "fill" diverso, perché il
     contorno vuoto e quello pieno hanno path DIVERSI, non sono la stessa
     forma con outline vs riempimento) — vedi buildFavoriteIconHtml() più
     sotto per come vengono scambiate al click. */
  var ICON_HEART_OUTLINE = /* Font Awesome "heart" (regular) */
    '<svg viewBox="0 0 512 512" width="16" height="15" fill="currentColor" aria-hidden="true">' +
    '<path d="M225.8 468.2l-2.5-2.3L48.1 303.2C17.4 274.7 0 234.7 0 192.8l0-3.3c0-70.4 50-130.8 119.2-144C158.6 37.9 198.9 47 231 69.6c9 6.4 17.4 13.8 25 22.3c4.2-4.8 8.7-9.2 13.5-13.3c3.7-3.2 7.5-6.2 11.5-9c0 0 0 0 0 0C313.1 47 353.4 37.9 392.8 45.4C462 58.6 512 119.1 512 189.5l0 3.3c0 41.9-17.4 81.9-48.1 110.4L288.7 465.9l-2.5 2.3c-8.2 7.6-19 11.9-30.2 11.9s-22-4.2-30.2-11.9zM239.1 145c-.4-.3-.7-.7-1-1.1l-17.8-20-.1-.1s0 0 0 0c-23.1-25.9-58-37.7-92-31.2C81.6 101.5 48 142.1 48 189.5l0 3.3c0 28.5 11.9 55.8 32.8 75.2L256 430.7 431.2 268c20.9-19.4 32.8-46.7 32.8-75.2l0-3.3c0-47.3-33.6-88-80.1-96.9c-34-6.5-69 5.4-92 31.2c0 0 0 0-.1 .1s0 0-.1 .1l-17.8 20c-.3 .4-.7 .7-1 1.1c-4.5 4.5-10.6 7-16.9 7s-12.4-2.5-16.9-7z"/>' +
    "</svg>";
  var ICON_HEART_SOLID = /* Font Awesome "heart" (solid) */
    '<svg viewBox="0 0 512 512" width="16" height="15" fill="currentColor" aria-hidden="true">' +
    '<path d="M47.6 300.4L228.3 469.1c7.5 7 17.4 10.9 27.7 10.9s20.2-3.9 27.7-10.9L464.4 300.4c30.4-28.3 47.6-68 47.6-109.5v-5.8c0-69.9-50.5-129.5-119.4-141C347 36.5 300.6 51.4 268 84L256 96 244 84c-32.6-32.6-79-47.5-124.6-39.9C50.5 55.6 0 115.2 0 185.1v5.8c0 41.5 17.2 81.2 47.6 109.5z"/>' +
    "</svg>";
  var ICON_ARROW_LEFT =
    '<svg viewBox="0 0 320 512" width="10" height="14" fill="currentColor" aria-hidden="true">' +
    '<path d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l192 192c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L77.3 256 246.6 86.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-192 192z"/></svg>';
  var ICON_ARROW_RIGHT =
    '<svg viewBox="0 0 320 512" width="10" height="14" fill="currentColor" aria-hidden="true">' +
    '<path d="M310.6 233.4c12.5 12.5 12.5 32.8 0 45.3l-192 192c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L242.7 256 73.4 86.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l192 192z"/></svg>';
  /* Icone della riga statistiche footer: PATH ESATTI esportati dal node
     Figma 516:9277 (quello mostrato dal cliente, non un'approssimazione).
     "Reazioni" nel mockup non è un'icona SVG ma testo emoji ("🖤😐"), gestito
     a parte più sotto (vedi buildCardHtml). */
  var ICON_FOLLOWERS =
    '<svg viewBox="0 0 20.1666 12.8334" width="15" height="10" fill="currentColor" aria-hidden="true">' +
    '<path d="M13.75 5.49997C15.2716 5.49997 16.4908 4.27167 16.4908 2.75C16.4908 1.22834 15.2716 0 13.75 0C12.2283 0 11 1.22834 11 2.75C11 4.27167 12.2283 5.49997 13.75 5.49997ZM6.41666 5.49997C7.93833 5.49997 9.15753 4.27167 9.15753 2.75C9.15753 1.22834 7.93833 0 6.41666 0C4.895 0 3.66666 1.22834 3.66666 2.75C3.66666 4.27167 4.895 5.49997 6.41666 5.49997ZM6.41666 7.33337C4.28083 7.33337 0 8.40587 0 10.5417V12.8334H12.8333V10.5417C12.8333 8.40587 8.5525 7.33337 6.41666 7.33337ZM13.75 7.33337C13.4841 7.33337 13.1816 7.35167 12.8608 7.37917C13.9241 8.14917 14.6666 9.18497 14.6666 10.5417V12.8334H20.1666V10.5417C20.1666 8.40587 15.8858 7.33337 13.75 7.33337Z"/></svg>';
  var ICON_SAVED =
    '<svg viewBox="0 0 18.3334 16.8208" width="14" height="13" fill="currentColor" aria-hidden="true">' +
    '<path d="M9.16667 16.8208L7.8375 15.6108C3.11667 11.33 0 8.5067 0 5.04167C0 2.21833 2.21834 0 5.04167 0C6.63667 0 8.16747 0.7425 9.16667 1.91583C10.1659 0.7425 11.6967 0 13.2917 0C16.115 0 18.3334 2.21833 18.3334 5.04167C18.3334 8.5067 15.2167 11.33 10.4959 15.62L9.16667 16.8208Z"/></svg>';
  var ICON_REVIEWS_OUTLINE =
    '<svg viewBox="0 0 18.3334 17.435" width="14" height="14" fill="currentColor" aria-hidden="true">' +
    '<path d="M9.16667 0L11.9992 5.73834L18.3334 6.66417L13.75 11.1284L14.8317 17.435L9.16667 14.4559L3.50167 17.435L4.58334 11.1284L0 6.66417L6.33417 5.73834L9.16667 0Z"/></svg>';
  var ICON_DONATIONS =
    '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M7.33333 10H8.66667C9.02029 10 9.35943 9.85952 9.60948 9.60948C9.85952 9.35943 10 9.02029 10 8.66667C10 8.31304 9.85952 7.97391 9.60948 7.72386C9.35943 7.47381 9.02029 7.33333 8.66667 7.33333H6.66667C6.26667 7.33333 5.93333 7.46667 5.73333 7.73333L2 11.3333"/>' +
    '<path d="M4.66667 14L5.73333 13.0667C5.93333 12.8 6.26667 12.6667 6.66667 12.6667H9.33333C10.0667 12.6667 10.7333 12.4 11.2 11.8667L14.2667 8.93333C14.5239 8.69022 14.6741 8.35486 14.6841 8.00105C14.6941 7.64723 14.5631 7.30393 14.32 7.04667C14.0769 6.78941 13.7415 6.63926 13.3877 6.62926C13.0339 6.61926 12.6906 6.75022 12.4333 6.99333L9.63333 9.59333"/>' +
    '<path d="M1.33333 10.6667L5.33333 14.6667"/>' +
    '<path d="M10.6667 7.93333C11.7344 7.93333 12.6 7.06775 12.6 6C12.6 4.93225 11.7344 4.06667 10.6667 4.06667C9.59892 4.06667 8.73333 4.93225 8.73333 6C8.73333 7.06775 9.59892 7.93333 10.6667 7.93333Z"/>' +
    '<path d="M4 5.33333C5.10457 5.33333 6 4.4379 6 3.33333C6 2.22876 5.10457 1.33333 4 1.33333C2.89543 1.33333 2 2.22876 2 3.33333C2 4.4379 2.89543 5.33333 4 5.33333Z"/></svg>';
  var ICON_CALL =
    '<svg viewBox="0 0 15 15" width="15" height="15" fill="currentColor" aria-hidden="true">' +
    '<path d="M14.125 15C12.3889 15 10.6736 14.6215 8.97917 13.8646C7.28472 13.1076 5.74306 12.0347 4.35417 10.6458C2.96528 9.25694 1.89236 7.71528 1.13542 6.02083C0.378472 4.32639 0 2.61111 0 0.875C0 0.625 0.0833333 0.416667 0.25 0.25C0.416667 0.0833333 0.625 0 0.875 0H4.25C4.44444 0 4.61806 0.0659722 4.77083 0.197917C4.92361 0.329861 5.01389 0.486111 5.04167 0.666667L5.58333 3.58333C5.61111 3.80556 5.60417 3.99306 5.5625 4.14583C5.52083 4.29861 5.44444 4.43056 5.33333 4.54167L3.3125 6.58333C3.59028 7.09722 3.92014 7.59375 4.30208 8.07292C4.68403 8.55208 5.10417 9.01389 5.5625 9.45833C5.99306 9.88889 6.44444 10.2882 6.91667 10.6562C7.38889 11.0243 7.88889 11.3611 8.41667 11.6667L10.375 9.70833C10.5 9.58333 10.6632 9.48958 10.8646 9.42708C11.066 9.36458 11.2639 9.34722 11.4583 9.375L14.3333 9.95833C14.5278 10.0139 14.6875 10.1146 14.8125 10.2604C14.9375 10.4063 15 10.5694 15 10.75V14.125C15 14.375 14.9167 14.5833 14.75 14.75C14.5833 14.9167 14.375 15 14.125 15Z"/></svg>';
  /* Icona WhatsApp: logo ufficiale (path standard, licenza MIT via
     simple-icons), STESSA icona già usata per il pulsante WhatsApp dello
     slider vetrine — coerenza tra i componenti del sito. */
  var ICON_WHATSAPP =
    '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">' +
    '<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.888 11.888 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413"/>' +
    "</svg>";
  /* Reazioni: emoji, non SVG (esattamente come nel mockup Figma 516:9277) */
  var ICON_REACTIONS_EMOJI = "🖤😐";

  /* --------------------------------------------------------------------
     1) PALETTE COLORI BORDO (Figma doc, sezione 6.2.2)
     9 colori fissi tra cui l'inserzionista sceglie nel FUTURO pannello
     opzioni (fuori scope qui, vedi index.html e README). La card si
     limita a LEGGERE "colore_bordo" e applicare il colore corrispondente:
     qui viviamo solo la mappa chiave→hex, non l'interfaccia di scelta. */
  var BORDER_COLOR_PALETTE = {
    rosa: "#f9a8d4",
    magenta: "#d946ef",
    rosso: "#ef4444",
    arancione: "#f97316",
    giallo: "#eab308",
    verde: "#22c55e",
    blu: "#3b82f6",
    viola: "#8b5cf6",
    nero: "#111827"
  };

  /* --------------------------------------------------------------------
     2) BACKEND SIMULATO — DATI ANNUNCIO
     3 annunci finti con combinazioni diverse di flag, per mostrare al
     senior come cambia la card in base ai dati (bordo colorato sì/no,
     badge di stato diversi, ecc.) senza dover impostare nulla a mano.

     SCHEMA DATI — campi che la card legge (vedi README per il dettaglio
     completo pensato per l'integrazione Laravel):
       - Campi diretti annuncio: id, isNew, age, videoCount, photoCount,
         priceTier ("€"|"€€"|"€€€"), title, description, photos[] (qui solo
         un conteggio, in produzione sarà l'array di URL vero e proprio),
         stats { followers, reactions, saved, reviews, donations }
       - Flag dal FUTURO pannello opzioni "In risalto" (sola lettura qui,
         vedi punto 1 sopra e README): isToplist, isBordo + coloreBordo,
         isDisponibileSubito, isOnlineOra, isRispondoSubito
     -------------------------------------------------------------------- */
  var MOCK_LISTINGS = [
    {
      id: "listing-1",
      isNew: true,
      age: 24,
      videoCount: 1,
      photoCount: 12,
      priceTier: "€€€",
      photoTotal: 5,
      title: "Titolo annuncio di esempio",
      description: "Descrizione breve dell'annuncio, mostrata nella card TopList. In produzione arriva dal campo \"descrizione\" dell'annuncio salvato dall'inserzionista durante il flusso di pubblicazione.",
      stats: { followers: 0, reactions: 0, saved: 0, reviews: 10, donations: 0 },
      isToplist: true,
      isBordo: true,
      coloreBordo: "magenta",
      isDisponibileSubito: true,
      isOnlineOra: true,
      isRispondoSubito: true
    },
    {
      id: "listing-2",
      isNew: false,
      age: 29,
      videoCount: 0,
      photoCount: 8,
      priceTier: "€€",
      photoTotal: 3,
      title: "Secondo annuncio di esempio",
      description: "Un secondo annuncio, senza bordo colorato e con un solo badge di stato attivo, per mostrare come la card si adatta quando non tutti i flag sono attivi.",
      stats: { followers: 5, reactions: 12, saved: 3, reviews: 2, donations: 4 },
      isToplist: true,
      isBordo: false,
      coloreBordo: null,
      isDisponibileSubito: false,
      isOnlineOra: true,
      isRispondoSubito: false
    },
    {
      id: "listing-3",
      isNew: false,
      age: 31,
      videoCount: 2,
      photoCount: 20,
      priceTier: "€",
      photoTotal: 8,
      title: "Terzo annuncio, nessun badge attivo",
      description: "Terzo esempio: nessun toggle attivo nel pannello opzioni, quindi nessun badge di stato né bordo colorato — solo la card base con statistiche e pulsanti di contatto.",
      stats: { followers: 128, reactions: 47, saved: 19, reviews: 31, donations: 2 },
      isToplist: true,
      isBordo: false,
      coloreBordo: null,
      isDisponibileSubito: false,
      isOnlineOra: false,
      isRispondoSubito: false
    }
  ];

  /* --------------------------------------------------------------------
     3) HTML DEI BADGE DI STATO (header, in alto a destra)
     Estratta a parte perché, come per lo slider vetrine, questi stessi
     flag sono quelli che il FUTURO pannello opzioni permetterà di
     attivare/disattivare — se in futuro serve rigenerare solo i badge
     (es. aggiornamento realtime di "Online Ora"), questa funzione è già
     pronta per essere riusata così com'è. */
  function buildStatusBadgesHtml(listing) {
    var html = "";
    if (listing.isOnlineOra) {
      html += '<span class="toplist-badge toplist-badge--neutral">ONLINE ORA<span class="toplist-badge__dot"></span></span>';
    }
    if (listing.isDisponibileSubito) {
      /* Verde: colore confermato dalla documentazione (sezione 6.2.3), il
         mockup Figma statico mostra questo badge in grigio neutro come
         placeholder — qui usiamo il colore reale richiesto. */
      html += '<span class="toplist-badge toplist-badge--available">DISPONIBILE ORA</span>';
    }
    if (listing.isRispondoSubito) {
      /* Blu: stessa nota di cui sopra, colore da documentazione. */
      html += '<span class="toplist-badge toplist-badge--fast-reply">RISPONDO SUBITO</span>';
    }
    return html;
  }

  /* --------------------------------------------------------------------
     4) HTML DI UNA SINGOLA CARD
     -------------------------------------------------------------------- */
  function buildCardHtml(listing) {
    var newBadgeHtml = listing.isNew
      ? '<span class="toplist-card__new-badge">NEW</span>'
      : "";

    var borderStyle = "";
    if (listing.isBordo && listing.coloreBordo && BORDER_COLOR_PALETTE[listing.coloreBordo]) {
      /* Bordo colorato attorno all'intera card (docx 6.2.2): applicato
         come inline style perché il colore è dinamico (uno tra 9 valori
         possibili, scelto dall'inserzionista nel futuro pannello opzioni)
         — non ha senso creare 9 classi CSS diverse per questo. */
      borderStyle = ' style="border-color: ' + BORDER_COLOR_PALETTE[listing.coloreBordo] + '; border-width: 2px;"';
    }

    return (
      '<div class="toplist-card" data-listing-id="' + listing.id + '"' + borderStyle + '>' +

        /* ---- Header: badge NEW/età/video/foto/prezzo + badge di stato + TOPLIST/preferiti ---- */
        '<div class="toplist-card__header">' +
          '<div class="toplist-card__header-left">' +
            newBadgeHtml +
            '<span class="toplist-card__meta">Età: ' + listing.age + "</span>" +
            '<span class="toplist-card__meta toplist-card__meta--icon">' + ICON_VIDEO + "<span>" + listing.videoCount + "</span></span>" +
            '<span class="toplist-card__meta toplist-card__meta--icon">' + ICON_PHOTO + "<span>" + listing.photoCount + "</span></span>" +
            '<span class="toplist-card__price">' + listing.priceTier + "</span>" +
          "</div>" +
          '<div class="toplist-card__header-right">' +
            '<div class="toplist-card__status-badges">' + buildStatusBadgesHtml(listing) + "</div>" +
            '<div class="toplist-card__header-actions">' +
              (listing.isToplist
                ? '<span class="toplist-card__toplist-flag">' + ICON_STAR + "<span>TOPLIST</span></span>"
                : "") +
              /* Cuoricino preferiti: parte sempre vuoto/outline (non
                 leggiamo un flag "isFavorite" dai dati finti, perché è lo
                 stato di preferenza DELL'UTENTE che guarda la pagina in
                 quel momento, non un dato dell'annuncio — vedi
                 bindFavoriteEvents più sotto per la logica del toggle). */
              '<button type="button" class="toplist-card__favorite" aria-label="Aggiungi ai preferiti" aria-pressed="false">' + ICON_HEART_OUTLINE + "</button>" +
            "</div>" +
          "</div>" +
        "</div>" +

        /* ---- Media + corpo: foto con carosello a sinistra, titolo/descrizione a destra ---- */
        '<div class="toplist-card__content">' +
          '<div class="toplist-card__media">' +
            '<div class="toplist-card__photo-placeholder"></div>' +
            '<button type="button" class="toplist-card__carousel-arrow toplist-card__carousel-arrow--prev" aria-label="Foto precedente">' + ICON_ARROW_LEFT + "</button>" +
            '<button type="button" class="toplist-card__carousel-arrow toplist-card__carousel-arrow--next" aria-label="Foto successiva">' + ICON_ARROW_RIGHT + "</button>" +
            '<span class="toplist-card__photo-counter">1/' + listing.photoTotal + "</span>" +
          "</div>" +
          '<a href="#" class="toplist-card__body">' +
            '<h3 class="toplist-card__title">' + listing.title + "</h3>" +
            '<p class="toplist-card__description">' + listing.description + "</p>" +
          "</a>" +
        "</div>" +

        /* ---- Footer: 5 contatori cliccabili (aprono le modali) + pulsanti Chiama/WhatsApp ---- */
        '<div class="toplist-card__footer">' +
          '<div class="toplist-card__stats">' +
            /* Etichette in italiano, testo IDENTICO a quello del node Figma
               516:9277 (mostrato dal cliente): "Follower" non "Followers",
               ecc. — prima erano rimaste in inglese per errore quando erano
               state aggiornate solo le icone, non i testi. */
            '<button type="button" class="toplist-card__stat" data-stat-type="followers">' +
              '<span class="toplist-card__stat-value">' + ICON_FOLLOWERS + "<b>" + listing.stats.followers + "</b></span>" +
              '<span class="toplist-card__stat-label">Follower</span>' +
            "</button>" +
            '<button type="button" class="toplist-card__stat" data-stat-type="reactions">' +
              /* L'emoji è avvolta in un suo span di dimensione FISSA
                 (.toplist-card__stat-emoji-icon, vedi style.css): i font
                 emoji hanno una "altezza di riga" naturale più alta delle
                 icone SVG a parità di font-size, e senza questo wrapper la
                 riga "Reazioni" risultava più alta delle altre 4,
                 spingendo la sua etichetta più in basso e disallineandola
                 dal resto della riga statistiche. */
              '<span class="toplist-card__stat-value">' +
                '<span class="toplist-card__stat-emoji-icon">' + ICON_REACTIONS_EMOJI + "</span>" +
                "<b>" + listing.stats.reactions + "</b>" +
              "</span>" +
              '<span class="toplist-card__stat-label">Reazioni</span>' +
            "</button>" +
            '<button type="button" class="toplist-card__stat" data-stat-type="saved">' +
              '<span class="toplist-card__stat-value">' + ICON_SAVED + "<b>" + listing.stats.saved + "</b></span>" +
              '<span class="toplist-card__stat-label">Preferiti</span>' +
            "</button>" +
            '<button type="button" class="toplist-card__stat" data-stat-type="reviews">' +
              '<span class="toplist-card__stat-value">' + ICON_REVIEWS_OUTLINE + "<b>" + listing.stats.reviews + "</b></span>" +
              '<span class="toplist-card__stat-label">Recensioni</span>' +
            "</button>" +
            '<button type="button" class="toplist-card__stat" data-stat-type="donations">' +
              '<span class="toplist-card__stat-value">' + ICON_DONATIONS + "<b>" + listing.stats.donations + "</b></span>" +
              '<span class="toplist-card__stat-label">Donazioni</span>' +
            "</button>" +
          "</div>" +
          '<div class="toplist-card__contact-actions">' +
            '<button type="button" class="toplist-card__contact-button toplist-card__contact-button--call">' + ICON_CALL + "<span>Chiama</span></button>" +
            '<button type="button" class="toplist-card__contact-button toplist-card__contact-button--whatsapp">' + ICON_WHATSAPP + "<span>WhatsApp</span></button>" +
          "</div>" +
        "</div>" +

      "</div>"
    );
  }

  /* --------------------------------------------------------------------
     5) CAROSELLO FOTO
     Per questo POC il carosello cambia solo il NUMERO nel contatore
     ("1/5" -> "2/5" ecc.): non avendo foto reali, non c'è nulla da far
     scorrere visivamente (il placeholder resta lo stesso), ma la logica
     di avanzamento/indietro/clamp ai bordi è quella vera, pronta per
     quando ci saranno gli URL delle foto reali (vedi README).
     -------------------------------------------------------------------- */
  function bindCarouselEvents($list) {
    $list.on("click", ".toplist-card__carousel-arrow", function () {
      var $arrow = $(this);
      var $media = $arrow.closest(".toplist-card__media");
      var $counter = $media.find(".toplist-card__photo-counter");

      var parts = $counter.text().split("/");
      var current = parseInt(parts[0], 10);
      var total = parseInt(parts[1], 10);

      if ($arrow.hasClass("toplist-card__carousel-arrow--next")) {
        current = Math.min(total, current + 1);
      } else {
        current = Math.max(1, current - 1);
      }

      $counter.text(current + "/" + total);
    });
  }

  /* --------------------------------------------------------------------
     6) COLLEGAMENTO CONTATORI → MODALI
     Un solo listener delegato sul contenitore (invece di uno per bottone):
     funziona anche per le card aggiunte dopo il render iniziale, e sono
     5 x N_ANNUNCI bottoni in meno da agganciare uno per uno. Il tipo di
     modale da aprire è letto direttamente dall'attributo
     "data-stat-type" scritto in buildCardHtml (punto 4).

     IMPORTANTE per l'integrazione: passiamo anche il "listingId"
     dell'annuncio (letto da "data-listing-id" sulla card contenitore,
     vedi buildCardHtml) a StatDetailModal.open(). Senza, la modale non
     saprebbe DI QUALE annuncio mostrare Follower/Reazioni/ecc. — è
     esattamente il pezzo che serve al senior per collegare i dati reali,
     vedi stat-detail-modal.js e il README ("Come i dati arrivano a ogni
     modale") per il contratto completo. */
  function bindStatEvents($list) {
    $list.on("click", ".toplist-card__stat", function () {
      var type = $(this).data("stat-type");
      var listingId = $(this).closest(".toplist-card").data("listing-id");
      window.StatDetailModal.open(type, listingId);
    });
  }

  /* --------------------------------------------------------------------
     6bis) TOGGLE CUORICINO PREFERITI
     Vuoto (outline) di default, pieno rosa (#FFADE2) quando selezionato:
     un semplice click che alterna icona + classe "is-active" (il colore
     rosa lo applica il CSS in base a quella classe, qui scambiamo solo
     l'SVG outline<->solid e l'attributo aria-pressed per l'accessibilità).

     NOTA: questo è uno stato SOLO visivo/locale al browser (non persiste
     al reload, non chiama nessun endpoint) — la vera persistenza del
     "preferito" (salvare la scelta per l'utente loggato) è lato Laravel,
     fuori scope per questo POC. Vedi README per la nota di integrazione. */
  function bindFavoriteEvents($list) {
    $list.on("click", ".toplist-card__favorite", function () {
      var $button = $(this);
      var isActive = $button.hasClass("is-active");

      $button.toggleClass("is-active", !isActive);
      $button.attr("aria-pressed", String(!isActive));
      $button.html(isActive ? ICON_HEART_OUTLINE : ICON_HEART_SOLID);
    });
  }

  /* --------------------------------------------------------------------
     7) INIZIALIZZAZIONE
     -------------------------------------------------------------------- */
  $(function () {
    var $list = $("#toplistList");

    var htmlParts = [];
    $.each(MOCK_LISTINGS, function (index, listing) {
      htmlParts.push(buildCardHtml(listing));
    });
    $list.html(htmlParts.join(""));

    bindCarouselEvents($list);
    bindFavoriteEvents($list);
    bindStatEvents($list);
  });

})(jQuery);
