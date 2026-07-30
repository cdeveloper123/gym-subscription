class DateHelper {
  static addMonths(date, months) {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
  }

  static addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  static addYears(date, years) {
    const result = new Date(date);
    result.setFullYear(result.getFullYear() + years);
    return result;
  }

  static getSubscriptionEndDate(startDate, duration) {
    const start = new Date(startDate);

    switch (duration) {
      case 'MONTHLY':
        return this.addMonths(start, 1);
      case 'QUARTERLY':
        return this.addMonths(start, 3);
      case 'YEARLY':
        return this.addYears(start, 1);
      default:
        throw new Error('Invalid subscription duration');
    }
  }

  static isExpiringSoon(endDate, daysThreshold = 7) {
    const now = new Date();
    const end = new Date(endDate);
    const daysUntilExpiry = Math.ceil((end - now) / (1000 * 60 * 60 * 24));

    return daysUntilExpiry <= daysThreshold && daysUntilExpiry > 0;
  }

  static isExpired(endDate) {
    return new Date(endDate) < new Date();
  }

  static formatDate(date, format = 'YYYY-MM-DD') {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');

    return format
      .replace('YYYY', year)
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds);
  }

  static getDaysDifference(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffTime = Math.abs(d2 - d1);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  static isValidDate(date) {
    const d = new Date(date);
    return d instanceof Date && !isNaN(d);
  }

  static getStartOfDay(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  static getEndOfDay(date) {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
  }

  static isBetween(date, startDate, endDate) {
    const d = new Date(date);
    const start = new Date(startDate);
    const end = new Date(endDate);
    return d >= start && d <= end;
  }

  static getSubscriptionDuration(startDate, endDate) {
    const days = this.getDaysDifference(startDate, endDate);

    if (days <= 31) {
      return 'MONTHLY';
    } else if (days <= 93) {
      return 'QUARTERLY';
    } else {
      return 'YEARLY';
    }
  }
}

module.exports = DateHelper;
