# Gym Subscription Management System

A complete production-ready gym subscription management application built with React, Node.js, Express, and PostgreSQL.

## Features

- 🔐 User authentication and authorization
- 👥 User profile management
- 💳 Subscription plan management
- 💰 Stripe payment integration
- 📊 Admin dashboard with analytics
- 📱 Responsive design
- 🔍 Search and filter capabilities

## Tech Stack

### Frontend
- React 18
- React Router v6
- Tailwind CSS
- Axios
- React Query

### Backend
- Node.js
- Express
- PostgreSQL
- Prisma ORM
- JWT Authentication
- Stripe Payment Integration
- Bcrypt for password hashing

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- Stripe account for payment processing

## Installation

1. Clone the repository
```bash
git clone <repository-url>
cd cn
```

2. Install dependencies
```bash
npm run install:all
```

3. Set up environment variables

Create `.env` file in the `server` directory:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/gym_db"
JWT_SECRET="your-secret-key-here"
JWT_EXPIRES_IN="7d"
STRIPE_SECRET_KEY="your-stripe-secret-key"
STRIPE_WEBHOOK_SECRET="your-stripe-webhook-secret"
PORT=5000
NODE_ENV=development
```

Create `.env` file in the `client` directory:
```env
VITE_API_URL=http://localhost:5000/api
VITE_STRIPE_PUBLIC_KEY="your-stripe-public-key"
```

4. Set up the database
```bash
cd server
npx prisma migrate dev --name init
npx prisma generate
npm run seed
```

5. Run the application
```bash
# From root directory
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend: http://localhost:5000

## Default Admin Credentials

After seeding the database:
- Email: admin@gym.com
- Password: Admin123!

## Project Structure

```
cn/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   ├── context/       # React context
│   │   ├── hooks/         # Custom hooks
│   │   └── utils/         # Utility functions
│   └── package.json
├── server/                # Express backend
│   ├── src/
│   │   ├── controllers/  # Route controllers
│   │   ├── middleware/   # Custom middleware
│   │   ├── routes/       # API routes
│   │   ├── services/     # Business logic
│   │   ├── utils/        # Utility functions
│   │   └── prisma/       # Prisma schema
│   └── package.json
└── package.json
```

## API Documentation

### Authentication
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - User login
- GET `/api/auth/me` - Get current user

### Users
- GET `/api/users/profile` - Get user profile
- PUT `/api/users/profile` - Update user profile

### Subscription Plans
- GET `/api/plans` - Get all active plans
- POST `/api/plans` - Create plan (Admin only)
- PUT `/api/plans/:id` - Update plan (Admin only)
- DELETE `/api/plans/:id` - Delete plan (Admin only)

### Subscriptions
- GET `/api/subscriptions/my-subscription` - Get user's active subscription
- POST `/api/subscriptions/purchase` - Purchase subscription
- POST `/api/subscriptions/renew` - Renew subscription

### Payments
- POST `/api/payments/create-payment-intent` - Create Stripe payment intent
- POST `/api/payments/webhook` - Stripe webhook handler

### Admin
- GET `/api/admin/dashboard` - Get dashboard metrics
- GET `/api/admin/users` - Get all users
- GET `/api/admin/subscriptions` - Get all subscriptions
- GET `/api/admin/payments` - Get all payments

## Testing

```bash
cd server
npm test
```

## Deployment

### Database Migration
```bash
cd server
npx prisma migrate deploy
```

### Build Frontend
```bash
cd client
npm run build
```

### Environment Variables for Production
Update environment variables for production use with production database and Stripe keys.

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- Input validation
- SQL injection prevention (Prisma ORM)
- XSS protection
- CORS configuration

## License

ISC
