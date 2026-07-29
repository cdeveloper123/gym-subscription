# Cron Jobs

This directory contains scheduled tasks (cron jobs) that run automatically at specified intervals.

## Current Jobs

### Hello Job
- **Schedule**: Every 2 hours (at minute 0 of every 2nd hour)
- **Cron Expression**: `0 */2 * * *`
- **Description**: Prints "hello" to the console
- **Timezone**: America/New_York

## Cron Expression Format

```
* * * * *
│ │ │ │ │
│ │ │ │ └── Day of week (0-7, 0 and 7 are Sunday)
│ │ │ └──── Month (1-12)
│ │ └────── Day of month (1-31)
│ └──────── Hour (0-23)
└────────── Minute (0-59)
```

## Common Examples

- `* * * * *` - Every minute
- `0 * * * *` - Every hour
- `0 */2 * * *` - Every 2 hours
- `0 0 * * *` - Every day at midnight
- `0 0 * * 0` - Every Sunday at midnight
- `0 9 * * 1-5` - Weekdays at 9 AM

## Adding New Cron Jobs

1. Open `cronJobs.js`
2. Create a new scheduled task:

```javascript
const myNewJob = cron.schedule('0 */6 * * *', () => {
  console.log('Running my new job');
  // Your job logic here
}, {
  scheduled: true,
  timezone: "America/New_York"
});
```

3. Add start/stop logic:

```javascript
const startCronJobs = () => {
  console.log('Starting cron jobs...');
  helloJob.start();
  myNewJob.start(); // Add this line
};

const stopCronJobs = () => {
  console.log('Stopping cron jobs...');
  helloJob.stop();
  myNewJob.stop(); // Add this line
};
```

## Testing Cron Jobs

To test a cron job immediately without waiting:

```javascript
// In cronJobs.js, temporarily change the schedule
const testJob = cron.schedule('* * * * *', () => {
  console.log('Test - runs every minute');
}, {
  scheduled: true
});
```

## Managing Cron Jobs

The cron jobs are automatically started when the server starts. They run in the background and don't block server operations.

To manually stop all cron jobs:
```javascript
const { stopCronJobs } = require('./jobs/cronJobs');
stopCronJobs();
```

## Production Notes

- Cron jobs continue running as long as the server is running
- If the server restarts, all cron jobs restart
- Consider using a process manager like PM2 for production deployments
- Monitor cron job logs to ensure they're executing as expected
