# RPA Flowchart Generator

AI-drevet webapplikation der genererer detaljerede, redigerbare RPA-flowcharts fra procesbeskrivelser, screenshots eller PowerPoint-filer.

Bygget til RPA-teams der dokumenterer forretningsprocesser - upload en beskrivelse eller en eksisterende .pptx-fil, og faa et interaktivt swimlane-flowchart paa sekunder.

![Flowchart Editor](docs/flowchart-with-tokens.png)

## Features

- **AI-generering** - Generer komplette flowcharts fra tekst og/eller screenshots med Claude, Google Gemini eller Azure OpenAI
- **PowerPoint-import** - Upload en eksisterende .pptx-fil og faa automatisk udtrukket tekst + billeder fra alle slides
- **Swimlane-layout** - Noder grupperes automatisk i swimlanes efter applikation (fx Outlook, DUBU, SAPA)
- **6 RPA-specifikke nodetyper** - Procestrin, beslutning, applikationsskift, datainput, bloker og start/slut
- **Drag & drop editor** - Traek noder, opret forbindelser, rediger tekst direkte i browseren
- **Token-tracking** - Se hvilken AI-model der bruges og praecist antal input/output tokens
- **Eksport** - Download som PNG eller PDF
- **Auto-gem** - Alle aendringer gemmes automatisk
- **Undo/redo** - Fortryd og gentag med Ctrl+Z / Ctrl+Y

## Screenshots

### Dashboard
Oversigt over alle projekter med antal noder og dato.

![Dashboard](docs/dashboard.png)

### AI-indstillinger
Vaelg mellem Claude, Google Gemini eller Azure OpenAI. Brug din egen API-noegle.

![Settings](docs/settings.png)

### PowerPoint-import
Upload en .pptx-fil - tekst og billeder udtraekkes automatisk og sendes til AI.

![PPTX Import](docs/pptx-import.png)

### Token-forbrug
Efter generering vises model, provider og praecist token-forbrug.

![Token Usage](docs/token-usage.png)

## Tech Stack

| Komponent | Teknologi |
|-----------|-----------|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS v4 |
| Flowchart | @xyflow/react v12 |
| AI | Anthropic Claude, Google Gemini, Azure OpenAI |
| Database | SQLite (better-sqlite3) |
| PPTX-parsing | JSZip + xml2js |
| Eksport | html-to-image, jsPDF |

## Kom i gang

### Forudsaetninger

- Node.js 20+
- En API-noegle fra [Anthropic](https://console.anthropic.com/), [Google AI Studio](https://aistudio.google.com/) eller [Azure OpenAI](https://azure.microsoft.com/en-us/products/ai-services/openai-service)

### Installation

```bash
git clone https://github.com/Parthee-Vijaya/rpa-flowchart.git
cd rpa-flowchart
npm install
```

### Start

```bash
npm run dev
```

Aabn [http://localhost:3000](http://localhost:3000) i din browser.

### Konfigurer AI

1. Klik paa tandhjulsikonet i editoren
2. Vaelg AI-provider (Google Gemini anbefales til hurtig generering)
3. Indtast din API-noegle
4. Klik "Gem indstillinger"

## Brug

1. **Opret projekt** - Klik "+ Nyt projekt" paa dashboardet
2. **Tilfoej input** - Enten:
   - Skriv en procesbeskrivelse i tekstfeltet
   - Upload screenshots (PNG/JPG)
   - Upload en PowerPoint-fil (.pptx) - tekst og billeder udtraekkes automatisk
3. **Generer** - Klik "Generer flowchart med AI"
4. **Rediger** - Traek noder, rediger tekst, tilfoej nye noder fra paletten
5. **Eksporter** - Klik PNG eller PDF i toolbaren

## Nodetyper

| Type | Farve | Beskrivelse |
|------|-------|-------------|
| Procestrin | Blaa | Standard handling (login, klik, navigation) |
| Beslutning | Gul | Ja/nej-forgrening |
| Skift applikation | Lilla | Skift mellem systemer |
| Datainput | Groen | Indtastning eller kopiering af data |
| Bloker | Roed | Problem der kraever menneskelig handling |
| Start/Slut | Graa | Processens graenser |

## Projektstruktur

```
src/
├── app/                    # Next.js App Router
│   ├── api/                # API-endpoints (generate, upload, import-pptx, projects, settings)
│   ├── projects/[id]/      # Flowchart-editor side
│   └── page.tsx            # Dashboard
├── components/
│   ├── NodeTypes/          # 6 custom React Flow node-komponenter
│   ├── Sidebar/            # Node-palette + properties-panel
│   ├── FlowchartEditor.tsx # Hoved-editor med React Flow
│   ├── SwimlaneBackgrounds.tsx
│   ├── ColorLegend.tsx
│   └── ...
├── lib/
│   ├── ai/                 # Multi-provider AI-integration
│   │   ├── claude.ts       # Anthropic Claude
│   │   ├── gemini.ts       # Google Gemini
│   │   ├── azure-openai.ts # Azure OpenAI
│   │   └── prompt.ts       # Faelles system-prompt
│   ├── layout.ts           # Swimlane-layout algoritme
│   ├── pptx-parser.ts      # PowerPoint-import via JSZip
│   ├── db.ts               # SQLite database
│   └── types.ts            # TypeScript interfaces
└── hooks/
    └── useUndoRedo.ts      # Undo/redo stack
```

## Licens

MIT
