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
