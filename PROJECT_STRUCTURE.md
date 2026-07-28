# Project Structure

Complete file structure for the Gym Subscription Management System.

```
cn/
├── README.md                          # Main documentation
├── SETUP_INSTRUCTIONS.md              # Detailed setup guide
├── PROJECT_STRUCTURE.md               # This file
├── package.json                       # Root package.json for scripts
├── .gitignore                         # Git ignore rules
│
├── server/                            # Backend application
│   ├── package.json                   # Server dependencies
│   ├── .env.example                   # Environment variable template
│   ├── jest.config.js                 # Jest test configuration
│   │
│   ├── prisma/
│   │   └── schema.prisma              # Database schema
│   │
│   └── src/
│       ├── index.js                   # Server entry point
│       │
│       ├── controllers/               # Route controllers
│       │   ├── auth.controller.js     # Authentication logic
│       │   ├── user.controller.js     # User management
│       │   ├── plan.controller.js     # Subscription plans
│       │   ├── subscription.controller.js  # Subscription logic
│       │   ├── payment.controller.js  # Payment processing
│       │   └── admin.controller.js    # Admin operations
│       │
│       ├── middleware/                # Custom middleware
│       │   ├── auth.middleware.js     # JWT authentication
│       │   ├── error.middleware.js    # Error handling
│       │   └── validation.middleware.js # Input validation
│       │
│       ├── routes/                    # API routes
│       │   ├── auth.routes.js         # Auth endpoints
│       │   ├── user.routes.js         # User endpoints
│       │   ├── plan.routes.js         # Plan endpoints
│       │   ├── subscription.routes.js # Subscription endpoints
│       │   ├── payment.routes.js      # Payment endpoints
│       │   └── admin.routes.js        # Admin endpoints
│       │
│       ├── prisma/
│       │   └── seed.js                # Database seeding script
│       │
│       └── __tests__/                 # Test files
│           └── auth.test.js           # Authentication tests
│
└── client/                            # Frontend application
    ├── package.json                   # Client dependencies
    ├── vite.config.js                 # Vite configuration
    ├── tailwind.config.js             # Tailwind CSS config
    ├── postcss.config.js              # PostCSS config
    ├── index.html                     # HTML entry point
    ├── .env.example                   # Environment variable template
    │
    └── src/
        ├── main.jsx                   # React entry point
        ├── App.jsx                    # Root component
        ├── index.css                  # Global styles
        │
        ├── components/                # Reusable components
        │   ├── Layout.jsx             # Main layout with navigation
        │   ├── ProtectedRoute.jsx     # Route protection
        │   ├── AdminRoute.jsx         # Admin route protection
        │   └── LoadingSpinner.jsx     # Loading indicator
        │
        ├── context/                   # React context
        │   └── AuthContext.jsx        # Authentication context
        │
        ├── services/                  # API services
        │   └── api.js                 # Axios configuration and API calls
        │
        ├── pages/                     # Page components
        │   ├── Login.jsx              # Login page
        │   ├── Register.jsx           # Registration page
        │   ├── Dashboard.jsx          # User dashboard
        │   ├── Plans.jsx              # Browse and purchase plans
        │   ├── MySubscription.jsx     # User subscription details
        │   ├── Profile.jsx            # User profile management
        │   │
        │   └── admin/                 # Admin pages
        │       ├── AdminDashboard.jsx # Admin overview
        │       ├── AdminUsers.jsx     # User management
        │       ├── AdminSubscriptions.jsx # Subscription management
        │       ├── AdminPayments.jsx  # Payment tracking
        │       └── AdminPlans.jsx     # Plan management
        │
        └── hooks/                     # Custom React hooks (optional)
```

## Key Files Explained

### Backend

**index.js**
- Express server setup
- Middleware configuration
- Route registration
- Error handling

**prisma/schema.prisma**
- Database models (User, SubscriptionPlan, Subscription, Payment)
- Relationships and indexes
- Enums for types

