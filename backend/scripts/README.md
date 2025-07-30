# Database Management Scripts

This directory contains scripts for managing the CrusherMate database.

## Available Scripts

### Production Database Management

- `setup-production.js` - Set up production database with test data
- `clear-production.js` - Clear all data from production database
- `check-production.js` - Check current production database status

### Local Database Management

- `setup-local.js` - Set up local database with test data
- `clear-local.js` - Clear all data from local database
- `check-local.js` - Check current local database status

## Usage

```bash
# Set up production database
node scripts/setup-production.js

# Clear production database
node scripts/clear-production.js

# Check production database status
node scripts/check-production.js
```

## Database Structure

### Organizations
- Suresh's Crusher
- Raj's Crusher

### Users
- **Suresh's Crusher:**
  - Owner: suresh_owner (Suresh Kumar)
  - User: suresh_user (Ramesh Singh)
- **Raj's Crusher:**
  - Owner: raj_owner (Raj Sharma)
  - User: raj_user (Amit Patel)

### Material Rates
- **Suresh's Crusher:**
  - M-Sand: ₹1,200
  - P-Sand: ₹1,100
  - Blue Metal: ₹1,400
  - Raw Stone: ₹800
- **Raj's Crusher:**
  - M-Sand: ₹1,350
  - P-Sand: ₹1,250
  - Blue Metal: ₹1,550
  - Raw Stone: ₹950

### Login Credentials
All users have password: `password123`

## Notes

- Scripts should be run from the `backend` directory
- Always backup data before running clear scripts
- Production scripts use environment variables for database connection
- Local scripts use local MongoDB connection 