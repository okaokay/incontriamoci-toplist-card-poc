/* ============================================================================
   TOPLIST CARD — jQuery Plugin ($.fn.toplistCard)
   Su richiesta del cliente questo file NON genera più l'HTML delle card:
   si limita ad agganciare l'interattività (carosello foto con lazy load,
   swipe touch, cuoricino preferiti, apertura delle modali statistiche) a
   un markup che ESISTE GIÀ nella pagina — scritto a mano qui nel POC,
   stampato da Blade in produzione. Vedi il commento in cima a index.html
   ("QUESTO È IL CONTRATTO HTML PER BLADE") per la struttura esatta e gli
   attributi che il markup deve avere perché questo plugin funzioni.

   File autonomo, dipende solo da jQuery + StatDetailModal (vedi
   stat-detail-modal.js, caricato prima di questo in index.html).
   ============================================================================ */

(function ($) {
  "use strict";

  var PLUGIN_NAME = "toplistCard";

  /* Contatore per generare un id INTERNO univoco per ogni istanza, usato
     per namespacizzare gli eventi delegati: senza, destroy() su
     un'istanza rischierebbe di togliere gli event handler anche di
     un'altra lista TopList presente sulla stessa pagina — stesso
     identico problema (e stessa soluzione) del plugin vetrineSlider. */
  var instanceCounter = 0;

  /* --------------------------------------------------------------------
     CAROSELLO FOTO — LAZY LOAD
     Con più annunci TopList in pagina, ognuno con la propria galleria
     (anche 15-20 foto), scaricarle TUTTE al caricamento della pagina
     sarebbe lento e sprecherebbe banda per foto che l'utente magari non
     vede mai. Qui restano in memoria SOLO due foto per volta: quella
     mostrata ("corrente", già nell'HTML stampato da Blade) e quella
     subito dopo ("successiva"), precaricata in background così il
     prossimo click/swipe è istantaneo — le altre non vengono scaricate
     finché l'utente non ci arriva navigando una alla volta.

     Gli URL delle foto arrivano dall'attributo "data-images" scritto da
     Blade su ".toplist-card__media" (JSON di stringhe, jQuery lo legge
     già come array vero con "$media.data('images')") — il plugin non ha
     più bisogno di un array di dati JS a parte per saperli, sono già nel
     DOM. */
  function preloadImage(url) {
    if (!url) {
      return;
    }
    var img = new Image();
    img.src = url;
  }

  /* Avanza/arretra il contatore "N/tot" di un carosello foto di una
     posizione, con clamp ai bordi (non supera mai 1 o il totale), e
     aggiorna la foto mostrata + precarica quella dopo. Condivisa da
     bindEvents() tra il click sulle frecce e lo swipe touch/mouse sulla
     galleria mobile: stessa identica logica, cambia solo COSA la
     richiama. */
  function stepCarouselCounter($media, direction) {
    var images = $media.data("images");
    if (!images || !images.length) {
      return;
    }

    var $counter = $media.find(".toplist-card__photo-counter");
    var parts = $counter.text().split("/");
    var current = parseInt(parts[0], 10) || 1;
    var total = images.length;

    if (direction === "next") {
      current = Math.min(total, current + 1);
    } else {
      current = Math.max(1, current - 1);
    }
    $counter.text(current + "/" + total);

    var currentUrl = images[current - 1]; // "current" è 1-based, l'array è 0-based
    if (currentUrl) {
      $media.find(".toplist-card__photo, .toplist-card-mobile__photo").attr("src", currentUrl);
    }
    var nextUrl = images[current]; // indice 0-based della foto SUBITO DOPO quella corrente
    if (nextUrl) {
      preloadImage(nextUrl);
    }
  }

  /* --------------------------------------------------------------------
     COSTRUTTORE DEL PLUGIN
     Ogni chiamata a $(selector).toplistCard() crea UNA istanza di questa
     classe per ciascun elemento selezionato — a differenza della
     versione precedente non serve più passare "fetchListings": non c'è
     più nulla da scaricare/costruire, solo eventi da agganciare a un
     markup già pronto. */
  function Plugin(element) {
    var self = this;
    self.element = element;
    self.$root = $(element);
    self.instanceId = PLUGIN_NAME + "-" + (++instanceCounter);
    self.init();
  }

  $.extend(Plugin.prototype, {

    init: function () {
      this.bindEvents();

      /* Precarica SOLO la seconda foto di ogni galleria già presente in
         pagina (la prima è già nell'HTML stampato da Blade): così il
         primo swipe/click sulle frecce è istantaneo, senza scaricare
         l'intera galleria — vedi stepCarouselCounter per il resto. */
      this.$root.find(".toplist-card__media").each(function () {
        var images = $(this).data("images");
        if (images && images[1]) {
          preloadImage(images[1]);
        }
      });
    },

    bindEvents: function () {
      var self = this;
      var ns = "." + self.instanceId;

      self.$root.on("click" + ns, ".toplist-card__carousel-arrow", function () {
        var $arrow = $(this);
        var $media = $arrow.closest(".toplist-card__media");
        stepCarouselCounter($media, $arrow.hasClass("toplist-card__carousel-arrow--next") ? "next" : "prev");
      });

      /* Swipe/trascinamento sulla foto mobile (Pointer Events: un'unica
         API per touch, mouse e penna, niente bisogno di gestirli
         separatamente). "touch-action: pan-y" in CSS lascia lo scroll
         verticale della pagina nativo del browser — qui intercettiamo
         SOLO il movimento orizzontale.

         "swipeMoved" distingue un vero swipe da un semplice tap: se il
         dito si è spostato oltre la soglia, il successivo evento "click"
         sulla foto viene annullato (altrimenti, oltre a cambiare foto,
         l'utente finirebbe anche sulla pagina del profilo per il click
         che il browser genera comunque a fine trascinamento). */
      var SWIPE_THRESHOLD = 40;
      var swipeStartX = null;
      var swipeMoved = false;

      self.$root.on("pointerdown" + ns, ".toplist-card-mobile__gallery", function (e) {
        swipeStartX = e.originalEvent.clientX;
        swipeMoved = false;
      });

      self.$root.on("pointermove" + ns, ".toplist-card-mobile__gallery", function (e) {
        if (swipeStartX === null) {
          return;
        }
        if (Math.abs(e.originalEvent.clientX - swipeStartX) > SWIPE_THRESHOLD) {
          swipeMoved = true;
        }
      });

      self.$root.on("pointerup" + ns + " pointercancel" + ns, ".toplist-card-mobile__gallery", function (e) {
        if (swipeStartX === null) {
          return;
        }
        var deltaX = e.originalEvent.clientX - swipeStartX;
        swipeStartX = null;

        if (Math.abs(deltaX) < SWIPE_THRESHOLD) {
          return; // spostamento troppo piccolo: è un tap, non uno swipe
        }
        var $media = $(this).closest(".toplist-card__media");
        stepCarouselCounter($media, deltaX < 0 ? "next" : "prev");
      });

      /* Il link alla pagina del profilo non deve attivarsi se il click
         che il browser genera a fine trascinamento arriva dopo uno
         swipe riuscito (vedi sopra) — solo un tap "pulito" naviga. */
      self.$root.on("click" + ns, ".toplist-card-mobile__gallery", function (e) {
        if (swipeMoved) {
          e.preventDefault();
          swipeMoved = false;
        }
      });

      /* Collegamento contatori → modali. Un solo listener delegato sul
         contenitore (invece di uno per bottone): funziona anche per
         card aggiunte alla pagina dopo l'inizializzazione (es. paginate
         via AJAX in futuro). Il tipo di modale da aprire è letto
         direttamente dall'attributo "data-stat-type" già nel markup.

         IMPORTANTE per l'integrazione: passiamo anche il "listingId"
         dell'annuncio (letto da "data-listing-id" sul contenitore) a
         StatDetailModal.open(). Senza, la modale non saprebbe DI QUALE
         annuncio mostrare Follower/Reazioni/ecc. — vedi
         stat-detail-modal.js e il README ("Come i dati arrivano a ogni
         modale") per il contratto completo. */
      self.$root.on("click" + ns, ".toplist-card__stat", function () {
        var type = $(this).data("stat-type");
        var listingId = $(this).closest("[data-listing-id]").data("listing-id");
        window.StatDetailModal.open(type, listingId);
      });

      /* Toggle cuoricino preferiti: SOLO una classe CSS ("is-active") a
         cambiare, le due icone (contorno/piena) sono ENTRAMBE già nel
         markup stampato da Blade, con visibilità decisa da CSS in base
         a questa classe (vedi style.css) — questo plugin non costruisce
         più nessuna icona SVG, si limita a spostare la classe.
         NOTA: stato SOLO visivo/locale al browser (non persiste al
         reload, non chiama nessun endpoint) — la vera persistenza del
         "preferito" è lato Laravel, fuori scope per questo POC.

         Ogni annuncio esiste in DUE copie nel DOM (template desktop +
         template mobile): solo una è visibile alla volta via CSS, ma
         entrambe restano nel DOM. Aggiorniamo QUINDI tutti i cuoricini
         con lo stesso "data-listing-id" (non solo quello cliccato), così
         lo stato resta sincronizzato anche se l'utente ridimensiona la
         finestra passando dall'una all'altra. */
      self.$root.on("click" + ns, ".toplist-card__favorite", function () {
        var $clicked = $(this);
        var nextActive = !$clicked.hasClass("is-active");
        var listingId = $clicked.closest("[data-listing-id]").data("listing-id");

        self.$root
          .find('[data-listing-id="' + listingId + '"]')
          .find(".toplist-card__favorite")
          .toggleClass("is-active", nextActive)
          .attr("aria-pressed", String(nextActive));
      });
    },

    /* --------------------------------------------------------------------
       DISTRUZIONE DELL'ISTANZA
       Toglie SOLO gli eventi di QUESTA istanza (grazie al namespace
       per-istanza) — sicuro da chiamare anche con più liste toplistCard
       attive sulla stessa pagina. Non svuota più il contenitore (non è
       più il plugin ad averlo riempito). */
    destroy: function () {
      this.$root.off("." + this.instanceId);
      $.removeData(this.element, PLUGIN_NAME);
    }
  });

  /* --------------------------------------------------------------------
     DEFINIZIONE PLUGIN JQUERY — $.fn.toplistCard
     Stesso pattern del plugin vetrineSlider: prima chiamata su un
     elemento = crea l'istanza; chiamate successive con una stringa =
     invocano il metodo pubblico corrispondente. Esempi:

         $("#toplistList").toplistCard();
         $("#toplistList").toplistCard("destroy");
     -------------------------------------------------------------------- */
  $.fn[PLUGIN_NAME] = function (options) {
    var args = Array.prototype.slice.call(arguments, 1);

    return this.each(function () {
      var instance = $.data(this, PLUGIN_NAME);

      if (!instance) {
        $.data(this, PLUGIN_NAME, new Plugin(this));
      } else if (typeof options === "string" && options.charAt(0) !== "_" && typeof instance[options] === "function") {
        instance[options].apply(instance, args);
      } else {
        $.error("Il metodo '" + options + "' non esiste nel plugin " + PLUGIN_NAME + ".");
      }
    });
  };

  /* --------------------------------------------------------------------
     INIZIALIZZAZIONE AL CARICAMENTO DELLA PAGINA
     Aggancia il plugin al contenitore delle card, già popolato da Blade
     (o, in questo POC, scritto a mano in index.html) — nessuna opzione
     da passare, nessun dato da caricare. */
  $(function () {
    $("#toplistList").toplistCard();
  });

})(jQuery);
