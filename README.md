# Prova tecnica — Card TopList + Modali di dettaglio

Prototipo funzionante della card annuncio "TopList" (riferimento Figma: node
`409:4482`, "Toplist Item 1") e delle 5 modali di dettaglio collegate alla
riga statistiche (Follower, Reazioni, Preferiti, Recensioni, Donazioni —
node `409:4523` per l'aggancio, `479:13268`/`479:13332`/`479:13408`/
`479:13460`/`479:13528` per le 5 modali). Vedi
`Incontriamoci_Documentazione_Funzionalita.docx`, sezioni 6 e 7.

**Componente separato** dallo slider vetrine (repo/cartella dedicata): come
da indicazione del cliente, ogni componente ha la propria cartella e il
proprio push, così il senior può montarli sullo staging uno alla volta senza
dipendenze incrociate nel repository.

Stack: **Bootstrap 3.4.1** (solo CSS, per il grid) + **jQuery 3.7.1** +
icone SVG inline (frecce carosello + riga statistiche footer). 100% offline,
nessun CDN.

**Icone della riga statistiche footer** (Followers/Reazioni/Preferiti/
Recensioni/Donazioni): sono i path ESATTI esportati dal node Figma
`516:9277`, non un'approssimazione — l'unica eccezione è "Reazioni", che
nel mockup non è un'icona ma testo emoji (`🖤😐`), riportato identico. Le
frecce del carosello restano Font Awesome Free 6.7.2 (stesso approccio
validato nello slider vetrine), dato che il node della card non specifica
un'icona diversa per quelle.

## Come aprirlo

Pacchetto autonomo, nessuna installazione: apri `index.html` nel browser
(o con "Live Server" in VS Code). Non serve un server Node/PHP.

## Struttura del pacchetto

```
incontriamoci-toplist-card-poc/
├── index.html                 → pagina di prova con la lista card + contenitore modali
├── css/
│   ├── bootstrap.min.css      → Bootstrap 3.4.1 originale, non modificato (solo grid)
│   └── style.css              → card + modali, commentato riga per riga
├── js/
│   ├── jquery.min.js
│   ├── stat-detail-modal.js   → componente UNICO condiviso dalle 5 modali, con
│   │                             infinite scroll (vedi sotto)
│   └── toplist-card.js        → plugin jQuery leggero: SOLO interattività
│                                 (carosello, swipe, preferiti, apertura modali) —
│                                 non genera più HTML, vedi "Contratto HTML per Blade"
├── img/icons/                 → SVG esportati da Figma (stella, cuore, video, foto,
│                                  followers/reactions/saved/reviews/donazioni, call, message)
│                                  — tenuti come file anche se nel markup sono inline,
│                                  utili come riferimento/riuso in altri componenti
├── img/mock/                  → foto finte locali (photo-1.svg…photo-8.svg) usate nei
│                                  `data-images` delle card di prova, 100% offline
└── README.md                  → questo file
```

## Cosa fa il componente

- **Card TopList**: nome inserzionista, età, contatore video/foto, fascia
  prezzo (calcolata dal costo/ora reale, vedi sezione dedicata più sotto),
  badge di stato dinamici (ONLINE ORA / DISPONIBILE ORA / RISPONDO SUBITO,
  mostrati solo se il relativo flag è attivo), stella "TOPLIST" + cuore
  preferiti, carosello foto con frecce e contatore posizione, titolo e
  descrizione, riga statistiche cliccabile, pulsanti Chiama/WhatsApp.
- **Bordo colorato**: se `is_bordo` è attivo, la card mostra un bordo del
  colore scelto (palette fissa a 9 colori, sezione 6.2.2 della doc).
- **5 modali di dettaglio**: cliccando un contatore nel footer (Followers,
  Reactions, Saved, Reviews, Donazioni) si apre la modale corrispondente in
  overlay, con l'elenco delle interazioni (nome, città, valore/emoji/stelle,
  data), chip "Utenti anonimi N" dove previsto, chiusura con "✕", "✕ Chiudi"
  o click fuori dalla modale (oltre al tasto ESC).

## Card TopList: HTML statico + plugin jQuery leggero (contratto per Blade)

Su richiesta esplicita del cliente, `toplist-card.js` **non genera più
l'HTML delle card**: prima costruiva ogni card da un array di dati finti
(`MOCK_LISTINGS`) con template string JS (`buildDesktopCardHtml()`/
`buildMobileCardHtml()`). Ora il markup è **scritto direttamente in
`index.html`** (a mano in questo POC, stampato da Blade in produzione) e
il plugin si limita ad agganciare l'interattività a un markup che esiste
già nella pagina: carosello foto con lazy load, swipe touch mobile,
toggle cuoricino preferiti, apertura delle modali statistiche.

**Il contratto HTML** (documentato per esteso in testa a `index.html`,
sotto "QUESTO È IL CONTRATTO HTML PER BLADE") si riassume così — per
ogni annuncio, un `.toplist-card-container[data-listing-id]` che
contiene **due template affiancati** nel DOM (solo uno visibile per
volta via CSS in base alla larghezza, vedi sezione dedicata più sotto):

- `.toplist-card` (desktop) e `.toplist-card-mobile` (mobile/tablet),
  entrambi con un elemento `.toplist-card__media` che porta l'attributo
  `data-images` (JSON array di URL foto — stesso attributo `$el.data(...)`
  già usato dal plugin `imageCarousel.js` del senior).
- Bottoni statistica con `data-stat-type="followers|reactions|saved|
  reviews|donations"` — il plugin legge questo attributo al click, non
  serve nessuna mappatura JS.
- Cuoricino preferiti con **entrambe** le icone SVG (contorno + piena)
  già nel markup: il plugin sposta solo una classe CSS (`is-active`), non
  costruisce più nessuna icona via JS (vedi CSS dedicato in `style.css`).
