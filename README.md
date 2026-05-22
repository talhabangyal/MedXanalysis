# Medical Report Analysis Portal

A full-stack application for uploading, managing, and analyzing medical reports. This platform connects clients, doctors, enterprises, and administrators, providing a seamless workflow for medical report analysis powered by AI and professional doctor reviews.

## 🚀 Tech Stack

### Frontend & Core Backend

- **Framework:** [Next.js](https://nextjs.org/) (React)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Authentication:** Passport.js, JWT, bcrypt
- **Database ORM:** [Prisma](https://www.prisma.io/)
- **Database:** PostgreSQL

### AI / Data Processing Service

- **Language:** Python
- **Environment:** Dedicated AI models for medical report analysis (`/model` directory)

## 📋 Key Features

- **Role-Based Access Control:** Secure portal with specific interfaces for `admin`, `client`, `doctor`, and `enterprise` users.
- **AI Report Analysis:** Upload medical reports to be automatically analyzed by the integrated AI service.
- **Doctor Verification:** Dedicated workflow for medical professionals to review and verify AI-analyzed reports.
- **Subscription Management:** Tiered subscription plans (monthly/yearly) with discount handling.
- **Notification & Activity Tracking:** Built-in system to track user activities and send real-time notifications.
- **Support System:** Integrated support ticketing to assist users with their queries.
- **WhatsApp Integration:** Option to forward analyzed reports directly to WhatsApp.

## 🛠️ Getting Started

### Prerequisites

- Node.js (v18+)
- Python 3.8+ (for AI model)
- PostgreSQL database

### 1. Web Application Setup

1. **Install Dependencies:**

   ```bash
   npm install
   ```

2. **Environment Variables:**
   Create a `.env` file in the root directory and add your database connection string and JWT secrets.

   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/med_db"
   # Add other required environment variables
   ```

3. **Database Migration & Seeding:**
   Run Prisma migrations to set up the database schema.

   ```bash
   npx prisma generate
   npx prisma db push
   npm run seed
   ```

4. **Run the Development Server:**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

### 2. AI Model Service Setup

1. Navigate to the model directory:

   ```bash
   cd model
   ```

2. Create a virtual environment and install requirements:

   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. Run the AI service:

   ```bash
   python app.py
   ```

## 📂 Project Structure

- `/src` - Next.js frontend pages, API routes, and components.
- `/prisma` - Prisma database schema (`schema.prisma`) and seed scripts.
- `/model` - Python backend for AI report analysis.
- `/public` - Static assets.

## 📝 License

This project is private and confidential.

## 🚀 Deployment (Vercel)

This project is compatible with Vercel, but a few deployment-specific environment variables and build steps are required.

- Recommended Vercel Environment Variables:
   - `DATABASE_URL` — Your Postgres connection string.
   - `BLOB_READ_WRITE_TOKEN` — (optional) Vercel Blob token to store uploaded files. If omitted, uploads fall back to `public/` during local runs only.
   - `ANALYSIS_SERVICE_URL` — (recommended for Vercel) URL of an external analysis service that performs Python-based report analysis. Required if you need AI analysis on Vercel because Vercel cannot spawn a local Python process.
   - `VERCEL` — Vercel sets this automatically (`1`) during builds.

- Build hooks and scripts:

   - The repository includes a `postinstall` script that runs `prisma generate` during install. Vercel will execute this during the build step by default.

   - Example `vercel.json` is included in the repository to document the expected env names and the Next build:

      - See `vercel.json` for a suggested configuration.

- Uploads and storage:

   - Serverless functions on Vercel cannot rely on a writable persistent filesystem. To persist uploads in production, set `BLOB_READ_WRITE_TOKEN` and the app will store files using Vercel Blob via `src/lib/upload-storage.ts`.
   - If you prefer S3, you can modify `src/lib/upload-storage.ts` to use AWS SDK as a fallback when `BLOB_READ_WRITE_TOKEN` is not present.

- Python analysis service:

   - The repository previously used a local Python spawn for report analysis. On Vercel, configure an external analysis service and set `ANALYSIS_SERVICE_URL` to point at it.
   - The admin API will forward the report URL (or local path during development) to the configured analysis service.

Quick deploy steps (local verification before pushing to Vercel):

```bash
# Install dependencies and generate Prisma client
npm install

# Run local dev server (uses local filesystem and python if available)
npm run dev

# Build locally to verify (this mirrors the Vercel build)
npm run build
```

Notes:

- If you want to keep using the built-in Python model during development, run the Python service in `model/` using a virtualenv and set `PYTHON_EXECUTABLE` locally if required.
- Ensure `node_modules/` is ignored in git (already configured in `.gitignore`).

If you want, I can add an example `ANALYSIS_SERVICE_URL` mock implementation or add S3 support for uploads. Let me know which you'd prefer.

## 🗄️ Supabase / Postgres Deployment

This project works with Postgres and is compatible with Supabase. Follow these steps to deploy using Supabase Postgres and (optionally) Supabase Storage:

1. Create a Supabase project and note the **Project URL** and **API keys** from the dashboard.

2. Set environment variables (locally in `.env` or in Vercel/other host):

```env
DATABASE_URL="<your-supabase-postgres-connection-string>"
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="<your-service-role-key>"
NEXT_PUBLIC_SUPABASE_ANON_KEY="<your-anon-key>"
```

Use the pooled connection string (often provided by Supabase) as `DATABASE_URL` for production. For Prisma migrations, you can also set `SHADOW_DATABASE_URL` if you use a separate shadow DB.

3. Enable required Postgres extensions (Supabase SQL editor → New Query). For example, to enable `pgcrypto` (used by `gen_random_uuid()` in the Prisma schema):

```sql
create extension if not exists "pgcrypto";
```

4. Generate Prisma client and apply schema:

```bash
npx prisma generate
npx prisma db push
# (optional) npx prisma migrate deploy
```

5. (Optional) Use Supabase Storage for uploads instead of Vercel Blob. If you prefer Supabase Storage:

- Create a storage bucket in the Supabase dashboard and generate a service role key.
- Update `src/lib/upload-storage.ts` to use the Supabase Storage SDK (`@supabase/supabase-js`) or configure the app to call an authenticated backend route that uploads to Supabase Storage using the service role key.

- The repository includes a server-side proxy endpoint for uploads:

   - `POST /api/supabase/upload` accepts `multipart/form-data` fields: `file` (required), `folder` (optional), and `filenameBase` (optional). It uploads the file to your Supabase Storage bucket using the service role key and returns the public URL in the response.

   - This proxy avoids exposing service-role credentials to the browser and is suitable for protected uploads.

6. Set the same environment variables in Vercel or your hosting provider before deploying.

Notes:

- Prisma in this repo is configured to use `DATABASE_URL` (see `prisma/schema.prisma`).
- Keep secrets out of source control — use platform environment variables for production.
