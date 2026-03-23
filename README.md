# Memory Dashboard — MKJ

Daily memory log and decision tracker. Searchable, filterable timeline of all discussions, decisions, and action items.

## Features

- Timeline view of daily log entries (newest first)
- Full-text search across all logs
- Filter by project tag (MKJ, CinqStay, DocuWrap, BespaarPilot, Trading, Longevity, ORAVIVUM, General)
- Filter by date range
- Expandable entry cards with decisions, action items, and participants
- Password protection
- API endpoint for programmatic entry creation
- Dark theme, mobile responsive

## API

### Add a new log entry

```bash
curl -X POST https://your-domain.vercel.app/api/logs \
  -H "Content-Type: application/json" \
  -H "x-password: YOUR_PASSWORD" \
  -d '{
    "date": "2026-03-23",
    "title": "My Log Entry",
    "summary": "What happened today...",
    "tags": ["General"],
    "decisions": ["Decision 1"],
    "actionItems": ["Action 1"],
    "participants": ["Marlon", "Chris"]
  }'
```

## Setup

```bash
npm install
npm run dev
```

Set `DASHBOARD_PASSWORD` environment variable for password protection.

## Tech Stack

- Next.js 14 (App Router)
- Tailwind CSS
- JSON file storage (no external database)
- Vercel deployment