- Badge di stato (ONLINE ORA/DISPONIBILE ORA/RISPONDO SUBITO) e bordo
  colorato: la logica "se il flag è attivo, stampa il badge/bordo" resta
  **lato server** (Blade `@if`), non più lato JS — il plugin non li legge
  né li tocca in nessun modo.

**Perché questo cambio**: il senior deve poter stampare il markup
direttamente dal template Blade con i dati reali (Eloquent), senza dover
prima serializzare tutto in un array JS e passarlo a una funzione che
costruisce l'HTML — un passaggio in più, e un punto in più dove i dati
potevano disallinearsi dal markup reale della pagina. Il plugin diventa
così una libreria di **soli comportamenti**, riusabile su qualunque
markup che rispetti il contratto, a prescindere da come è stato stampato.

## Il componente modale — un unico file per tutte e 5

Le 5 modali condividono **esattamente la stessa struttura grafica**
(verificato confrontando i mockup Figma di Reazioni e Donazioni): cambia
solo l'icona, il titolo, se mostrare il chip "Utenti anonimi" e come si
presenta la singola riga. Per questo `stat-detail-modal.js` è **un solo
componente parametrico**, non 5 file quasi identici:

```js
window.StatDetailModal.open("reactions"); // apre la modale Reazioni
window.StatDetailModal.open("donations"); // apre la modale Donazioni
```

Tre "tipi di riga" (`rowType`), scelti in base al tipo di modale:
- `simple` — avatar, nome, città, data (Follower, Preferiti)
- `value` — come sopra + una colonna valore (emoji per Reazioni, importo
  in € per Donazioni)
- `review` — layout diverso: nome+data in alto, poi stelle, poi testo
  della recensione (Recensioni)

**Infinite scroll**: su richiesta esplicita del cliente, le righe si
caricano **a pagine**, non tutte insieme — all'apertura la modale carica
solo la prima pagina (`ITEMS_PER_PAGE = 15` righe), poi ne carica altre
automaticamente quando l'utente scorre vicino al fondo della lista
(soglia `SCROLL_LOAD_THRESHOLD_PX = 80`px), finché non ha visto tutte le
righe disponibili. Stesso principio già usato dallo slider vetrine (batch
`{total, items}`), qui applicato alle 5 modali:

- `fetchStatRowsPage(type, listingId, offset, limit)` sostituisce il
  vecchio `fetchStatRows(type)` a caricamento unico: restituisce
  `{totalItems, anonymousCount, items}` per la pagina richiesta.
- `calculateTotalPages(totalItems, itemsPerPage)` calcola in automatico
  quante pagine servono (`Math.ceil(totalItems / itemsPerPage)`) — il
  chiamante non deve saperlo in anticipo, basta passare il totale e la
  dimensione pagina.
