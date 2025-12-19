# Developer Guide for ESS SITE V3

This guide is designed to help you understand, modify, and extend the codebase.

## 🏗️ Project Architecture

### Tech Stack
- **Framework**: React 18 + Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Framer Motion (animations)
- **Backend**: Supabase (Database/Auth) + Node.js Admin Server (File handling)
- **State Management**: Context API (`AppContext`) + Zustand

### Folder Structure Map

```
src/
├── assets/            # Static images imported in code
├── components/        # UI Components
│   ├── admin/         # Admin-specific components (Dashboard, Modals)
│   ├── common/        # Shared components (ErrorBoundary, Buttons)
│   └── layout/        # Global layout (Navbar, Footer, Loading)
├── context/           # Global State (User session, Data loading)
├── data/              # Static Typescript data/constants
├── hooks/             # Custom React Hooks (logic reuse)
├── pages/             # Full page views (Home, Booking, Admin)
├── services/          # Backend communication (Supabase, Local Storage)
├── types/             # TypeScript Interfaces (Data models)
└── utils/             # Helper functions (QR Code, Formatting)

public/
└── galerie/           # Dynamic content images and content.json
```

---

## 🚀 How to Modify the Project

### 1. Adding a New Page
1.  Create a new component in `src/pages/` (e.g., `NewPage.tsx`).
2.  Open `src/App.tsx`.
3.  Import your new page.
4.  Add a `<Route path="/new-page" element={<NewPage />} />` inside the `<Routes>` block.

### 2. Modifying the Navigation Menu
*   **Navbar**: Open `src/components/layout/Navbar.tsx`. The menu links are likely defined in a list or mapped from an array.
*   **Footer**: Open `src/components/layout/Footer.tsx`.

### 3. Changing Colors & Theme
*   The project uses **Tailwind CSS**.
*   Global styles are in `src/index.css`.
*   Theme configuration (custom colors, fonts) is in `tailwind.config.js`.

### 4. Updating Data (Spaces, Events)
*   **Public Data**: Stored in `public/galerie/content.json`. You can edit this file directly for quick changes, or use the **Admin Dashboard**.
*   **Database Data**: User accounts and reservations are stored in **Supabase**.

### 5. Backend Logic
*   **Supabase**: Logic for Auth and Database is in `src/services/supabaseClient.ts`.
*   **Admin Server**: The Node.js server that writes to `content.json` and handles image uploads is in `scripts/adminServer.js`.

---

## 🛠️ Key Commands

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the React Frontend (localhost:5173) |
| `npm run admin` | Starts the Admin API Server (localhost:8080) |
| `npm run build` | Builds the project for production |
| `npm run preview` | Previews the production build |

## ⚠️ Important Notes
*   **Admin Server**: If you are editing spaces or uploading images via the Admin UI, you **must** have `npm run admin` running in a separate terminal.
*   **Environment Variables**: Ensure your `.env` file contains the correct Supabase keys (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).

## 🔍 Troubleshooting
*   **"Network Error" in Admin**: Check if the Admin Server is running (`npm run admin`).
*   **Images not loading**: Ensure the `public/galerie` folder exists and contains images.
*   **Login not working**: Check Supabase credentials in `.env`.
