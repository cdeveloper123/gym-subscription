# MongoDB Setup Guide

This project uses MongoDB as the database.

## Prerequisites

- MongoDB 4.4+ or MongoDB 5.0+
- Node.js 16+

## Installation Steps

### 1. Install MongoDB

**macOS (using Homebrew):**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Ubuntu/Debian:**
```bash
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
```

**Windows:**
Download and install from [MongoDB Downloads](https://www.mongodb.com/try/download/community)

### 2. Verify MongoDB is Running

```bash
mongosh
# or
mongo
```

You should see the MongoDB shell prompt.

### 3. Configure Database Connection

1. Copy the example environment file:
```bash
cd server
cp .env.example .env
```

2. Update the MongoDB URI in `.env`:
```
MONGODB_URI=mongodb://localhost:27017/gym_db
```

For MongoDB Atlas (cloud):
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/gym_db
```

### 4. Start the Server

```bash
cd server
npm run dev
```

The server will automatically:
- Connect to MongoDB
- Create the database if it doesn't exist
- Seed sample data on first run

## Default Credentials

After the first server start, you can login with:

**Email:** user@gym.com  
**Password:** User123!

## Database Schema

### Collections

1. **users** - User accounts and profiles
   - email (unique, required)
   - password (hashed, required)
   - name (required)
   - phone (optional)
   - address (optional)
   - role (USER/ADMIN)
   - timestamps

2. **plans** - Subscription plans
   - name (required)
   - duration (MONTHLY/QUARTERLY/YEARLY)
   - price (required)
   - features (array)
   - isActive (boolean)
   - timestamps

3. **subscriptions** - User subscriptions
   - userId (ref: User)
   - planId (ref: Plan)
   - status (PENDING/ACTIVE/EXPIRED/CANCELLED)
   - startDate
   - endDate
   - stripeSubscriptionId
   - timestamps

4. **payments** - Payment transactions
   - userId (ref: User)
   - subscriptionId (ref: Subscription)
   - amount (required)
   - currency (default: USD)
   - status (PENDING/COMPLETED/FAILED/REFUNDED)
   - stripePaymentIntentId
   - paymentMethod
   - timestamps

## Useful MongoDB Commands

### View all databases
```bash
mongosh
show dbs
```

### Use gym database
```bash
use gym_db
```

### View collections
```bash
show collections
```

### Query users
```bash
db.users.find().pretty()
```

### Query plans
```bash
db.plans.find().pretty()
```

### Count documents
```bash
db.users.countDocuments()
db.plans.countDocuments()
```

### Clear all data (be careful!)
```bash
db.users.deleteMany({})
db.plans.deleteMany({})
db.subscriptions.deleteMany({})
db.payments.deleteMany({})
```

## Troubleshooting

### Connection Errors

If you see "Failed to connect to MongoDB":

1. **Check if MongoDB is running:**
```bash
# macOS
brew services list

# Ubuntu/Debian
sudo systemctl status mongod

# Windows
net start MongoDB
```

2. **Check MongoDB logs:**
```bash
# macOS
tail -f /usr/local/var/log/mongodb/mongo.log

# Ubuntu/Debian
sudo tail -f /var/log/mongodb/mongod.log
```

3. **Test connection manually:**
```bash
mongosh mongodb://localhost:27017/gym_db
```

### Port Already in Use

If port 27017 is already in use:

1. Find and kill the process:
```bash
lsof -i :27017
kill -9 <PID>
```

2. Or change the MongoDB port in `/etc/mongod.conf` and update `MONGODB_URI` in `.env`

### Authentication Issues

If using MongoDB with authentication:
```bash
MONGODB_URI=mongodb://username:password@localhost:27017/gym_db?authSource=admin
```

## MongoDB Atlas (Cloud Database)

To use MongoDB Atlas instead of local:

1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Create database user
4. Whitelist your IP address
5. Get connection string and update `.env`:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/gym_db?retryWrites=true&w=majority
```

## Backup & Restore

### Backup
```bash
mongodump --db gym_db --out ./backup
```

### Restore
```bash
mongorestore --db gym_db ./backup/gym_db
```

### Export to JSON
```bash
mongoexport --db gym_db --collection users --out users.json
```

### Import from JSON
```bash
mongoimport --db gym_db --collection users --file users.json
```

## Performance Tips

1. MongoDB automatically creates indexes for `_id` fields
2. Add custom indexes for frequently queried fields
3. Use `.explain()` to analyze query performance
4. Enable MongoDB profiling for slow queries

## Migration from MySQL

The app was migrated from MySQL to MongoDB with:
- ✅ Removed MySQL dependencies
- ✅ Added Mongoose ODM
- ✅ Created MongoDB models
- ✅ Updated all controllers
- ✅ Automatic data seeding
- ✅ Maintained same API interface