- `openModal()` tiene traccia di `currentPage`/`totalPages`; lo scroll si
  ferma da solo (`currentPage >= totalPages`, nessun'altra richiesta) una
  volta caricata l'ultima pagina, e un indicatore "Caricamento…" compare
  solo mentre la pagina successiva sta arrivando.
- Un flag `isLoadingNextPage` evita richieste doppie se l'utente continua
  a scorrere mentre una pagina è già in caricamento.

Le nuove righe caricate dallo scroll si aggiungono in fondo alla lista
esistente (`.before()` sull'indicatore di caricamento, che resta sempre
l'ultimo figlio) — convivono senza conflitti con le righe aggiunte in
cima dalle azioni utente (Segui, Recensione, ecc., vedi più sotto).

## Schema dati — cosa Blade deve stampare nella card

Da quando la card è HTML statico (vedi sezione dedicata più sopra), questi
non sono più "campi passati a una funzione JS" ma **valori che Blade deve
stampare direttamente nel markup**, nei punti indicati:

`id` (→ `data-listing-id` sul contenitore), `name` (nome/nickname pubblico
dell'inserzionista — **aggiunto dopo la prima versione**, segnalato dal
cliente come dato mancante: il node Figma 409:4482 non lo includeva
nell'header, solo un placeholder di titolo nel corpo; qui è il primo
elemento in alto a sinistra, prima del badge NEW), `age`, `video_count`,
`photo_count`, `price_tier` (`"€"`/`"€€"`/`"€€€"`, calcolo lato server —
vedi sezione dedicata più sotto), `title`, `description`, `photos[].url`
(→ JSON nell'attributo `data-images`, alimenta il carosello a lazy load,
vedi sezione dedicata più sotto; il primo elemento è quello scelto come
anteprima, sezione 6.3 della doc, ed è anche il primo `<img src>` stampato
nel markup), `stats` (`followers_count`, `reactions_count`, `saved_count`,
`reviews_count`, `donations_count`, stampati come testo nei contatori del
footer).

**Flag dal pannello opzioni "In risalto" — FUORI SCOPE qui, solo lettura:**
`is_toplist`, `is_bordo` + `colore_bordo` (uno tra 9 valori fissi:
rosa/magenta/rosso/arancione/giallo/verde/blu/viola/nero), `is_disponibile_subito`,
`is_online_ora`, `is_rispondo_subito`.

> Questi ultimi 5 flag sono impostati da un **componente futuro separato**
> (il pannello opzioni/pubblicazione TopList, Figma node `577:8015`, con
> relativo calcolo prezzi a interpolazione — vedi
> `calcolatore_risalite_prezzi.html` già allegato alla documentazione). Qui
> la card si limita a **leggerli e renderizzare di conseguenza** badge e
> bordo — non c'è nessuna interfaccia per modificarli in questo componente.
> Nel markup scritto a mano in `index.html` sono già presenti con valori
> di esempio diversi tra le 3 card di prova, così si vede subito come si
> comporta badge/bordo una volta che Blade li stamperà con i dati reali
> dal pannello opzioni.

## Colori dei badge di stato — nota importante

Il file Figma statico mostra i badge "ONLINE ORA"/"DISPONIBILE ORA" con
sfondo grigio neutro (`#e5e7eb`) e "RISPONDO SUBITO" in grigio scuro
(`#9ca3af`) — sembra un placeholder di stile non ancora risolto nel
componente Figma. La documentazione (sezione 6.2.3) però specifica
esplicitamente i colori reali: **verde per "DISPONIBILE ORA"** e **blu per
"RISPONDO SUBITO"** — sono questi ultimi quelli implementati qui (badge
`--available` e `--fast-reply` in `style.css`), seguendo lo stesso criterio
già usato per il pulsante WhatsApp del componente slider vetrine (la
documentazione/screenshot del cliente prevale sul wireframe Figma quando i
due non coincidono). **ONLINE ORA**, su richiesta esplicita, ha sfondo rosa
`#FFADE2` (coerente con la palette rosa già usata per cuoricino preferiti e
modali) con testo nero, e il pallino è **verde con animazione "pulse"** in
loop (`@keyframes toplist-online-pulse` in `style.css`) — è il badge che
comunica la condizione più favorevole per il cliente (l'inserzionista è
online ORA), quindi deve attirare l'attenzione più degli altri due, che
restano statici.

## Pulsante WhatsApp invece di "Message"

Il mockup Figma (`409:4482`) mostra un generico pulsante "Message"; su
richiesta esplicita è stato sostituito con un pulsante **WhatsApp** —
stessa icona ufficiale e stesso verde brand (`#25d366`) già usati nel
pulsante WhatsApp del componente slider vetrine, per coerenza visiva tra i
due componenti del sito.

## Badge "NEW" rimosso, fascia prezzo collegata al costo/ora reale

Due modifiche legate ai dati "catturati" nel wizard di caricamento
annuncio (doc, sezione 2):

- **Badge "NEW"**: rimosso su richiesta esplicita — non serviva. Non fa
  più parte né del markup né dello schema dati.
- **Fascia prezzo (€/€€/€€€)**: va **calcolata lato server** da
  `costPerHour`, il dato realmente catturato nel form (campo tag
  "prezzo/ora", Step 2 "Media & Tag" del wizard, doc sezione 2.2) — con la
  card ora HTML statico, questa non è più responsabilità del JS: Blade
  stampa direttamente il simbolo già calcolato (es. helper/accessor
  Eloquent). Soglie proposte come esempio ragionevole (`>= 150 → €€€`,
  `>= 70 → €€`, altrimenti `€`), **non valori di business ufficiali** —
  vanno confermate con cliente/senior prima di andare in produzione.

## Nome, Chiama e badge TOPLIST — stile "chip catturato" (valori esatti da Figma)

Su richiesta esplicita, questi tre elementi condividono lo stesso
trattamento visivo per segnalare che si tratta di **dati catturati durante
il caricamento dell'annuncio**, non elementi puramente decorativi della
UI. Una prima versione usava colori/bordi stimati da uno screenshot; sono
stati poi corretti con i **valori esatti** presi direttamente dai node
Figma indicati dal cliente:

| Elemento | Node Figma | Sfondo | Bordo | Radius |
|---|---|---|---|---|
| Nome inserzionista (`.toplist-card__name`) | `577:12042` | `#fe9bdd` | `1px #77767b` | `2px` |
| Badge TOPLIST (`.toplist-card__toplist-flag`) | `461:3835` | `#fe9bdd` | `1px #77767b` | `2px` |
| Pulsante Chiama (`.toplist-card__contact-button--call`) | `409:4560` | `#fe9bdd` | `1px #77767b` | `2px` |

Angoli **squadrati** (radius 2px), non arrotondati/pillola come nella
versione precedente — coerente col resto della card (badge NEW rimosso,
badge TOPLIST, header/footer hanno tutti lo stesso radius 2/4px). Il
pulsante WhatsApp resta verde brand (invariato, vedi sezione sopra): il
trattamento rosa è specifico solo per questi 3 elementi.

## Titolo, descrizione e foto — anche questi sono campi da agganciare

Erano già presenti come campi della card (non sono stati aggiunti ora),
ma vale la pena renderlo esplicito: **non sono testo statico**, sono dati
catturati durante il wizard di caricamento annuncio, esattamente come il
nome e il costo/ora discussi sopra:

- `title` e `description` → campi "titolo" e "descrizione", **Step 1 "Info
  Base"** del wizard (doc, sezione 2.1, node Figma `577:7224`).
- `photos[]` → galleria caricata nello **Step 2 "Media & Tag"** (doc,
  sezione 2.2, dropzone immagini): Blade stampa gli URL come JSON
  nell'attributo `data-images` di `.toplist-card__media` (vedi "Carosello
  foto — lazy load" più sotto), non più come array JS. Il primo elemento
  deve essere quello con `id === preview_media_id` (doc, sezione 6.3, foto
  scelta come anteprima) — è anche il primo `<img src>` già stampato nel
  markup, per essere visibile senza aspettare JS.

Tutti e tre sono valori che Blade stampa direttamente nel markup (vedi
"Card TopList: HTML statico + plugin jQuery leggero" più sopra): il
senior non deve cercarli in nessuna funzione JS, solo nel template Blade
che genera la card.

## Testi footer statistiche — allineati al node Figma 516:9277

Le etichette sotto i 5 contatori (Follower/Reazioni/Preferiti/Recensioni/
Donazioni) erano rimaste in inglese ("Followers"/"Reactions"/"Saved"/
"Reviews") da una modifica precedente in cui erano state aggiornate solo
le icone, non i testi — corretto: ora il testo è identico a quello del
node Figma mostrato dal cliente.

## Cuoricino "preferiti" — stato vuoto/pieno

Il pulsante cuore accanto al badge TOPLIST (header della card) ora si
comporta come un vero toggle "mi piace":
- **Di default**: contorno vuoto (icona Font Awesome "heart" regular).
- **Al passaggio del mouse**: si tinge di rosa (`#FFADE2`), anteprima
  dell'azione prima del click.
- **Cliccato/selezionato**: diventa pieno e rosa (icona Font Awesome
  "heart" solid, stesso colore `#FFADE2`), resta così finché non si clicca
  di nuovo.

Vedi `bindFavoriteEvents()` in `toplist-card.js`. **Nota**: questo stato è
solo visivo/lato browser in questo POC (non chiama nessun endpoint, non
persiste al reload) — la persistenza reale del preferito per l'utente
loggato è lato Laravel.

## Reazioni disponibili nella modale "Reazioni"

Accanto al chip "Utenti anonimi" nella modale Reazioni compaiono ora le 4
icone che rappresentano le reazioni che un utente può lasciare (le stesse
4 che compaiono come "valore" nelle righe della lista: cuore nero,
innamorato, fuoco, indifferente) — su richiesta esplicita, **solo icone
Font Awesome Free 6.7.2** (`heart`, `face-grin-hearts`, `fire`,
`face-meh`), non le emoji usate nel resto della modale per il valore di
ogni riga. In questo POC sono solo informative (mostrano cosa si PUÒ
scegliere), non ancora cliccabili per lasciare una reazione vera — vedi
da collegare a un endpoint reale prima di andare in produzione.

## Donazioni: solo il numero, senza simbolo "€"

Su richiesta esplicita, l'importo nella modale Donazioni mostra solo la
cifra (es. `50`), senza il simbolo `€` che c'era prima — resta comunque
in evidenza (colore rosa, grassetto) rispetto al resto della riga.

## Come i dati arrivano a ogni modale — il pezzo che serve al senior

La card scrive un `data-listing-id` sul contenitore di ogni annuncio
(`.toplist-card-container[data-listing-id="..."]`, vedi il contratto HTML
più sopra), letto e inoltrato alla modale così:

1. Al click su un contatore (in `bindEvents()` di `toplist-card.js`),
   leggiamo il `data-listing-id` dal contenitore più vicino
   (`.closest("[data-listing-id]")`) e lo passiamo a
   `StatDetailModal.open(type, listingId)`.
2. `stat-detail-modal.js` inoltra `listingId` (insieme a `offset`/`limit`
   per la paginazione, vedi "Infinite scroll" più sopra) a
   `fetchStatRowsPage(type, listingId, offset, limit)` — oggi lo ignora (i
   dati finti generati in cima al file sono condivisi da tutti gli
   annunci, per semplicità del POC), ma **la firma della funzione è già
   quella corretta**.

**Cosa deve fare il senior per agganciare i dati veri**, in ordine:

1. Decidere il contratto dell'endpoint (proposta): un'unica rotta
   parametrica per tutte e 5 le modali, es.

   ```
   GET /api/annunci/{listingId}/stats/{tipo}?offset=0&limit=15
   ```

   dove `{tipo}` è uno tra `followers|reactions|saved|reviews|donations`
   (stessi valori già usati in `data-stat-type` sui bottoni della card, non
   serve nessuna mappatura aggiuntiva), e `offset`/`limit` sono gli stessi
   parametri già usati da `fetchStatRowsPage()` per l'infinite scroll (vedi
   sezione dedicata più sopra). Risposta attesa, stessa forma dei dati
   finti attuali:

   ```json
   {
     "total_items": 38,
     "anonymous_count": 1,
     "rows": [
       { "name": "Chiara", "city": "Firenze", "value": "🖤", "date": "2025-03-19" }
     ]
   }
   ```

   (`value` e `rating`/`text` cambiano forma a seconda del tipo — vedi
   `buildRowHtml()` in `stat-detail-modal.js` per i 3 formati riga
   esistenti: `simple`, `value`, `review`. `total_items` è il totale reale
   lato server, non solo la lunghezza di `rows` — serve al client per
   calcolare con `calculateTotalPages()` quando fermare lo scroll.)
2. Sostituire il corpo di `fetchStatRowsPage(type, listingId, offset,
   limit)` con una vera chiamata (es. `$.get("/api/annunci/" + listingId +
   "/stats/" + type, { offset: offset, limit: limit })`). Come per lo
   slider vetrine, l'unico cambiamento strutturale è che diventerà
   **asincrona** — il codice chiamante usa già `$.when(...)`, quindi non
   richiede nessuna modifica quando la funzione diventerà una vera Promise.
3. Le date nei dati finti sono in formato `GG/MM/AAAA` (italiano, pronto
   per essere mostrato così com'è); se il backend restituisce date in
   formato ISO (`AAAA-MM-GG`) va deciso se formattarle lato server o lato
   client prima di renderizzarle.

Questa è probabilmente la domanda più importante da chiudere prima di
integrare davvero le modali — vedi anche i punti 1-3 di "Domande per il
senior" qui sotto, che dipendono direttamente da questa decisione.

## Modali dinamiche: azioni utente + predisposizione endpoint (richiesta del senior)

Le 5 modali non sono più solo di lettura: ognuna ha una **CTA dinamica**
che dipende dal proprio tipo, e le icone della modale Reazioni sono
diventate davvero cliccabili (prima erano solo informative).

**Convenzione di login** — questo file JS non può sapere da solo se
l'utente è loggato (nessuna sessione lato client): la pagina Blade che lo
include deve valorizzare `window.IncontriamociUser` PRIMA di caricare
`stat-detail-modal.js`, tipicamente così:

```html
<script>
  window.IncontriamociUser = {
    isLoggedIn: @json(auth()->check()),
    id: @json(auth()->id()),
    name: @json(auth()->user()->name ?? null)
  };
</script>
```

Se questo oggetto manca (pagina di test, script fuori contesto), il
default è "non loggato" — scelta sicura, non esegue mai un'azione a nome
di nessuno per errore. Ogni CTA passa prima da `requireLoginOrRedirect()`:
se non loggato, redirect a `https://incontriamoci.xxx/user/login` e
l'azione si ferma lì (nessuna chiamata, nessun aggiornamento visivo).

**CTA per tipo di modale** (`config.action` in `MODAL_TYPES`):

| Modale | CTA | Comportamento |
|---|---|---|
| Reazioni | le 4 icone del picker (già esistenti) | click = aggiunge la reazione, non serve un pulsante extra nel footer |
| Follower | "Segui" / "Segui già" | toggle on/off |
| Preferiti | "Aggiungi ai preferiti" / "Nei preferiti" | toggle on/off |
| Recensioni | "Scrivi una recensione" | apre un mini-form inline (stelle + testo), poi "Invia recensione" |
| Donazioni | "Fai una donazione" | oggi un `prompt()` per l'importo — **placeholder**, in produzione un vero flusso di pagamento (Stripe/PayPal/ecc.), fuori scope per un componente di sola UI |

Ad azione riuscita, la riga con i dati dell'utente loggato viene aggiunta
**in cima alla lista subito** (aggiornamento ottimistico, evidenziata con
uno sfondo tenue), senza dover ricaricare la modale.

**Endpoint predisposti** (GET per leggere, POST per le azioni — da
confermare col senior, non ancora implementate come vere chiamate di
rete in questo POC offline):

```
GET  /api/annunci/{id}/followers   POST /api/annunci/{id}/follow
GET  /api/annunci/{id}/reazioni    POST /api/annunci/{id}/reazioni      { tipo }
GET  /api/annunci/{id}/preferiti   POST /api/annunci/{id}/preferiti
GET  /api/annunci/{id}/recensioni  POST /api/annunci/{id}/recensioni    { valutazione, testo }
GET  /api/annunci/{id}/donazioni   POST /api/annunci/{id}/donazioni     { importo }
```

`postStatAction(type, listingId, payload)` in `stat-detail-modal.js` è il
punto isolato da collegare (stesso pattern già usato per
`fetchStatRowsPage`/`fetchVetrinePage` nello slider vetrine): oggi ritorna
`{ok:true}` sincrono, in produzione una vera `$.ajax` — il resto del
codice usa già `$.when(postStatAction(...))`, quindi non richiede nessuna
modifica quando diventerà una vera Promise.

**Aggancio pronto per il futuro**: ogni azione riuscita emette anche un
evento `$(document).trigger("incontriamoci:statAction", [...])` con
`type`/`listingId` e il dettaglio dell'azione — nessun listener collegato
ancora in questo POC, ma è già pronto per quando servirà aggiornare in
tempo reale anche il numero mostrato sulla card TopList (fuori dalla
modale), senza dover ricaricare la pagina.

## Card mobile mostrata anche su tablet (non solo su telefono)

Su richiesta esplicita del cliente, la versione **tablet deve essere
identica alla versione mobile**, non una via di mezzo col desktop: la
soglia sotto cui compare `.toplist-card-mobile` (e si nasconde
`.toplist-card`) è stata alzata da 767px a **991px** — la soglia
standard del breakpoint "tablet" di Bootstrap 3 (dove inizia
`.col-md-*`). Sopra i 991px si vede sempre e solo il template desktop.

## Come i dati degli annunci arrivano alla card — il punto di aggancio

Da quando la card è HTML statico (vedi "Card TopList: HTML statico +
plugin jQuery leggero" più sopra), il punto di aggancio non è più una
funzione JS ma il **template Blade** che stampa il markup:

- Il markup di `#toplistList` in `index.html` diventerà un Blade
  component/loop (`@foreach ($annunci as $annuncio) <x-toplist-card
  :annuncio="$annuncio" /> @endforeach`), con i valori reali al posto di
  quelli scritti a mano in questo POC.
- La mappatura **campo per campo** verso la fonte dati Eloquent più
  plausibile (es. `name` → `users.display_name`, `stats.followers` →
  count della relazione `listing→followers`, ecc.) è quella già discussa
  nella sezione "Schema dati" più sopra — utile come punto di partenza per
  scrivere la query reale, anche se i nomi esatti delle colonne/relazioni
  andranno confermati con chi conosce lo schema reale del database.
- **Il nome dell'inserzionista (`name`)** in particolare: è un dato
  "catturato" (inserito dall'utente in fase di registrazione o
  pubblicazione annuncio), non testo statico — va quindi risolto con una
  query reale come tutti gli altri campi, non semplicemente scritto in
  pagina. Aggiunto dopo la prima versione della card perché il node Figma
  non lo includeva nell'header (vedi commit precedente).
- `toplist-card.js` non ha più bisogno di sapere nulla sugli annunci: si
  limita a leggere gli attributi `data-*` già stampati da Blade (vedi
  contratto HTML), quindi non richiede nessuna modifica quando la fonte
  dati reale sostituisce quella finta.

## Componente riscritto come plugin jQuery leggero ($.fn.toplistCard)

Su richiesta del cliente, stesso trattamento già fatto per lo slider
vetrine (vedi il README di quel componente per il file di riferimento
fornito dal senior e i 3 problemi corretti in review) ma alleggerito
ulteriormente: il plugin non costruisce più nessun HTML (vedi sopra), si
limita ad agganciare l'interattività — così può essere montato su
**qualunque** markup che rispetti il contratto HTML, anche più liste
TopList sulla stessa pagina (es. "TopList Roma" e "TopList Milano" in due
sezioni diverse), ciascuna già stampata da Blade con i propri dati.

```js
// Inizializzazione — nessuna opzione da passare, il markup è già pronto
$("#toplistList").toplistCard();

// Distruzione (rimuove SOLO gli event handler di questa istanza)
$("#toplistList").toplistCard("destroy");
```

**Più istanze sulla stessa pagina**: ogni istanza ha un id interno
univoco (non si affida all'attributo `id` del DOM, che potrebbe mancare
se il plugin è inizializzato su una `class` condivisa — lo scenario
tipico per cui serve un plugin) usato per namespacizzare i suoi eventi:
`destroy()` su un'istanza non tocca le altre. Testato creando una seconda
lista senza id univoco e verificando che continui a funzionare dopo aver
distrutto la prima.

**Bug parallelo trovato e corretto durante l'adattamento**: i pulsanti
Chiama/WhatsApp nel footer non avevano MAI avuto un vero collegamento
(nessun `href`, nessun handler — restavano semplici `<button>` senza
azione). Stesso fix già applicato allo slider vetrine: ora sono
`<a href="tel:...">`/`<a href="https://wa.me/...">` reali, con i campi
`phone`/`whatsapp` aggiunti ai dati finti (vedi schema dati sopra).

**`stat-detail-modal.js` reso più robusto**: prima richiedeva un
`<div id="statDetailModalRoot"></div>` scritto a mano in ogni pagina che
usa questo componente. Se in futuro più componenti che condividono questo
file (card TopList e altri) finissero sulla STESSA pagina reale, avere
quell'id in più template Blade avrebbe prodotto id duplicati nell'HTML
finale (non valido). Ora il file crea da sé il contenitore alla prima
apertura di una modale (e lo riusa per le successive) — non richiede più
nessun markup preesistente, ed è stato rimosso da `index.html`.

## Note per l'integrazione futura in Laravel

- Il markup di `index.html` dentro `#toplistList` può diventare un Blade
  component (`<x-toplist-card :annuncio="$annuncio" />`), passando
  l'annuncio reale al posto dei dati scritti a mano in questo POC — vedi
  "Card TopList: HTML statico + plugin jQuery leggero" più sopra per il
  contratto esatto.
- `stat-detail-modal.js` è indipendente dalla card: può essere incluso e
  riusato ovunque nel sito serva lo stesso tipo di lista dettaglio, non
  solo dalla card TopList.
- Le foto sono già gestite tramite `data-images` con URL reali (vedi
  "Carosello foto — lazy load" più sotto): basta che Blade stampi lì gli
  URL veri delle foto caricate dall'inserzionista, nessun'altra modifica
  richiesta al plugin.
- Nessuna dipendenza oltre jQuery: entrambi i file JS possono essere
  inclusi così come sono in `public/js/`.

## Header della card: mai più a capo su tablet/mobile

Segnalato dal cliente con uno screenshot da iPad Mini (768px): i badge di
stato "cadevano" su una seconda riga sotto nome/età/video/foto/prezzo,
raddoppiando l'altezza dell'header — visivamente sbagliato.

**Fix**: l'header (`.toplist-card__header` in `style.css`) non va più a
capo su NESSUNA larghezza. Invece di rimpicciolire font/gap fino a
renderli illeggibili sulle larghezze più strette (soluzione fragile, si
rompe di nuovo alla prima larghezza non testata), è un'unica riga che
**scorre orizzontalmente** quando il contenuto non ci sta tutto
(`flex-wrap: nowrap` + `overflow-x: auto` sull'header, `flex-shrink: 0`
su tutti i suoi elementi diretti e i badge). La scrollbar è nascosta
(resta comunque scorrevole con swipe/trackpad) per non appesantire
visivamente l'header. Testato: altezza header identica su desktop,
tablet (768px) e mobile (390px) — mai raddoppiata, mai andata a capo.

**Follow-up**: con lo scroll attivo, sulla card con TUTTI e 3 i badge di
stato attivi (caso più "pieno", non quello mostrato nel mockup Figma con
un solo badge) il cuoricino preferiti finiva comunque fuori dalla vista a
larghezze desktop "medie" (~900px) — tecnicamente raggiungibile scorrendo,
ma senza un indizio visivo sembrava sparito, segnalato dal cliente. Il gap
di 32px tra i badge di stato e il gruppo TOPLIST/cuoricino (preso 1:1 dal
node Figma originale, pensato per un solo badge) è stato ridotto — insieme
agli altri gap dell'header — così il cuoricino resta visibile senza dover
scorrere già da ~900px in su, con lo scroll orizzontale che resta come
riserva solo per le larghezze più strette (tablet/mobile).


## Card mobile — template a parte, non un adattamento del desktop (Figma node 691:927)

Sotto i 991px (vedi soglia tablet più sotto) la card non è più una
versione compressa di quella desktop: è un **secondo template HTML**,
stampato da Blade per ogni annuncio in parallelo al template desktop
(entrambi scritti staticamente nel markup, non più generati da JS — vedi
"Card TopList: HTML statico + plugin jQuery leggero" più sopra). I due
template stanno entrambi nel DOM dentro lo stesso contenitore
(`.toplist-card-container[data-listing-id]`); CSS mostra l'uno o l'altro
in base alla larghezza (`.toplist-card` nascosta sotto la soglia,
`.toplist-card-mobile` nascosta sopra) — nessun ricalcolo lato JS al
resize. Riferimento: node Figma `691:927` (frame iPhone SE 390px, card
360px) — le due versioni precedenti (`333:2882`/`596:12483`) erano frame
più vecchi, sostituiti da questo.

**Le regole restano identiche tra i due template**: stessi flag letti
(`isOnlineOra`, `isDisponibileSubito`, `isRispondoSubito`, `isToplist`,
`isBordo`/`coloreBordo`). **Bug corretto**: il bordo colorato (sezione
"Bordo colorato" più sopra) veniva calcolato ma applicato SOLO al
template desktop — la card mobile di un annuncio con `is_bordo` attivo
restava sempre col bordo grigio di default, invece di mostrare il colore
scelto. Corretto passando lo stesso colore risolto a entrambi i template:
la card desktop lo applica al `border` (1px → 2px quando colorato), la
mobile lo applica all'`outline` (colora solo l'`outline-color`, stesso
spessore di sempre — vedi nota tecnica sull'`outline` più sotto per il
perché la card mobile non usa un `border` vero).
**I colori dei badge di stato sono GLI STESSI del desktop** (verde
DISPONIBILE ORA, blu RISPONDO SUBITO, rosa ONLINE ORA con pallino verde
pulsante — vedi "Colori dei badge di stato" più sopra): il template
mobile riusa le classi `.toplist-badge*` del desktop, non una palette
dedicata. Il grigio del mockup Figma resta un placeholder di stile, come
già per il resto della card. Nota sull'etichetta: qui il badge online usa
il testo breve **"ONLINE"** (non "ONLINE ORA" come sul desktop) — è
l'unico modo per restare nella larghezza esatta di riga del node Figma
(`691:1021`, 328px su una card da 360px) e stare su **una riga sola**
insieme agli altri badge di stato, come nel mockup: con l'etichetta
intera non ci sta e va a capo. Stesse 5 statistiche, **con le stesse
icone SVG del desktop** (Follower/Preferiti/Donazioni/Recensioni — il
mockup Figma mobile mostrava emoji generiche per queste 4, ma era un
artefatto di esportazione, non una scelta di design, confermato dal
cliente; "Reazioni" resta emoji anche sul desktop, quindi qui è identica)
e stesso ordine diverso dal desktop (Donazioni prima di Recensioni sul
mobile, replica esatta del mockup — le chiavi `data-stat-type` restano
invariate, quindi `StatDetailModal` non richiede nessuna modifica),
stessi link Chiama/WhatsApp. Cambia la
disposizione visiva: chip arrotondati al posto della riga con
separatori, gruppo flottante in alto a sinistra con TOPLIST **e la
fascia prezzo affiancati** (su richiesta del cliente — sul desktop il
prezzo resta testo semplice nell'header, qui è un chip vicino a TOPLIST).
**Colori dei due badge del gruppo flottante, su richiesta del cliente**:
TOPLIST riusa lo stesso rosa/bordo/angoli squadrati del badge TOPLIST
desktop (`.toplist-card__toplist-flag`, sfondo `#fe9bdd`, NON il
bianco/grigio del mockup Figma statico); il badge prezzo ha sfondo nero
`#000` e testo rosa `#fe9bdd` (stessa tonalità del badge TOPLIST), colori
scelti dal cliente, non presenti nel mockup Figma (che lo mostrava
grigio). Badge di stato (senza il prezzo) in flusso normale tra galleria e titolo
(non più flottanti: si adattano con `flex-wrap` a qualunque larghezza
invece di uscire dal bordo della card su schermi stretti), pulsanti CTA a
tutta larghezza invece che a sinistra. **La galleria foto ha le stesse
frecce prev/next e lo stesso contatore posizione del desktop** (su
richiesta del cliente — in un primo momento erano state omesse, pensando
allo swipe come unica navigazione mobile, ma il cliente le vuole
comunque): riusa esattamente le classi `.toplist-card__carousel-arrow`/
`.toplist-card__photo-counter` del desktop, quindi `bindEvents()` non ha
richiesto nessuna modifica — il contenitore media porta ENTRAMBE le
classi `.toplist-card__media`/`.toplist-card-mobile__media` (la prima per
l'aggancio agli eventi esistenti, la seconda per le dimensioni mobile).

**La galleria mobile si scorre anche col dito (swipe), non solo con le
frecce**: il cliente ha chiesto entrambe le modalità, non l'una in
alternativa all'altra — coerente con come funziona qualunque carosello
foto su mobile (Instagram, Storie, ecc.). Implementato con i **Pointer
Events** (`pointerdown`/`pointermove`/`pointerup`, un'unica API per
touch/mouse/penna, niente branching su `touchstart` vs `mousedown`),
delegati su `.toplist-card-mobile__gallery` in `bindEvents()`. La stessa
funzione `stepCarouselCounter()` usata dal click sulle frecce viene
richiamata anche dallo swipe — nessuna logica duplicata. `touch-action:
pan-y` sulla foto lascia lo scroll verticale della pagina nativo del
browser, intercettando solo il trascinamento orizzontale. Uno swipe
riuscito (spostamento oltre una soglia minima) annulla anche il click di
navigazione che il browser genera comunque a fine trascinamento — senza
questo accorgimento, oltre a cambiare foto l'utente finirebbe anche sulla
pagina del profilo per sbaglio.

**Foto della galleria e titolo dell'annuncio sono link cliccabili** verso
la pagina personale dell'inserzionista (`listing.profileUrl`, stesso
concetto già usato nel componente slider vetrine per foto/nome): valore
sempre dinamico, mai hardcoded — vale sia per il template mobile sia per
quello desktop (anche lì il titolo/descrizione era già un link, ma
puntava a un placeholder `"#"`, ora usa lo stesso campo dati).

Gli elementi INTERATTIVI del template mobile riusano le stesse classi di
quello desktop (`.toplist-card__favorite`, `.toplist-card__stat`,
`.toplist-card__contact-button`): `bindEvents()` non distingue da quale
template viene l'elemento cliccato, un solo blocco di listener delegati
copre entrambi.

**Cuoricino preferiti sincronizzato tra le due copie**: poiché ogni
annuncio esiste in due copie nel DOM (desktop + mobile, una sola visibile
alla volta via CSS), il click sul cuoricino aggiorna **tutti** i pulsanti
`.toplist-card__favorite` con lo stesso `data-listing-id`, non solo quello
cliccato — altrimenti ridimensionando la finestra da mobile a desktop (o
viceversa) lo stato "preferito" sembrerebbe perso.

**Nota tecnica sul bordo**: il contenitore della card mobile usa
`outline` invece di `border` per i 4px di bordo grigio. In Figma lo
stroke di un frame non riduce l'area di contenuto disponibile (a
differenza del `border` CSS con `box-sizing:border-box`), quindi con un
vero `border` la riga badge di stato risultava 8px più stretta del
valore esatto nel file Figma (320px invece di 328px su una card da
360px) — bastava questo per far andare a capo un badge di troppo su
schermi non larghissimi. `outline` non partecipa al box model, quindi dà
la stessa resa visiva con la larghezza di contenuto corretta.

## Pulsante Telegram — condizionale, solo se l'inserzionista ha collegato il canale

Il mockup mobile ha due varianti: **senza** Telegram (Figma node
333:2882, solo Chiama + WhatsApp) e **con** Telegram (node 596:12483,
Chiama + Telegram + WhatsApp) — la differenza è puramente il dato
`listing.telegram` (nuovo campo, nullable): se valorizzato compare il
terzo pulsante, altrimenti no. Nessun calcolo di larghezza nel JS: i
pulsanti hanno tutti `flex: 1 0 0` in CSS, quindi si dividono lo spazio
in automatico sia con 2 sia con 3 CTA presenti.

In produzione questo campo arriva dallo stesso "toggle canali" dello Step
1 del wizard di caricamento annuncio che già fornisce telefono/WhatsApp
(vedi schema dati in `toplist-card.js`) — nessun nuovo step richiesto,
solo un campo in più da quello step.

**Colori dei 3 pulsanti CTA mobile**, su richiesta del cliente:
- **Chiama**: stesso chip rosa del desktop (`#fe9bdd`, bordo `#77767b`) —
  non più il grigio scuro generico del mockup Figma.
- **WhatsApp**: stesso verde brand ufficiale del desktop (`#25d366`).
- **Telegram** (non esiste sul desktop, pulsante solo mobile): colore
  ufficiale del brand Telegram `#0088cc`, icona e testo bianchi.

**Bug corretto: icone invisibili con tutte e 3 le CTA presenti.** Con
Chiama+Telegram+WhatsApp lo spazio per pulsante si restringe (`flex:1 0 0`
su tre elementi invece di due) e l'icona SVG, essendo un figlio diretto
di un contenitore flex senza `flex-shrink:0` esplicito, veniva
"schiacciata" a larghezza zero insieme al testo — spariva del tutto,
lasciando solo l'etichetta testuale. Il node Figma (`596:12553`) marca
esplicitamente l'icona come "shrink-0" (non ridimensionabile): aggiunta
la stessa regola (`.toplist-card-mobile__action svg { flex-shrink: 0; }`),
ora le 3 icone restano sempre visibili alla loro dimensione piena (16px).

## Carosello foto — lazy load (richiesta del senior)

Il senior ha chiesto un plugin per il caricamento delle immagini del
carosello TopList: il problema reale è la **performance con più annunci
in pagina**, ognuno con la propria galleria (anche 15-20 foto) — scaricarle
tutte al render sarebbe lento e sprecherebbe banda per foto che l'utente
magari non vede mai (tipo quello che in giro si chiama "lazy load").

Implementato **dentro `toplist-card.js`** (non come plugin `$.fn`
separato: qui la logica riguarda solo come questo componente carica le
sue immagini, non è un carosello generico riusabile da altri componenti).
Gli URL delle foto arrivano dall'attributo `data-images` (JSON array)
stampato da Blade su `.toplist-card__media` — il plugin li legge con
`$media.data("images")`, nessun array JS a parte da mantenere allineato:

- **Solo 2 foto per volta in memoria**: quella mostrata ("corrente") e la
  successiva, precaricata in background — le altre restano pigre finché
  l'utente non ci arriva navigando una alla volta (frecce o swipe).
- **Precaricamento via `Image()` fuori dal DOM**: un trucco standard,
  assegnare `src` a un oggetto `Image()` mai inserito nella pagina scarica
  comunque il file e lo mette in cache del browser — quando la foto viene
  davvero mostrata (swap del `src` sull'`<img>` reale) è già pronta,
  nessuna attesa percepita.
- **`loading="lazy"` nativo** sull'`<img>` di ogni card: anche la
  *prima* foto (quella già nell'HTML al render) resta in coda al
  browser finché la card non è vicina allo schermo — utile con una
  lista TopList lunga, dove le card più in basso non vengono nemmeno
  scaricate finché l'utente non scorre fin lì.
- **Stessa logica per desktop e mobile**: `stepCarouselCounter()` (la
  funzione già usata da click-frecce e swipe) ora, oltre ad aggiornare il
  contatore "N/tot", aggiorna anche il `src` dell'`<img>` e precarica la
  foto successiva — nessuna duplicazione tra i due template.

**Dati finti**: `img/mock/photo-1.svg`…`photo-8.svg` sono 8 immagini SVG
locali (colore + numero, es. "Foto 3"), referenziate a rotazione negli
attributi `data-images` delle card di prova — servono a verificare a
occhio che il lazy load carichi davvero la foto giusta al momento giusto,
restando 100% offline (nessun CDN esterno tipo picsum.photos, coerente
col vincolo di progetto). In produzione `data-images` conterrà i veri URL
delle foto caricate dall'inserzionista — nessun'altra modifica richiesta,
il meccanismo di lazy load funziona con qualunque URL reale.
