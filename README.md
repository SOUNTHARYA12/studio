
# SupportLens - Full-Stack Support Analytics Dashboard

SupportLens is a modern web-based analytics platform for managing customer support tickets with AI-powered insights.

## Features
- **Secure Authentication**: Firebase Email/Password login and registration.
- **Ticket Management**: Full CRUD operations for support tickets stored in Firestore.
- **Interactive Dashboard**: Real-time metrics and data visualization using Recharts.
- **AI Insights**: Automated ticket summarization and category suggestion.
- **Responsive Design**: Mobile-first UI built with TailwindCSS and Shadcn UI.

## Tech Stack
- **Frontend**: Next.js 15 (App Router), React 19, TailwindCSS, Lucide Icons.
- **Backend**: Next.js Server Actions, Firebase Admin SDK.
- **Database**: Firebase Firestore.
- **State Management**: Zustand.
- **Charts**: Recharts.

## Getting Started

### Prerequisites
- Node.js 18+
- A Firebase project

### Installation
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables in `.env.local`:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   GOOGLE_GENAI_API_KEY=your_gemini_api_key
   ```

### Running the App
```bash
npm run dev
```

The app will be available at `http://localhost:9002`.

## Testing APIs
Since this project uses Next.js Server Actions for most operations, testing is primarily done through the UI. However, standard REST endpoints can be added in `src/app/api` if needed for external tool integration.

## License
MIT
