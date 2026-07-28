# MongoDB Migration Guide

This project has been migrated from PostgreSQL/Prisma to MongoDB/Mongoose.

## Setup Instructions

### 1. Install MongoDB

**macOS (using Homebrew):**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Ubuntu/Debian:**
```bash
sudo apt-get install mongodb
sudo systemctl start mongodb
```

**Windows:**
Download and install from [MongoDB Official Website](https://www.mongodb.com/try/download/community)

### 2. Update Environment Variables

Update your `.env` file with the MongoDB connection string:

```env
DATABASE_URL="mongodb://localhost:27017/gym_db"
```

For MongoDB Atlas (cloud):
```env
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/gym_db?retryWrites=true&w=majority"
```

### 3. Install Dependencies

```bash
cd server
npm install
```

### 4. Seed the Database

```bash
npm run seed
```

This will create:
- Admin user: `admin@gym.com` / `Admin123!`
- Test user: `user@gym.com` / `User123!`
- Three subscription plans (Basic, Standard, Premium)

### 5. Start the Server

```bash
npm run dev
```

## Migration Changes

### Removed
- `@prisma/client` package
- `prisma` dev dependency
- `prisma/schema.prisma` file
- `src/lib/prisma.js`
- Prisma CLI commands

### Added
- `mongoose` package
- Mongoose models in `src/models/`:
  - `User.js`
  - `SubscriptionPlan.js`
  - `Subscription.js`
  - `Payment.js`
- `src/lib/db.js` - MongoDB connection
- `src/db/seed.js` - MongoDB seed script

### Updated Files
- All controllers converted to use Mongoose queries
- `src/middleware/auth.middleware.js` - Updated for Mongoose
- `src/index.js` - Connects to MongoDB on startup
- `package.json` - Updated scripts and dependencies
- `.env.example` - Updated with MongoDB connection string

## Key Differences

### ID Fields
- PostgreSQL used UUID strings
- MongoDB uses ObjectId
- All responses convert `_id` to `id` for API compatibility

### Queries
- Prisma: `findUnique()`, `findMany()`, `create()`
- Mongoose: `findById()`, `find()`, `create()`

### Relations
- Prisma: Automatic joins via `include`
- Mongoose: Manual `populate()` calls

### Timestamps
- Both automatically handle `createdAt` and `updatedAt`

## Verify Migration

Test the API endpoints:

```bash
# Register a new user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123!","name":"Test User"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@gym.com","password":"Admin123!"}'

# Get plans
curl http://localhost:5000/api/plans
```

## Troubleshooting

### Connection Issues
- Ensure MongoDB is running: `brew services list` (macOS) or `sudo systemctl status mongodb` (Linux)
- Check connection string in `.env`
- Verify network access if using MongoDB Atlas

### Seed Errors
- Drop the database: `mongosh gym_db --eval "db.dropDatabase()"`
- Run seed again: `npm run seed`

### Port Conflicts
- Change PORT in `.env` if 5000 is already in use
