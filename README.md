# 📚 Capitol Library Backend (Supabase PostgreSQL)

Backend API service for the Misamis Oriental Capitol Public Library Management System, powered by Node.js, Express, and **Supabase (PostgreSQL)**.

---

## 🚀 1. Database Setup (Supabase)

1. Go to [https://supabase.com](https://supabase.com) and create or open your project.
2. In your Supabase project dashboard, navigate to **SQL Editor** in the left sidebar.
3. Open the file [`schema.sql`](file:///c:/Users/X260/capitollibraryback/schema.sql) in this repository, copy all the SQL code, paste it into the Supabase SQL Editor, and click **Run**.
4. This creates all 4 tables with complete constraints, indexes, foreign keys, and RLS policies:
   - `users` (Admin, Staff, Patrons)
   - `books` (Full catalog, barcodes, accessions, weeding status)
   - `transactions` (Borrow & return records, due dates)
   - `announcements` (Library bulletins)

---

## 🔑 2. Keys & Environment Variables

Go to your Supabase project dashboard -> **Project Settings** -> **API** to copy your credentials.

Create a `.env` file in `capitollibraryback/` (or copy from `.env.example`):

```env
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
# Use service_role secret for backend API servers to allow administrative operations
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-secret-key
SUPABASE_KEY=your-supabase-anon-key

# JWT & Authentication
JWT_SECRET=capitol_library_management_system_secret_2026
GOOGLE_CLIENT_ID=537410929054-hccges6c28en60dkgl43llrqd875tp7p.apps.googleusercontent.com

# Server & Frontend URL
PORT=5000
FRONTEND_URL=https://capitollibraryfront.vercel.app

# Email Notifications (Brevo Primary Engine)
BREVO_API_KEY=your-brevo-api-key
BREVO_SENDER_NAME="Misamis Oriental Public Library"
BREVO_SENDER_EMAIL=misamisorientalcapitollib@gmail.com

# Email SMTP Fallback Settings
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
SMTP_FROM="Misamis Oriental Public Library <misamisorientalcapitollib@gmail.com>"

# Open Library
OPENLIBRARY_USER_AGENT=Capitol Library Management System/1.0 (misamisorientalcapitollib@gmail.com)
```

---

## 🌱 3. Seeding the Database

Once your Supabase keys are in `.env`, run the seeding scripts:

```bash
# 1. Seed Admin (admin / admin123) and Staff (staff / staff123)
npm run seed-users

# 2. Seed all Capitol Library books (over 80 real books from Misamis Oriental Library)
npm run seed-capitol

# 3. Seed library announcements and dashboard sample stats
npm run seed-dashboard

# 4. Optional: Seed sample patron
npm run seed-patron
```

---

## 🌐 4. How to Deploy to Render

1. Push `capitollibraryback` to a new GitHub repository (e.g., `capitollibraryback`).
2. Log in to [Render](https://render.com) and click **New +** -> **Web Service**.
3. Connect your GitHub repository `capitollibraryback`.
4. Configure the service settings:
   - **Name**: `capitollibraryback` (or your preferred name)
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Plan**: `Free`
5. Under **Environment Variables**, add:
   - `SUPABASE_URL`: `https://your-project-id.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY`: `your-service-role-key`
   - `SUPABASE_KEY`: `your-anon-key`
   - `JWT_SECRET`: `capitol_library_management_system_secret_2026`
   - `FRONTEND_URL`: `https://capitollibraryfront.vercel.app` (your frontend Vercel URL)
   - `GOOGLE_CLIENT_ID`: `537410929054-hccges6c28en60dkgl43llrqd875tp7p.apps.googleusercontent.com`
   - `BREVO_API_KEY`: `your-brevo-api-key`
   - `BREVO_SENDER_NAME`: `Misamis Oriental Public Library`
   - `BREVO_SENDER_EMAIL`: `misamisorientalcapitollib@gmail.com`
   - `SMTP_HOST`: `smtp.gmail.com`
   - `SMTP_PORT`: `587`
   - `SMTP_USER`: `misamisorientalcapitollib@gmail.com`
   - `SMTP_FROM`: `Misamis Oriental Public Library <misamisorientalcapitollib@gmail.com>`
   - `OPENLIBRARY_USER_AGENT`: `Capitol Library Management System/1.0 (misamisorientalcapitollib@gmail.com)`
6. Click **Deploy Web Service**.
7. Once deployed, copy your Render URL (e.g., `https://capitollibraryback.onrender.com`).
