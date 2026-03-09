# **App Name**: SupportLens

## Core Features:

- Secure User Authentication: Handle user registration, login, and logout processes, and protect application routes using Firebase Authentication.
- Support Ticket Creation & Management: Allow users to create new support tickets with detailed fields (ID, name, email, category, description, priority, status, date created) and view their submissions. Admins can view and update the status of all tickets.
- Comprehensive Ticket Data API: Implement Next.js API routes for full Create, Read, Update, Delete (CRUD) operations on support tickets, with data stored and managed in Firebase Firestore.
- Interactive Analytics Dashboard: Display key support performance indicators, including total, resolved, and pending tickets. Visualize trends and distributions through interactive pie, line, and bar charts for categories, priorities, and tickets over time.
- AI-Powered Ticket Insight Tool: An AI tool to automatically analyze and summarize ticket descriptions upon creation, providing quick insights and suggesting optimal categories or initial response actions to aid support agents.
- Modern & Responsive UI: Design and implement a consistent, responsive user interface using TailwindCSS, covering essential pages such as Login, Register, the main Dashboard, Create Ticket form, and a dedicated Ticket Management view.

## Style Guidelines:

- Primary color: A balanced, professional blue (#538CC6) symbolizing reliability and clarity for main elements and interactive components.
- Background color: A very light, desaturated blue (#F0F2F4) to provide a clean and calming canvas for data visualization and content.
- Accent color: A vibrant yet serene cyan (#4DDEE1) for highlights, calls-to-action, and to draw attention to important metrics on charts.
- Headline and Body text: 'Inter' (sans-serif), chosen for its modern, clean, and highly readable characteristics, optimizing data presentation and user comprehension.
- Utilize a consistent set of minimalist, line-art icons that complement the clean UI and enhance usability without overwhelming the user with visual noise.
- Implement a clear, grid-based layout for dashboards and data tables, prioritizing content readability and logical organization across all responsive breakpoints.
- Incorporate subtle, functional animations for UI transitions, loading states, and chart rendering to provide fluid user feedback and enhance engagement without distraction.