**Controllers**
- Business logic separated from routes
- Database operations via Prisma
- Response formatting

**Middleware**
- JWT token verification
- Admin role checking
- Input validation
- Error handling

**Routes**
- Endpoint definitions
- Validation rules
- Controller mapping

### Frontend

**App.jsx**
- Route configuration
- Authentication provider wrapper
- Toast notifications setup

**AuthContext.jsx**
- Global authentication state
- Login/logout functions
- User data management

**api.js**
- Axios instance configuration
- JWT token injection
- Response/error interceptors
- API service functions

**Pages**
- User-facing pages (login, dashboard, plans, subscription)
- Admin pages (dashboard, users, subscriptions, payments, plans)
- Form handling and data display

**Components**
- Reusable UI components
- Layout and navigation
- Route protection

## Database Schema

### Tables
1. **users** - User accounts and profiles
2. **subscription_plans** - Available gym plans
3. **subscriptions** - User subscription records
4. **payments** - Payment transactions

### Relationships
- User → Subscriptions (one-to-many)
- User → Payments (one-to-many)
- SubscriptionPlan → Subscriptions (one-to-many)
- Subscription → Payments (one-to-many)

## API Endpoints

### Public Routes
- POST `/api/auth/register`
- POST `/api/auth/login`
- GET `/api/plans`

### Protected Routes (User)
- GET `/api/auth/me`
- GET `/api/users/profile`
- PUT `/api/users/profile`
- GET `/api/subscriptions/my-subscription`
- POST `/api/subscriptions/purchase`
- POST `/api/payments/create-payment-intent`

### Admin Routes
- GET `/api/admin/dashboard`
- GET `/api/admin/users`
- GET `/api/admin/subscriptions`
- GET `/api/admin/payments`
- POST `/api/plans` (create)
- PUT `/api/plans/:id` (update)
- DELETE `/api/plans/:id` (deactivate)

## Technology Stack

### Backend
- Node.js + Express
- PostgreSQL + Prisma ORM
- JWT authentication
- Stripe payment integration
- Bcrypt password hashing
- Express Validator

### Frontend
- React 18
- React Router v6
- Tailwind CSS
- Stripe React components
- Axios
- React Toastify

### Development
- Vite (build tool)
- Nodemon (server reload)
- Jest (testing)
- Concurrently (run multiple scripts)

## Environment Variables

### Server (.env)
- DATABASE_URL
- JWT_SECRET
- JWT_EXPIRES_IN
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET
- PORT
- NODE_ENV
- FRONTEND_URL

### Client (.env)
- VITE_API_URL
- VITE_STRIPE_PUBLIC_KEY

## Features Implemented

✅ User authentication (register, login, JWT)
✅ User profile management
✅ Subscription plan browsing
✅ Stripe payment integration
✅ Subscription purchase flow
✅ Active subscription tracking
✅ Admin dashboard with metrics
✅ User management (admin)
✅ Subscription tracking (admin)
✅ Payment history (admin)
✅ Plan management (admin)
✅ Responsive design
✅ Role-based access control
✅ Input validation
✅ Error handling
✅ Database relationships
✅ Payment status tracking
✅ Subscription expiry dates

## Development Workflow

1. Start PostgreSQL
2. Run migrations: `cd server && npx prisma migrate dev`
3. Seed database: `npm run seed`
4. Start dev servers: `npm run dev` (from root)
5. Access at http://localhost:5173

## Testing

- Authentication tests included
- Run: `cd server && npm test`
- Covers registration, login, token validation

## Deployment Considerations

- Use production environment variables
- Build frontend: `cd client && npm run build`
- Serve static files from Express
- Set up Stripe webhook endpoint
- Use HTTPS in production
- Configure CORS properly
- Use connection pooling for database
- Implement rate limiting
- Add monitoring and logging
