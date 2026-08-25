# AMS - Academy Management System (SaaS)
## Multi-Tenant Complete Solution

### 🏗️ Architecture
- **Super Admin** - You (manage all academies)
- **Academy Owner** - Tuition/school owners (manage their academy)
- **Staff** - Teachers/Admins (limited access)
- **Public** - Students/Parents (no login, just pay fees)

### 🚀 Deploy Steps
1. Create Supabase project (free)
2. Run SQL schema from `database_schema.sql`
3. Update `SUPABASE_URL` and `SUPABASE_KEY` in `ams_saas_core.js`
4. Deploy to Vercel/Netlify
5. Done!

### 🔗 URLs
- **Admin Login:** /#login
- **Super Admin:** /#super-admin-login
- **Public Payment:** /?pay=1

### 💳 Payment Flow
1. Student visits public page
2. Enters academy code + name + phone
3. Sees fee details
4. Chooses payment method (Bank/JazzCash/Easypaisa)
5. Sees your account details
6. Makes payment, uploads proof
7. You verify from dashboard

### 👤 Bank Details
Edit in Owner Settings:
- Bank: Dubai Islamic Bank
- Account: Syed Muhammad Shaheer Ullah
- JazzCash/Easypaisa: Your numbers

### 📧 Email Setup
1. Create SendGrid account (free)
2. Get API key
3. Add to Vercel environment variables
4. Emails will work automatically

### 💰 Plans
- Free: 50 students
- Basic: 200 students - Rs 1,500/month
- Premium: Unlimited - Rs 3,500/month
