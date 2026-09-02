/* ============================================================================
   TOPLIST CARD — logica jQuery
   Riferimento Figma: node 409:4482 ("Toplist Item 1"). Card annuncio in
   evidenza a pagamento: badge di stato, carosello foto, titolo/descrizione,
   riga statistiche cliccabile (apre le modali di stat-detail-modal.js) e
   pulsanti Chiama/Messaggio.

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
     I path sono quelli esportati dal node Figma 409:4482 (vedi
     img/icons/*.svg per le fonti originali, tenute anche come file per
     riferimento/riuso in altri contesti).
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
  var ICON_HEART =
    '<svg viewBox="0 0 16.6667 15.2917" width="16" height="15" fill="currentColor" aria-hidden="true">' +
    '<path d="M8.33333 15.2917L7.125 14.2083C5.72222 12.9444 4.5625 11.8542 3.64583 10.9375C2.72917 10.0208 2 9.19792 1.45833 8.46875C0.916667 7.73958 0.538194 7.06944 0.322917 6.45833C0.107639 5.84722 0 5.22222 0 4.58333C0 3.27778 0.4375 2.1875 1.3125 1.3125C2.1875 0.4375 3.27778 0 4.58333 0C5.30556 0 5.99306 0.152778 6.64583 0.458333C7.29861 0.763889 7.86111 1.19444 8.33333 1.75C8.80556 1.19444 9.36806 0.763889 10.0208 0.458333C10.6736 0.152778 11.3611 0 12.0833 0C13.3889 0 14.4792 0.4375 15.3542 1.3125C16.2292 2.1875 16.6667 3.27778 16.6667 4.58333C16.6667 5.22222 16.559 5.84722 16.3438 6.45833C16.1285 7.06944 15.75 7.73958 15.2083 8.46875C14.6667 9.19792 13.9375 10.0208 13.0208 10.9375C12.1042 11.8542 10.9444 12.9444 9.54167 14.2083L8.33333 15.2917Z"/>' +
    "</svg>";
  var ICON_ARROW_LEFT =
    '<svg viewBox="0 0 320 512" width="10" height="14" fill="currentColor" aria-hidden="true">' +
    '<path d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l192 192c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L77.3 256 246.6 86.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-192 192z"/></svg>';
  var ICON_ARROW_RIGHT =
    '<svg viewBox="0 0 320 512" width="10" height="14" fill="currentColor" aria-hidden="true">' +
    '<path d="M310.6 233.4c12.5 12.5 12.5 32.8 0 45.3l-192 192c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L242.7 256 73.4 86.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l192 192z"/></svg>';
  var ICON_FOLLOWERS =
    '<svg viewBox="0 0 14.6667 10.6667" width="15" height="11" fill="currentColor" aria-hidden="true">' +
    '<path d="M10 5.33333C10.7333 5.33333 11.3611 5.07222 11.8833 4.55C12.4056 4.02778 12.6667 3.4 12.6667 2.66667C12.6667 1.93333 12.4056 1.30556 11.8833 0.783333C11.3611 0.261111 10.7333 0 10 0C9.26667 0 8.63889 0.261111 8.11667 0.783333C7.59444 1.30556 7.33333 1.93333 7.33333 2.66667C7.33333 3.4 7.59444 4.02778 8.11667 4.55C8.63889 5.07222 9.26667 5.33333 10 5.33333V5.33333M4.66667 5.33333C5.31111 5.33333 5.86111 5.10556 6.31667 4.65C6.77222 4.19444 7 3.64444 7 3C7 2.35556 6.77222 1.80556 6.31667 1.35C5.86111 0.894444 5.31111 0.666667 4.66667 0.666667C4.02222 0.666667 3.47222 0.894444 3.01667 1.35C2.56111 1.80556 2.33333 2.35556 2.33333 3C2.33333 3.64444 2.56111 4.19444 3.01667 4.65C3.47222 5.10556 4.02222 5.33333 4.66667 5.33333V5.33333M10 6.66667C9.44444 6.66667 8.85278 6.72778 8.225 6.85C7.59722 6.97222 6.98889 7.14444 6.4 7.36667C6.63333 7.6 6.81944 7.85 6.95833 8.125C7.09722 8.4 7.16667 8.7 7.16667 9V10.6667H14.6667V9C14.6667 8.06667 14.1806 7.30556 13.2083 6.71667C12.2361 6.12778 11.0889 5.83333 9.76667 5.83333C9.79444 5.98889 9.81944 6.14444 9.84167 6.3C9.86389 6.45556 9.87778 6.6 9.88333 6.73333C9.92222 6.71111 9.96111 6.69444 10 6.68333V6.66667Z"/></svg>';
  var ICON_REACTIONS =
    '<svg viewBox="0 0 13.3333 12.2333" width="13" height="12" fill="currentColor" aria-hidden="true">' +
    '<path d="M6.66667 12.2333L5.86667 11.5C5.03333 10.7444 4.34722 10.0972 3.80833 9.55833C3.26944 9.01944 2.83889 8.53611 2.51667 8.10833C2.19444 7.68056 1.96667 7.28333 1.83333 6.91667C1.7 6.55 1.63333 6.17778 1.63333 5.8C1.63333 5.03333 1.89167 4.39444 2.40833 3.88333C2.925 3.37222 3.56667 3.11667 4.33333 3.11667C4.76667 3.11667 5.17778 3.20556 5.56667 3.38333C5.95556 3.56111 6.28889 3.81111 6.56667 4.13333C6.84444 3.81111 7.17778 3.56111 7.56667 3.38333C7.95556 3.20556 8.36667 3.11667 8.8 3.11667C9.56667 3.11667 10.2083 3.37222 10.725 3.88333C11.2417 4.39444 11.5 5.03333 11.5 5.8C11.5 6.17778 11.4333 6.55 11.3 6.91667C11.1667 7.28333 10.9389 7.68056 10.6167 8.10833C10.2944 8.53611 9.86389 9.01944 9.325 9.55833C8.78611 10.0972 8.1 10.7444 7.26667 11.5L6.66667 12.2333Z"/></svg>';
  var ICON_SAVED =
    '<svg viewBox="0 0 9.33333 12" width="9" height="12" fill="currentColor" aria-hidden="true">' +
    '<path d="M0 12V1.33333C0 0.966667 0.130556 0.652778 0.391667 0.391667C0.652778 0.130556 0.966667 0 1.33333 0H8C8.36667 0 8.68056 0.130556 8.94167 0.391667C9.20278 0.652778 9.33333 0.966667 9.33333 1.33333V12L4.66667 10L0 12Z"/></svg>';
  var ICON_DONATIONS =
    '<svg viewBox="0 0 13.3333 12.6667" width="13" height="13" fill="currentColor" aria-hidden="true">' +
    '<path d="M1.33333 10V11.3333H12V10H1.33333M1.33333 2.66667H2.8C2.74444 2.56667 2.70833 2.46111 2.69167 2.35C2.675 2.23889 2.66667 2.12222 2.66667 2C2.66667 1.44444 2.86111 0.972222 3.25 0.583333C3.63889 0.194444 4.11111 0 4.66667 0C5 0 5.30833 0.0861111 5.59167 0.258333C5.875 0.430556 6.12222 0.644444 6.33333 0.9L6.66667 1.33333L7 0.9C7.2 0.633333 7.44444 0.416667 7.73333 0.25C8.02222 0.0833333 8.33333 0 8.66667 0C9.22222 0 9.69444 0.194444 10.0833 0.583333C10.4722 0.972222 10.6667 1.44444 10.6667 2C10.6667 2.12222 10.6583 2.23889 10.6417 2.35C10.625 2.46111 10.5889 2.56667 10.5333 2.66667H12C12.3667 2.66667 12.6806 2.79722 12.9417 3.05833C13.2028 3.31944 13.3333 3.63333 13.3333 4V11.3333C13.3333 11.7 13.2028 12.0139 12.9417 12.275C12.6806 12.5361 12.3667 12.6667 12 12.6667H1.33333C0.966667 12.6667 0.652778 12.5361 0.391667 12.275C0.130556 12.0139 0 11.7 0 11.3333V4C0 3.63333 0.130556 3.31944 0.391667 3.05833C0.652778 2.79722 0.966667 2.66667 1.33333 2.66667M1.33333 8H12V4H8.6L10 5.9L8.93333 6.66667L6.66667 3.6L4.4 6.66667L3.33333 5.9L4.7 4H1.33333V8Z"/></svg>';
  var ICON_CALL =
    '<svg viewBox="0 0 15 15" width="15" height="15" fill="currentColor" aria-hidden="true">' +
    '<path d="M14.125 15C12.3889 15 10.6736 14.6215 8.97917 13.8646C7.28472 13.1076 5.74306 12.0347 4.35417 10.6458C2.96528 9.25694 1.89236 7.71528 1.13542 6.02083C0.378472 4.32639 0 2.61111 0 0.875C0 0.625 0.0833333 0.416667 0.25 0.25C0.416667 0.0833333 0.625 0 0.875 0H4.25C4.44444 0 4.61806 0.0659722 4.77083 0.197917C4.92361 0.329861 5.01389 0.486111 5.04167 0.666667L5.58333 3.58333C5.61111 3.80556 5.60417 3.99306 5.5625 4.14583C5.52083 4.29861 5.44444 4.43056 5.33333 4.54167L3.3125 6.58333C3.59028 7.09722 3.92014 7.59375 4.30208 8.07292C4.68403 8.55208 5.10417 9.01389 5.5625 9.45833C5.99306 9.88889 6.44444 10.2882 6.91667 10.6562C7.38889 11.0243 7.88889 11.3611 8.41667 11.6667L10.375 9.70833C10.5 9.58333 10.6632 9.48958 10.8646 9.42708C11.066 9.36458 11.2639 9.34722 11.4583 9.375L14.3333 9.95833C14.5278 10.0139 14.6875 10.1146 14.8125 10.2604C14.9375 10.4063 15 10.5694 15 10.75V14.125C15 14.375 14.9167 14.5833 14.75 14.75C14.5833 14.9167 14.375 15 14.125 15Z"/></svg>';
  var ICON_MESSAGE =
    '<svg viewBox="0 0 16.6667 16.6667" width="17" height="17" fill="currentColor" aria-hidden="true">' +
    '<path d="M3.33333 10H10V8.33333H3.33333V10M3.33333 7.5H13.3333V5.83333H3.33333V7.5M3.33333 5H13.3333V3.33333H3.33333V5M0 16.6667V1.66667C0 1.20833 0.163194 0.815972 0.489583 0.489583C0.815972 0.163194 1.20833 0 1.66667 0H15C15.4583 0 15.8507 0.163194 16.1771 0.489583C16.5035 0.815972 16.6667 1.20833 16.6667 1.66667V11.6667C16.6667 12.125 16.5035 12.5174 16.1771 12.8438C15.8507 13.1701 15.4583 13.3333 15 13.3333H3.33333L0 16.6667Z"/></svg>';

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
              '<button type="button" class="toplist-card__favorite" aria-label="Aggiungi ai preferiti">' + ICON_HEART + "</button>" +
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

        /* ---- Footer: 5 contatori cliccabili (aprono le modali) + pulsanti Chiama/Messaggio ---- */
        '<div class="toplist-card__footer">' +
          '<div class="toplist-card__stats">' +
            '<button type="button" class="toplist-card__stat" data-stat-type="followers">' +
              '<span class="toplist-card__stat-value">' + ICON_FOLLOWERS + "<b>" + listing.stats.followers + "</b></span>" +
              '<span class="toplist-card__stat-label">Followers</span>' +
            "</button>" +
            '<button type="button" class="toplist-card__stat" data-stat-type="reactions">' +
              '<span class="toplist-card__stat-value">' + ICON_REACTIONS + "<b>" + listing.stats.reactions + "</b></span>" +
              '<span class="toplist-card__stat-label">Reactions</span>' +
            "</button>" +
            '<button type="button" class="toplist-card__stat" data-stat-type="saved">' +
              '<span class="toplist-card__stat-value">' + ICON_SAVED + "<b>" + listing.stats.saved + "</b></span>" +
              '<span class="toplist-card__stat-label">Saved</span>' +
            "</button>" +
            '<button type="button" class="toplist-card__stat" data-stat-type="reviews">' +
              '<span class="toplist-card__stat-value">' + ICON_STAR + "<b>" + listing.stats.reviews + "</b></span>" +
              '<span class="toplist-card__stat-label">Reviews</span>' +
            "</button>" +
            '<button type="button" class="toplist-card__stat" data-stat-type="donations">' +
              '<span class="toplist-card__stat-value">' + ICON_DONATIONS + "<b>" + listing.stats.donations + "</b></span>" +
              '<span class="toplist-card__stat-label">Donazioni</span>' +
            "</button>" +
          "</div>" +
          '<div class="toplist-card__contact-actions">' +
            '<button type="button" class="toplist-card__contact-button toplist-card__contact-button--call">' + ICON_CALL + "<span>Chiama</span></button>" +
            '<button type="button" class="toplist-card__contact-button toplist-card__contact-button--message">' + ICON_MESSAGE + "<span>Messaggio</span></button>" +
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
     -------------------------------------------------------------------- */
  function bindStatEvents($list) {
    $list.on("click", ".toplist-card__stat", function () {
      var type = $(this).data("stat-type");
      window.StatDetailModal.open(type);
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
    bindStatEvents($list);
  });

})(jQuery);
