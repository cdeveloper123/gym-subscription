# MySQL Database Setup Guide

This project has been migrated from in-memory storage to MySQL database.

## Prerequisites

- MySQL Server 5.7+ or MySQL 8.0+
- Node.js 16+

## Installation Steps

### 1. Install MySQL

**macOS (using Homebrew):**
```bash
brew install mysql
brew services start mysql
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql
```

**Windows:**
Download and install from [MySQL Downloads](https://dev.mysql.com/downloads/installer/)

### 2. Secure MySQL Installation (Optional but Recommended)

```bash
sudo mysql_secure_installation
```

### 3. Configure Database Credentials

1. Copy the example environment file:
```bash
cd server
cp .env.example .env
```

2. Update the database credentials in `.env`:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=gym_db
```

### 4. Run Database Setup

```bash
cd server
npm run setup
```

This will:
- Create the `gym_db` database
- Create all necessary tables (users, plans, subscriptions, payments)
- Set up indexes for optimal performance

### 5. Start the Server

```bash
npm run dev
```

The server will automatically seed the database with:
- 3 sample subscription plans (Basic, Standard, Premium)
- 1 test user account

## Default Credentials

After the first server start, you can login with:

**Email:** user@gym.com  
**Password:** User123!

## Database Schema

### Tables

1. **users** - User accounts and profiles
2. **plans** - Subscription plans with pricing
3. **subscriptions** - User subscriptions to plans
4. **payments** - Payment transactions

### Relationships

- Users can have multiple subscriptions (1:N)
- Each subscription belongs to one plan (N:1)
- Each subscription can have multiple payments (1:N)
- Each payment belongs to one user and one subscription

## Manual Database Setup (Alternative)

If you prefer to set up the database manually:

1. Create the database:
```sql
CREATE DATABASE gym_db;
USE gym_db;
```

2. Run the schema file:
```bash
mysql -u root -p gym_db < server/src/config/schema.sql
```

## Troubleshooting

### Connection Errors

If you see "Failed to connect to database":

1. Verify MySQL is running:
```bash
# macOS
brew services list

# Ubuntu/Debian
sudo systemctl status mysql
```

2. Check your credentials in `.env`

3. Test connection manually:
```bash
mysql -u root -p
```

### Permission Issues

If you get access denied errors:

```bash
mysql -u root -p

# In MySQL prompt:
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'your_password';
FLUSH PRIVILEGES;
```

### Port Already in Use

If port 3306 is already in use, update `DB_HOST` in `.env`:
```
DB_HOST=localhost:3307
```

## Migration Notes

The following changes were made during migration:

- ✅ Removed MongoDB dependencies
- ✅ Removed in-memory storage system
- ✅ Added MySQL with mysql2 driver
- ✅ Updated all controllers to use SQL queries
- ✅ Created database schema with proper indexes
- ✅ Added database seeding functionality
- ✅ Updated environment configuration

## Performance Tips

1. The schema includes indexes on frequently queried columns
2. Connection pooling is configured (max 10 connections)
3. Use prepared statements (already implemented) to prevent SQL injection

## Backup & Restore

### Backup
```bash
mysqldump -u root -p gym_db > backup.sql
```

### Restore
```bash
mysql -u root -p gym_db < backup.sql
```
