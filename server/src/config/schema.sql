-- Create database if not exists
CREATE DATABASE IF NOT EXISTS gym_db;
USE gym_db;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  address TEXT,
  role ENUM('USER', 'ADMIN') DEFAULT 'USER',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role)
);

-- Plans table
CREATE TABLE IF NOT EXISTS plans (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  duration ENUM('MONTHLY', 'QUARTERLY', 'YEARLY') NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  features JSON,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_is_active (is_active)
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  plan_id VARCHAR(36) NOT NULL,
  status ENUM('PENDING', 'ACTIVE', 'EXPIRED', 'CANCELLED') DEFAULT 'PENDING',
  start_date TIMESTAMP NULL,
  end_date TIMESTAMP NULL,
  stripe_subscription_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE RESTRICT,
  INDEX idx_user_id (user_id),
  INDEX idx_plan_id (plan_id),
  INDEX idx_status (status),
  INDEX idx_stripe_subscription_id (stripe_subscription_id)
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  subscription_id VARCHAR(36) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status ENUM('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED') DEFAULT 'PENDING',
  stripe_payment_intent_id VARCHAR(255),
  payment_method VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_subscription_id (subscription_id),
  INDEX idx_status (status),
  INDEX idx_stripe_payment_intent_id (stripe_payment_intent_id)
);
