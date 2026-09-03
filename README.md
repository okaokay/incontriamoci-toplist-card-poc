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
  produzione.

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

## Componente riscritto come plugin jQuery ($.fn.toplistCard)

Su richiesta del senior, stesso trattamento già fatto per lo slider
vetrine (vedi il README di quel componente per il file di riferimento
fornito dal senior stesso e i 3 problemi corretti in review): il
componente è ora un vero plugin jQuery, per poter montare più liste
TopList sulla stessa pagina — es. "TopList Roma" e "TopList Milano" in
due sezioni diverse — ciascuna con la propria sorgente dati.

```js
// Inizializzazione
$("#toplistList").toplistCard({
  fetchListings: fetchListings // funzione () => Array<listing> — o una Promise/jqXHR
});

// Ricarica la lista con dati aggiornati (es. cambio filtro/categoria)
$("#toplistList").toplistCard("refresh");

// Distruzione (rimuove le card e gli event handler di questa istanza)
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

Sotto i 768px la card non è più una versione compressa di quella desktop:
è un **secondo template HTML**, generato da `buildMobileCardHtml()` in
`toplist-card.js` per ogni annuncio, in parallelo al template desktop
(`buildDesktopCardHtml()`). I due template stanno entrambi nel DOM dentro
lo stesso contenitore (`.toplist-card-container[data-listing-id]`); CSS
mostra l'uno o l'altro in base alla larghezza (`.toplist-card` nascosta
sotto 768px, `.toplist-card-mobile` nascosta sopra) — nessun ricalcolo
lato JS al resize. Riferimento: node Figma `691:927` (frame iPhone SE
390px, card 360px) — le due versioni precedenti (`333:2882`/`596:12483`)
erano frame più vecchi, sostituiti da questo.

**Le regole restano identiche tra i due template**: stessi flag letti
(`isOnlineOra`, `isDisponibileSubito`, `isRispondoSubito`, `isToplist`).
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
intera non ci sta e va a capo. Stesse 5 statistiche (ordine diverso:
Donazioni prima di Recensioni sul mobile, replica esatta del mockup — le
chiavi `data-stat-type` restano invariate, quindi `StatDetailModal` non
richiede nessuna modifica), stessi link Chiama/WhatsApp. Cambia la
disposizione visiva: chip arrotondati al posto della riga con
separatori, gruppo flottante in alto a sinistra con TOPLIST **e la
fascia prezzo affiancati** (su richiesta del cliente — sul desktop il
prezzo resta testo semplice nell'header, qui è un chip vicino a TOPLIST),
badge di stato (senza il prezzo) in flusso normale tra galleria e titolo
(non più flottanti: si adattano con `flex-wrap` a qualunque larghezza
invece di uscire dal bordo della card su schermi stretti), galleria a
riquadro singolo (nessuna freccia: sul mobile la navigazione foto sarà a
swipe, come nello slider vetrine) invece del carosello con
frecce/contatore, pulsanti CTA a tutta larghezza invece che a sinistra.

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
