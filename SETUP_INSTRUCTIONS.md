# Setup Instructions

Follow these steps to set up and run the Gym Subscription Management System.

## Prerequisites

Ensure you have the following installed:
- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn

## Step 1: Clone and Install

```bash
# Navigate to project directory
cd cn

# Install all dependencies (root, server, and client)
npm run install:all
```

## Step 2: Set up PostgreSQL Database

1. Start PostgreSQL service
2. Create a database:

```sql
CREATE DATABASE gym_db;
```

3. Note your database credentials (username, password, host, port)

## Step 3: Configure Environment Variables

### Server Configuration

Create `/server/.env` file:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/gym_db"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="7d"
STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret"
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

**Important:** 
- Replace `username` and `password` with your PostgreSQL credentials
- Generate a strong random string for `JWT_SECRET`
- Get Stripe keys from https://dashboard.stripe.com/test/apikeys

### Client Configuration

Create `/client/.env` file:

```env
VITE_API_URL=http://localhost:5000/api
VITE_STRIPE_PUBLIC_KEY=pk_test_your_stripe_public_key
```

## Step 4: Database Setup

```bash
cd server

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init

# Seed the database with initial data
npm run seed
```

This will create:
- Admin user: admin@gym.com / Admin123!
- Test user: user@gym.com / User123!
- Three subscription plans (Basic, Standard, Premium)

## Step 5: Stripe Webhook Setup (Optional for Development)

For production or testing payment webhooks:

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Login to Stripe CLI:
   ```bash
   stripe login
   ```
3. Forward webhooks to your local server:
   ```bash
   stripe listen --forward-to localhost:5000/api/payments/webhook
   ```
4. Copy the webhook signing secret and update `STRIPE_WEBHOOK_SECRET` in `.env`

## Step 6: Run the Application

From the root directory:

```bash
# Run both server and client concurrently
npm run dev
```

Or run separately:

```bash
# Terminal 1 - Run server
cd server
npm run dev

# Terminal 2 - Run client
cd client
npm run dev
```

## Step 7: Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/health

## Step 8: Login

### Admin Access
- Email: admin@gym.com
- Password: Admin123!

### Regular User Access
- Email: user@gym.com
- Password: User123!

## Testing Payments

Use Stripe test cards:
- Success: 4242 4242 4242 4242
- Decline: 4000 0000 0000 0002
- Any future expiry date (e.g., 12/34)
- Any 3-digit CVC (e.g., 123)
- Any ZIP code (e.g., 12345)

More test cards: https://stripe.com/docs/testing

## Running Tests

```bash
cd server
npm test
```

## Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running
- Check DATABASE_URL in .env
- Ensure database exists

### Port Already in Use
- Change PORT in server/.env
- Update VITE_API_URL in client/.env

### Prisma Client Issues
```bash
cd server
npx prisma generate
```

### Module Not Found
```bash
# Reinstall dependencies
npm run install:all
```

## Production Deployment

1. Set `NODE_ENV=production`
2. Use production database URL
3. Use production Stripe keys
4. Build the frontend:
   ```bash
   cd client
   npm run build
   ```
5. Set up proper webhook endpoint in Stripe Dashboard
6. Use environment variables for all secrets
7. Enable HTTPS
8. Configure CORS for your production domain

## Database Management

View and edit data using Prisma Studio:
```bash
cd server
npx prisma studio
```

This opens a web interface at http://localhost:5555

## API Documentation

API endpoints are documented in the main README.md file.

## Support

For issues or questions:
- Check the main README.md
- Review error logs in the terminal
- Verify environment variables are set correctly
