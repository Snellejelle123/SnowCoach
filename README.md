# SnowCoach

Digitaal leerplatform voor snowboarders en coaches. De site brengt alle informatie over snowboarden samen op één plek. Via een stappenplan kunnen instructeurs oefeningen vinden en kunnen leerlingen zelfstandig oefenen.

## Starten

```bash
npm install
node server.js
```

De site draait dan op `http://localhost:3000`

## Projectstructuur

```
├── 3Dmodel/       # 3D model en houdingen (.json)
├── css/           # Stijlbestanden
├── data/          # JSON bestanden (stappenplan, webmentions)
├── html/          # Alle pagina's
├── images/        # Afbeeldingen
├── javascript/    # Scripts
├── index.html     # Homepagina
└── server.js      # Express server
```

## Topics

### Web Components
Herbruikbare oefenkaarten als custom HTML elementen met Shadow DOM. Het difficulty-niveau past de stijl automatisch aan.

### Three.js
3D animaties van snowboardhoudingen per oefening. De gebruiker kan het model 360° roteren. Er is ook een custom cursor gemaakt met Three.js.

### D3.js
Het stappenplan wordt weergegeven als een interactieve boomstructuur. Takken kunnen in- en uitgeklapt worden. Klikken op een oefening navigeert naar de detailpagina.

### TensorFlow.js
Grenswaardes per gewricht zorgen ervoor dat de 3D avatar geen onrealistische houdingen aanneemt.

### RSS
De site heeft een RSS feed op `/rss.xml` die filterbaar is per categorie. De laatste 10 items worden getoond.

### Webmention
De site kan webmentions ontvangen via `/webmention` en verstuurt automatisch webmentions naar externe URLs die in de content staan. Via het beheerderspaneel kunnen webmentions goedgekeurd of verwijderd worden.

## Pagina's

| URL | Beschrijving |
|-----|-------------|
| `/` | Homepagina |
| `/html/stappenplan.html` | Interactief stappenplan |
| `/html/oefeningen.html` | Overzicht van alle oefeningen |
| `/html/oefening.html?id=...` | Detailpagina per oefening |
| `/html/rss.html` | RSS feeds en webmention info |
| `/html/webmention.html` | Beheerderspaneel |

## Live

https://snowcoach-production.up.railway.app

## Auteur

Jelle Everaert — 2026
