Linear Clone - AI-Powered Task Manager
A real-time task management dashboard inspired by Linear, featuring automated task categorization via Generative AI.

🚀 Live Demo
https://linear-clone-8asvygpns-sammy2904s-projects.vercel.app

✨ Key Features
AI Intelligence: Extracts task titles and assigns priorities (High, Medium, Low) using Google Gemini 1.5 Flash.
Real-time Sync: Instant data synchronization across clients using Supabase Realtime.
Secure Architecture: Uses Next.js Server Actions to keep API keys hidden from the browser.
Modern UI: Dark-mode aesthetic built with Tailwind CSS and Lucide Icons.
🛠️ Tech Stack
Framework: Next.js (App Router)
Database: Supabase (PostgreSQL)
AI: Google Generative AI SDK
Deployment: Vercel
⚙️ Local Setup
Clone the repo.
Create a .env.local file with your NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and GOOGLE_GENERATIVE_AI_API_KEY.
Run npm install and npm run dev.
