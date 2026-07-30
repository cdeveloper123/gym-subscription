const nodemailer = require('nodemailer');
const logger = require('./logger');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  async sendWelcomeEmail(user) {
    try {
      const mailOptions = {
        from: process.env.SMTP_FROM || 'noreply@gym.com',
        to: user.email,
        subject: 'Welcome to Our Gym!',
        html: `
          <h1>Welcome ${user.name}!</h1>
          <p>Thank you for joining our gym. We're excited to have you as a member.</p>
          <p>You can now browse our subscription plans and start your fitness journey.</p>
          <p>Best regards,<br>Gym Team</p>
        `
      };

      await this.transporter.sendMail(mailOptions);
      logger.info(`Welcome email sent to ${user.email}`);
    } catch (error) {
      logger.error('Error sending welcome email:', error);
    }
  }

  async sendSubscriptionConfirmation(user, subscription, plan) {
    try {
      const mailOptions = {
        from: process.env.SMTP_FROM || 'noreply@gym.com',
        to: user.email,
        subject: 'Subscription Confirmed',
        html: `
          <h1>Subscription Confirmed!</h1>
          <p>Hi ${user.name},</p>
          <p>Your subscription to <strong>${plan.name}</strong> has been confirmed.</p>
          <p><strong>Details:</strong></p>
          <ul>
            <li>Plan: ${plan.name}</li>
            <li>Duration: ${plan.duration}</li>
            <li>Price: $${plan.price}</li>
            <li>Start Date: ${new Date(subscription.startDate).toLocaleDateString()}</li>
            <li>End Date: ${new Date(subscription.endDate).toLocaleDateString()}</li>
          </ul>
          <p>Thank you for choosing us!</p>
          <p>Best regards,<br>Gym Team</p>
        `
      };

      await this.transporter.sendMail(mailOptions);
      logger.info(`Subscription confirmation email sent to ${user.email}`);
    } catch (error) {
      logger.error('Error sending subscription confirmation email:', error);
    }
  }

  async sendSubscriptionExpiring(user, subscription, plan) {
    try {
      const mailOptions = {
        from: process.env.SMTP_FROM || 'noreply@gym.com',
        to: user.email,
        subject: 'Your Subscription is Expiring Soon',
        html: `
          <h1>Subscription Expiring Soon</h1>
          <p>Hi ${user.name},</p>
          <p>Your <strong>${plan.name}</strong> subscription is expiring on ${new Date(subscription.endDate).toLocaleDateString()}.</p>
          <p>Don't let your fitness journey stop! Renew your subscription today to continue enjoying all the benefits.</p>
          <p>Best regards,<br>Gym Team</p>
        `
      };

      await this.transporter.sendMail(mailOptions);
      logger.info(`Subscription expiring email sent to ${user.email}`);
    } catch (error) {
      logger.error('Error sending subscription expiring email:', error);
    }
  }
}

module.exports = new EmailService();
