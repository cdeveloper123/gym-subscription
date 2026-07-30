const validator = require('validator');

class Validators {
  static validateEmail(email) {
    if (!email || typeof email !== 'string') {
      return { isValid: false, message: 'Email is required' };
    }

    if (!validator.isEmail(email)) {
      return { isValid: false, message: 'Invalid email format' };
    }

    return { isValid: true };
  }

  static validatePassword(password) {
    if (!password || typeof password !== 'string') {
      return { isValid: false, message: 'Password is required' };
    }

    if (password.length < 8) {
      return { isValid: false, message: 'Password must be at least 8 characters long' };
    }

    if (!/[A-Z]/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one uppercase letter' };
    }

    if (!/[a-z]/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one lowercase letter' };
    }

    if (!/[0-9]/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one number' };
    }

    if (!/[!@#$%^&*]/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one special character (!@#$%^&*)' };
    }

    return { isValid: true };
  }

  static validatePhone(phone) {
    if (!phone) {
      return { isValid: true }; // Phone is optional
    }

    if (typeof phone !== 'string') {
      return { isValid: false, message: 'Phone must be a string' };
    }

    if (!validator.isMobilePhone(phone, 'any', { strictMode: false })) {
      return { isValid: false, message: 'Invalid phone number format' };
    }

    return { isValid: true };
  }

  static validateName(name) {
    if (!name || typeof name !== 'string') {
      return { isValid: false, message: 'Name is required' };
    }

    if (name.trim().length < 2) {
      return { isValid: false, message: 'Name must be at least 2 characters long' };
    }

    if (name.trim().length > 100) {
      return { isValid: false, message: 'Name must not exceed 100 characters' };
    }

    return { isValid: true };
  }

  static validatePrice(price) {
    if (price === undefined || price === null) {
      return { isValid: false, message: 'Price is required' };
    }

    const numPrice = Number(price);

    if (isNaN(numPrice)) {
      return { isValid: false, message: 'Price must be a number' };
    }

    if (numPrice < 0) {
      return { isValid: false, message: 'Price must be a positive number' };
    }

    return { isValid: true };
  }

  static validateDuration(duration) {
    const validDurations = ['MONTHLY', 'QUARTERLY', 'YEARLY'];

    if (!duration) {
      return { isValid: false, message: 'Duration is required' };
    }

    if (!validDurations.includes(duration)) {
      return { isValid: false, message: `Duration must be one of: ${validDurations.join(', ')}` };
    }

    return { isValid: true };
  }

  static sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    return validator.escape(input.trim());
  }
}

module.exports = Validators;
