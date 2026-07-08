GrowEasy AI CSV Importer
An AI-powered CSV importer built for the GrowEasy Software Developer Assignment.
The application allows users to upload CSV files from different sources, preview the data, and convert messy lead information into a clean GrowEasy CRM format. The project is built as a single Next.js application with the frontend and backend API route inside the same app.
Assignment Goal
The goal of this assignment is not just to parse CSV files. The main challenge is to intelligently understand different CSV formats and map unknown column names into the required CRM fields.
For example, the app can handle CSV files from:
Facebook lead exports
Google Ads exports
Excel sheets
Real estate CRM exports
Sales reports
Marketing agency CSVs
Manually created spreadsheets
Tech Stack
Frontend: Next.js, React, JavaScript
Backend: Next.js API Route
CSV Preview: PapaParse
CSV Backend Parsing: csv-parse
AI Integration: OpenAI API
Styling: CSS
Icons: lucide-react
This project uses JavaScript, not TypeScript.

Features
Drag and drop CSV upload
File picker upload
CSV preview before import
Responsive preview table
Horizontal and vertical scrolling
Sticky table headers
Confirm button before backend processing
AI/fallback CRM field extraction
Imported records table
Skipped records table
Total imported and skipped count
Dark mode toggle
Single Next.js app, no separate Express server required
Project Structure
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
How It Works
The user uploads a CSV file.
The frontend parses the file locally and shows a preview table.
No AI/backend processing happens during preview.
The user clicks Confirm Import.
The CSV file is sent to the Next.js API route:
POST /api/import
The backend parses the CSV and processes records in batches.
If OPENAI_API_KEY is available, OpenAI maps the fields into GrowEasy CRM format.
If no API key is available, a JavaScript fallback mapper is used.
Rows without both email and mobile number are skipped.
The frontend displays imported and skipped records.
CRM Fields
The importer maps data into the following GrowEasy CRM fields:
created_at
name
email
country_code
mobile_without_country_code
company
city
state
country
lead_owner
crm_status
crm_note
data_source
possession_time
description
Allowed CRM Status Values
The app only allows these CRM status values:
GOOD_LEAD_FOLLOW_UP
DID_NOT_CONNECT
BAD_LEAD
SALE_DONE
Allowed Data Source Values
The app only allows these data source values:
leads_on_demand
meridian_tower
eden_park
varah_swamy
sarjapur_plots
If the source cannot be detected confidently, it is left blank.
AI Behavior
The AI is used to understand messy CSV columns and map them to CRM fields.
Example:
Full Name       -> name
Phone No        -> mobile_without_country_code
Mail ID         -> email
Lead Stage      -> crm_status
Remarks         -> crm_note
Project Name    -> data_source
The AI does not search the internet or create missing information. It only uses the uploaded CSV data.
If multiple emails or phone numbers are found:
The first email is used as email
Extra emails are added to crm_note
The first mobile number is used as mobile_without_country_code
Extra phone numbers are added to crm_note
Invalid Record Handling
A record is skipped if it has neither:
Email
Mobile number
Skipped records are shown separately with the reason.
Environment Variables
Create this file:
client/.env.local
Add:
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4.1-mini
BATCH_SIZE=25
If OPENAI_API_KEY is not provided, the app still works using the JavaScript fallback mapper.
Installation
Install dependencies from the root folder:
npm install
Run Locally
Start the development server:
npm run dev
Open the app:
http://localhost:3000
Build
Create a production build:
npm run build
API Endpoint
Import CSV
POST /api/import
Request type:
multipart/form-data
Form field:
file
Example response:
{
  "imported": [],
  "skipped": [],
  "summary": {
    "totalRows": 0,
    "totalImported": 0,
    "totalSkipped": 0
  }
}
Important Files
client/app/page.js
Main frontend UI for upload, preview, confirm import, and result display.

client/app/api/import/route.js
Backend API route that receives the CSV file.

client/lib/aiExtractor.js
Handles OpenAI extraction and fallback mapping.

client/lib/normalizer.js
Cleans and validates CRM records.

client/lib/csv.js
Parses CSV content on the backend.

Submission Checklist
Before submitting the assignment, include:
Hosted application URL
GitHub repository URL
Position applied for: Software Developer Intern or Software Developer Full-Time
