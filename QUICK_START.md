# Quick Start Guide

## 🚀 Application is Running!

### Access Points

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/health

### Default Login Credentials

#### Admin Account
```
Email: admin@gym.com
Password: Admin123!
```

#### Regular User Account
```
Email: user@gym.com
Password: User123!
```

### What You Can Do Now

#### As a Regular User:
1. **Login** at http://localhost:5173/login
2. **View Dashboard** - See your membership status
3. **Browse Plans** - View available subscription plans
4. **My Subscription** - View your active subscription (test user already has one)
5. **Update Profile** - Manage your personal information

#### As an Admin:
1. **Login** with admin credentials
2. **Admin Dashboard** - View key metrics:
   - Total users
   - Active/expired subscriptions
   - Revenue statistics
3. **Manage Users** - View and search all users
4. **Manage Subscriptions** - Track all subscriptions with filters
5. **View Payments** - Monitor all payment transactions
6. **Manage Plans** - Create, edit, and deactivate subscription plans

### Test Payment Flow

To test the payment functionality:

1. Login as a regular user (or create a new account)
2. Go to "Plans" page
3. Click "Select Plan" on any plan
4. Use Stripe test card:
   - Card Number: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., `12/34`)
   - CVC: Any 3 digits (e.g., `123`)
   - ZIP: Any 5 digits (e.g., `12345`)

**Note**: Payment processing creates a PENDING payment record. In production, webhooks would update this to COMPLETED. For local testing without webhooks, the subscription is activated immediately upon successful payment.

### Database Management

View and edit data using Prisma Studio:
```bash
cd server
npx prisma studio
```
This opens a web interface at http://localhost:5555

### Sample Data Included

The database has been seeded with:

**Users:**
- 1 Admin user
- 1 Regular user with an active subscription

**Subscription Plans:**
1. **Basic Plan** - $29.99/month
   - Access to gym equipment
   - Locker room access
   - Free Wi-Fi
   - Standard hours (6 AM - 10 PM)

2. **Standard Plan** - $79.99/quarter
   - All Basic Plan features
   - Group fitness classes
   - 1 personal training session per month
   - 24/7 gym access
   - Towel service

3. **Premium Plan** - $299.99/year
   - All Standard Plan features
   - Unlimited personal training
   - Nutrition consultation
   - Spa and sauna access
   - Guest passes (5 per month)
   - Priority class booking
   - Free parking

### API Testing

You can test the API endpoints using curl or Postman:

```bash
# Health check
curl http://localhost:5000/health

# Login (get JWT token)
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@gym.com","password":"Admin123!"}'

# Get current user (replace TOKEN with actual token)
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer TOKEN"

# Get all plans
curl http://localhost:5000/api/plans
```

### Stopping the Application

To stop the servers:
```bash
# Find the process IDs
ps aux | grep node

# Kill the processes
kill <PID>
```

Or press `Ctrl+C` in the terminal where you ran `npm run dev`.

### Restarting the Application

```bash
cd /Users/cgt/Documents/workspace/cn
npm run dev
```

### Troubleshooting

**Port Already in Use:**
```bash
# Kill process on port 5000 (server)
lsof -ti:5000 | xargs kill -9

# Kill process on port 5173 (client)
lsof -ti:5173 | xargs kill -9
```

**Database Connection Issues:**
```bash
# Check if PostgreSQL is running
pg_isready

# Restart PostgreSQL (macOS Homebrew)
brew services restart postgresql
```

**Need to Reset Database:**
```bash
cd server
npx prisma migrate reset
npm run seed
```

### Next Steps

1. Explore the application features
2. Test the payment flow with test cards
3. Check the admin dashboard
4. Review the code structure
5. Read the full documentation in README.md

### Development Tips

- Hot reload is enabled for both frontend and backend
- Make changes to any file and see them reflected immediately
- Check the terminal for any errors or logs
- Use Prisma Studio to inspect database records

### Need Help?

- Check SETUP_INSTRUCTIONS.md for detailed setup
- Review README.md for API documentation
- See PROJECT_STRUCTURE.md for code organization
- Read IMPLEMENTATION_SUMMARY.md for feature overview

Enjoy exploring the Gym Subscription Management System! 🎉
