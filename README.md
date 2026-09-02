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
**Font Awesome Free 6.7.2** (icone frecce carosello, SVG inline) — stesso
approccio già validato nel componente slider vetrine. 100% offline, nessun
CDN.

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

- **Card TopList**: badge "NEW", età, contatore video/foto, fascia prezzo,
  badge di stato dinamici (ONLINE ORA / DISPONIBILE ORA / RISPONDO SUBITO,
  mostrati solo se il relativo flag è attivo), stella "TOPLIST" + cuore
  preferiti, carosello foto con frecce e contatore posizione, titolo e
  descrizione, riga statistiche cliccabile, pulsanti Chiama/Messaggio.
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
`id`, `is_new`, `age`, `video_count`, `photo_count`, `price_tier`
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
due non coincidono). **ONLINE ORA** resta grigio scuro con pallino, l'unico
dei tre badge che nel mockup ha già un colore "risolto" e coerente con lo
stesso badge del componente vetrine.

## Note per l'integrazione futura in Laravel

- Il markup di `index.html` dentro `#toplistList` può diventare un Blade
  component (`<x-toplist-card :annuncio="$annuncio" />`), passando
  l'annuncio reale al posto dei dati finti in `MOCK_LISTINGS`.
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
