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
│   ├── stat-detail-modal.js   → componente UNICO condiviso dalle 5 modali (vedi sotto)
│   └── toplist-card.js        → card TopList: badge, carosello, footer statistiche
├── img/icons/                 → SVG esportati da Figma (stella, cuore, video, foto,
│                                  followers/reactions/saved/reviews/donazioni, call, message)
│                                  — tenuti come file anche se nel markup sono inline,
│                                  utili come riferimento/riuso in altri componenti
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

**Nessuna paginazione**: su richiesta esplicita del cliente, le righe si
caricano tutte in un'unica chiamata quando la modale si apre (l'utente la
apre volontariamente, non è uno scroll passivo come lo slider vetrine). La
funzione `fetchStatRows(type)` in cima al file è comunque isolata apposta:
se in futuro un annuncio molto popolare avesse centinaia di interazioni, si
potrà introdurre paginazione qui dentro senza toccare la card (sono due
componenti separati).

## Schema dati — cosa la card si aspetta di ricevere

**Campi diretti dell'annuncio:**
`id`, `name` (nome/nickname pubblico dell'inserzionista — **aggiunto dopo
la prima versione**, segnalato dal cliente come dato mancante: il node
Figma 409:4482 non lo includeva nell'header, solo un placeholder di titolo
nel corpo; qui è il primo elemento in alto a sinistra, prima del badge
NEW), `is_new`, `age`, `video_count`, `photo_count`, `price_tier`
(`"€"`/`"€€"`/`"€€€"`), `title`, `description`, `photos[]` (qui solo un
conteggio per il contatore del carosello; in produzione sarà l'array reale
di URL foto — la prima è quella scelta come anteprima, sezione 6.3 della
doc), `stats` (`followers_count`, `reactions_count`, `saved_count`,
`reviews_count`, `donations_count`).

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
> Nei dati finti (`MOCK_LISTINGS` in `toplist-card.js`) sono già presenti
> con valori di esempio diversi tra i 3 annunci, così la card li mostra
> correttamente da subito quando il pannello opzioni sarà collegato.

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
- **Fascia prezzo (€/€€/€€€)**: prima era un valore fisso scritto a mano
  per ciascun annuncio finto; ora è **calcolata** da `costPerHour`, il
  dato realmente catturato nel form (campo tag "prezzo/ora", Step 2 "Media
  & Tag" del wizard, doc sezione 2.2) tramite la funzione `getPriceTier()`
  in `toplist-card.js`. Le soglie usate (`>= 150 → €€€`, `>= 70 → €€`,
  altrimenti `€`) sono un esempio ragionevole, **non valori di business
  ufficiali** — vanno confermate con cliente/senior prima di andare in
  produzione (vedi "Domande per il senior").

## Nome, Chiama e badge TOPLIST — stile "chip catturato" (rosa + bordo nero)

Su richiesta esplicita, questi tre elementi condividono ora lo stesso
trattamento visivo — sfondo rosa `#FFADE2`, bordo nero 2px, angoli
arrotondati, testo in grassetto — per segnalare visivamente che si tratta
di **dati catturati durante il caricamento dell'annuncio**, non di
elementi puramente decorativi della UI:

- **Nome inserzionista** (`.toplist-card__name` in `style.css`)
- **Pulsante Chiama** (`.toplist-card__contact-button--call`)
- **Badge TOPLIST** (`.toplist-card__toplist-flag`, qui a forma di pillola
  perché era già un badge corto)

Il pulsante WhatsApp resta verde brand (invariato, vedi sezione sopra):
il trattamento rosa+bordo nero è specifico solo per questi 3 elementi.

## Titolo, descrizione e foto — anche questi sono campi da agganciare

Erano già presenti come campi della card (non sono stati aggiunti ora),
ma vale la pena renderlo esplicito: **non sono testo statico**, sono dati
catturati durante il wizard di caricamento annuncio, esattamente come il
nome e il costo/ora discussi sopra:

- `title` e `description` → campi "titolo" e "descrizione", **Step 1 "Info
  Base"** del wizard (doc, sezione 2.1, node Figma `577:7224`).
- `photos[]` → galleria caricata nello **Step 2 "Media & Tag"** (doc,
  sezione 2.2, dropzone immagini) — con questa modifica è diventato un
  VERO array (`buildPlaceholderPhotos()` in `toplist-card.js`), non solo
  un numero per il contatore del carosello come prima: in produzione ogni
  elemento avrà almeno `{id, url}`, pronti per essere iniettati al posto
  dei placeholder. Il primo elemento deve essere quello con
  `id === preview_media_id` (doc, sezione 6.3, foto scelta come
  anteprima).

Tutti e tre passano già da `fetchListings()` (vedi sezione dedicata più
sotto): il senior non deve cercare questi campi altrove nel file, basta
popolarli lì con i dati reali.

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
loggato è lato Laravel, vedi "Domande per il senior".

## Reazioni disponibili nella modale "Reazioni"

Accanto al chip "Utenti anonimi" nella modale Reazioni compaiono ora le 4
icone che rappresentano le reazioni che un utente può lasciare (le stesse
4 che compaiono come "valore" nelle righe della lista: cuore nero,
innamorato, fuoco, indifferente) — su richiesta esplicita, **solo icone
Font Awesome Free 6.7.2** (`heart`, `face-grin-hearts`, `fire`,
`face-meh`), non le emoji usate nel resto della modale per il valore di
ogni riga. In questo POC sono solo informative (mostrano cosa si PUÒ
scegliere), non ancora cliccabili per lasciare una reazione vera — vedi
"Domande per il senior" per il collegamento a un endpoint reale.

## Donazioni: solo il numero, senza simbolo "€"

Su richiesta esplicita, l'importo nella modale Donazioni mostra solo la
cifra (es. `50`), senza il simbolo `€` che c'era prima — resta comunque
in evidenza (colore rosa, grassetto) rispetto al resto della riga.

## Come i dati arrivano a ogni modale — il pezzo che serve al senior

Fino a questa versione c'era un **buco reale nell'integrazione**: la card
scrive un `data-listing-id` su ogni riga (`<div class="toplist-card"
data-listing-id="...">`, vedi `buildCardHtml`), ma quando si cliccava un
contatore quell'id non veniva letto né passato da nessuna parte — la
modale non aveva modo di sapere **di quale annuncio** mostrare
Follower/Reazioni/ecc. In pratica, con più card in pagina, avrebbero
mostrato tutte gli stessi identici dati finti (cosa che infatti succedeva,
solo che essendo dati finti uguali per ogni annuncio non si notava).

**Sistemato così:**

1. Al click su un contatore (`bindStatEvents` in `toplist-card.js`),
   leggiamo il `data-listing-id` dalla card più vicina (`.closest(...)`)
   e lo passiamo a `StatDetailModal.open(type, listingId)`.
2. `stat-detail-modal.js` inoltra `listingId` a `fetchStatRows(type,
   listingId)` — oggi lo ignora (i dati finti in `MOCK_STAT_ROWS` sono
   condivisi da tutti gli annunci, per semplicità del POC), ma **la firma
   della funzione è già quella corretta**.

**Cosa deve fare il senior per agganciare i dati veri**, in ordine:

1. Decidere il contratto dell'endpoint (proposta): un'unica rotta
   parametrica per tutte e 5 le modali, es.

   ```
   GET /api/annunci/{listingId}/stats/{tipo}
   ```

   dove `{tipo}` è uno tra `followers|reactions|saved|reviews|donations`
   (stessi valori già usati in `data-stat-type` sui bottoni della card, non
   serve nessuna mappatura aggiuntiva). Risposta attesa, stessa forma dei
   dati finti attuali:

   ```json
   {
     "anonymous_count": 1,
     "rows": [
       { "name": "Chiara", "city": "Firenze", "value": "🖤", "date": "2025-03-19" }
     ]
   }
   ```

   (`value` e `rating`/`text` cambiano forma a seconda del tipo — vedi
   `buildRowHtml()` in `stat-detail-modal.js` per i 3 formati riga
   esistenti: `simple`, `value`, `review`.)
2. Sostituire il corpo di `fetchStatRows(type, listingId)` con una vera
   chiamata (es. `$.get("/api/annunci/" + listingId + "/stats/" + type)`).
   Come per lo slider vetrine, l'unico cambiamento strutturale è che
   diventerà **asincrona** — `openModal()` andrà adattato ad aspettare la
   Promise prima di costruire l'HTML delle righe.
3. Le date nei dati finti sono in formato `GG/MM/AAAA` (italiano, pronto
   per essere mostrato così com'è); se il backend restituisce date in
   formato ISO (`AAAA-MM-GG`) va deciso se formattarle lato server o lato
   client prima di renderizzarle.

Questa è probabilmente la domanda più importante da chiudere prima di
integrare davvero le modali — vedi anche i punti 1-3 di "Domande per il
senior" qui sotto, che dipendono direttamente da questa decisione.

## Come i dati degli annunci arrivano alla card — il punto di aggancio

Stessa logica già usata per lo slider vetrine e per le modali di questo
componente (vedi sopra): **un'unica funzione isolata** produce i dati, e
nessun'altra parte del file legge l'array finto direttamente.

- `fetchListings()` in `toplist-card.js` è l'UNICO punto che il senior deve
  toccare per collegare gli annunci reali: oggi restituisce
  `MOCK_LISTINGS`, in produzione diventerà una vera chiamata (es.
  `$.get("/api/annunci", { categoria: "roma" })`).
- Subito sopra `MOCK_LISTINGS` c'è la mappatura **campo per campo** verso
  la fonte dati Eloquent più plausibile (es. `name` → `users.display_name`,
  `stats.followers` → count della relazione `listing→followers`, ecc.) —
  utile come punto di partenza per scrivere la query reale, anche se i nomi
  esatti delle colonne/relazioni andranno confermati con chi conosce lo
  schema reale del database.
- **Il nome dell'inserzionista (`name`)** in particolare: è un dato
  "catturato" (inserito dall'utente in fase di registrazione o
  pubblicazione annuncio), non testo statico — va quindi risolto con una
  query reale come tutti gli altri campi, non semplicemente scritto in
  pagina. Aggiunto dopo la prima versione della card perché il node Figma
  non lo includeva nell'header (vedi commit precedente).

## Note per l'integrazione futura in Laravel

- Il markup di `index.html` dentro `#toplistList` può diventare un Blade
  component (`<x-toplist-card :annuncio="$annuncio" />`), passando
  l'annuncio reale al posto dei dati finti restituiti da `fetchListings()`.
- `stat-detail-modal.js` è indipendente dalla card: può essere incluso e
  riusato ovunque nel sito serva lo stesso tipo di lista dettaglio, non
  solo dalla card TopList.
- Le foto placeholder andranno sostituite con le foto reali: basta
  sostituire `.toplist-card__photo-placeholder` con un carosello di `<img>`
  veri quando gli URL sono disponibili — la logica JS del contatore/frecce
  non cambia, va solo estesa per cambiare anche l'immagine mostrata (oggi
  cambia solo il numero, non essendoci foto reali da mostrare).
- Nessuna dipendenza oltre jQuery: entrambi i file JS possono essere
  inclusi così come sono in `public/js/`.

## Domande per il senior

1. **Contratto delle 5 liste di dettaglio**: un endpoint dedicato per tipo
   (es. `/api/annunci/:id/followers`, `/api/annunci/:id/reactions`, ecc.) o
   un unico endpoint parametrico (es. `/api/annunci/:id/stats/:tipo`)? La
   forma attesa dal frontend è `{ anonymous_count, rows: [...] }`.
2. **Flag `is_anonymous`**: come viene esposto per ogni interazione
   (follow/reazione/salvataggio/recensione)? Le donazioni, da mockup, non
   supportano l'anonimato (nessun flag necessario per quel tipo).
3. **Relazioni Eloquent da esporre**: `listing→followers`,
   `listing→reactions` (con tipo emoji), `listing→savedBy`,
   `listing→reviews` (con `rating` e testo), `listing→donations` (con
   importo) — tutte con utente collegato (o riga anonima) e timestamp.
4. **Sincronizzazione contatore Recensioni**: la doc (7.3) segnala che il
   numero "Reviews" nel footer statistiche deve restare sincronizzato con
   qualunque altro punto del sito mostri lo stesso dato (stessa fonte).
   Verificare in fase di query che non ci siano due conteggi divergenti.
5. **Layout mobile**: il node Figma `409:4482` è solo desktop — non è stato
   fornito un node mobile dedicato per questa card (a differenza dello
   slider vetrine, che aveva il node `681:2090`). L'adattamento mobile qui
   incluso (card impilata verticalmente invece che riga orizzontale) è una
   scelta ragionevole di chi ha scritto il codice, **non** una traduzione
   1:1 di un mockup — da confermare col design prima di andare in
   produzione.
6. **Colori badge di stato**: confermare che verde/blu (vedi sezione
   dedicata sopra) siano effettivamente i colori finali voluti per
   "DISPONIBILE ORA"/"RISPONDO SUBITO", dato che il file Figma statico
   mostra grigio invece che i colori descritti a testo nella doc.
7. **Palette bordo colorato (9 colori)**: i valori hex usati qui
   (`toplist-card.js`, `BORDER_COLOR_PALETTE`) sono una scelta ragionevole
   per rosa/magenta/rosso/arancione/giallo/verde/blu/viola/nero, non
   valori esatti forniti dal design — da allineare con la palette
   ufficiale quando il pannello opzioni (fuori scope qui) sarà progettato.
8. **Persistenza del "preferito"**: che endpoint salva/rimuove il
   preferito per l'utente loggato (`POST`/`DELETE /api/annunci/:id/preferiti`
   o simile)? Serve anche sapere se la card deve arrivare già con lo stato
   iniziale "preferito da questo utente" valorizzato dal server (oggi parte
   sempre vuota, vedi sezione dedicata sopra).
9. **Reazioni cliccabili**: le 4 icone mostrate nella modale Reazioni sono
   oggi solo informative — se in futuro devono diventare cliccabili per
   lasciare davvero una reazione, serve l'endpoint corrispondente (es.
   `POST /api/annunci/:id/reazioni` con il tipo scelto) e la gestione di
   "un utente può cambiare/togliere la propria reazione" o solo aggiungerne
   una nuova.
10. **Soglie fascia prezzo**: le soglie usate da `getPriceTier()` (`€€€`
    da 150/ora, `€€` da 70/ora, altrimenti `€`) sono un esempio ragionevole
    scelto per riprodurre visivamente le 3 fasce già presenti nei dati
    finti precedenti — non sono valori di business ufficiali, vanno
    confermati (o resi configurabili lato server) prima di produzione.
