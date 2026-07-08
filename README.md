# GrowEasy AI CSV Importer

An AI-powered CSV importer built for the **GrowEasy Software Developer Assignment**.

The application allows users to upload CSV files from different sources, preview the data, and convert messy lead information into a clean GrowEasy CRM format. The project is built as a **single Next.js application** with the frontend and backend API route inside the same app.

## Assignment Goal

The goal of this assignment is not just to parse CSV files. The main challenge is to intelligently understand different CSV formats and map unknown column names into the required CRM fields.

For example, the app can handle CSV files from:

- Facebook lead exports
- Google Ads exports
- Excel sheets
- Real estate CRM exports
- Sales reports
- Marketing agency CSVs
- Manually created spreadsheets

## Tech Stack

- **Frontend:** Next.js, React, JavaScript
- **Backend:** Next.js API Route
- **CSV Preview:** PapaParse
- **CSV Backend Parsing:** csv-parse
- **AI Integration:** OpenAI API
- **Styling:** CSS
- **Icons:** lucide-react

> This project uses JavaScript, not TypeScript.

## Features

- Drag and drop CSV upload
- File picker upload
- CSV preview before import
- Responsive preview table
- Horizontal and vertical scrolling
- Sticky table headers
- Confirm button before backend processing
- AI/fallback CRM field extraction
- Imported records table
- Skipped records table
- Total imported and skipped count
- Dark mode toggle
- Single Next.js app, no separate Express server required

## Project Structure

```text
New project
├── client
│   ├── app
│   │   ├── api
│   │   │   └── import
│   │   │       └── route.js
│   │   ├── globals.css
│   │   ├── layout.js
│   │   └── page.js
│   ├── lib
│   │   ├── aiExtractor.js
│   │   ├── constants.js
│   │   ├── csv.js
│   │   └── normalizer.js
│   ├── package.json
│   └── next.config.js
├── package.json
├── package-lock.json
└── README.md
```

## How It Works

1. The user uploads a CSV file.
2. The frontend parses the file locally and shows a preview table.
3. No AI/backend processing happens during preview.
4. The user clicks **Confirm Import**.
5. The CSV file is sent to the Next.js API route:

```text
POST /api/import
```

6. The backend parses the CSV and processes records in batches.
7. If `OPENAI_API_KEY` is available, OpenAI maps the fields into GrowEasy CRM format.
8. If no API key is available, a JavaScript fallback mapper is used.
9. Rows without both email and mobile number are skipped.
10. The frontend displays imported and skipped records.

## CRM Fields

The importer maps data into the following GrowEasy CRM fields:

```text
created_at
name
email
country_code
mobile_without_country_code
