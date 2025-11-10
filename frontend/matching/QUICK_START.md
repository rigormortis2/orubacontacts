# Quick Start Guide

## Starting the Matching System

### Option 1: Direct Browser (Simple)
```bash
# Navigate to the matching directory
cd /Users/fatihalkan/Documents/GitHub/orubacontacts/frontend/matching/

# Open in browser (macOS)
open index.html
```

### Option 2: Local Web Server (Recommended)

#### Using Python (built-in)
```bash
cd /Users/fatihalkan/Documents/GitHub/orubacontacts/frontend/matching/
python3 -m http.server 8080
```
Then open: http://localhost:8080/

#### Using Node.js http-server
```bash
cd /Users/fatihalkan/Documents/GitHub/orubacontacts/frontend/matching/
npx http-server -p 8080
```
Then open: http://localhost:8080/

### Option 3: From Frontend Root
```bash
cd /Users/fatihalkan/Documents/GitHub/orubacontacts/frontend/
python3 -m http.server 8080
```
Then open: http://localhost:8080/matching/

## Prerequisites

1. **Backend API Running**
   ```bash
   cd /Users/fatihalkan/Documents/GitHub/orubacontacts/backend/
   npm run dev
   ```
   Should be running on: http://localhost:3000

2. **Database Running**
   Ensure PostgreSQL is running with the orubacontacts database

## First Time Usage

1. Open the matching system in your browser
2. You'll see a modal asking for your username
3. Enter your name (e.g., "Fatih")
4. Click "Start Matching"
5. The system will:
   - Load statistics
   - Fetch the next unmatched record
   - Start the 5-minute timer
   - Display phones and emails

## Workflow Steps

### 1. Review the Record
- Read the Trello card title and description
- Check the phone numbers on the left
- Check the email addresses on the left

### 2. Add Contact Persons
- Click "Add Contact Person" button
- Fill in the form:
  - First Name (required)
  - Last Name (optional)
  - Job Title (required - select from dropdown)
  - Hospital (required - search and select)
  - Notes (optional)
- Add multiple contacts if needed (max 5)

### 3. Complete or Exit
- **Complete Matching**: Saves all contacts and moves to next record
- **Release Lock & Exit**: Releases the record without saving

### 4. Watch the Timer
- Timer counts down from 5:00 to 0:00
- Green: You have plenty of time
- Yellow: Less than 2 minutes left
- Red: Less than 1 minute left
- Blinking Red: Less than 30 seconds - hurry!
- **0:00: Page auto-reloads** - Your work is lost if not saved!

## Testing the Timer

To test the auto-reload feature:
1. Open the matching system
2. Enter a username
3. Wait for a record to load
4. Watch the timer in the header
5. It will count down from 5:00
6. At 0:00, the page will automatically reload

## Common Issues

### Issue: "Failed to start matching"
**Solution**: Check that the backend API is running on port 3000

### Issue: Timer not visible
**Solution**:
- Check browser console for errors
- Ensure all JS files are loaded
- Try refreshing the page

### Issue: No hospitals in dropdown
**Solution**:
- Backend needs hospital data
- Check API endpoint: http://localhost:3000/api/hospitals

### Issue: No job titles in dropdown
**Solution**:
- Backend needs job titles seeded
- Check API endpoint: http://localhost:3000/api/job-titles

### Issue: Page doesn't reload at 0:00
**Solution**:
- Check browser console for errors
- Try a different browser
- Disable any browser extensions that might block reloads

## API Endpoints Used

The system calls these backend endpoints:

- `GET /api/raw-datas/next-unmatched?username={name}` - Get next record
- `GET /api/raw-datas/stats` - Get statistics
- `GET /api/job-titles` - Get job titles list
- `GET /api/hospitals?search={term}` - Search hospitals
- `GET /api/raw-datas/{id}/phones` - Get phones for record
- `GET /api/raw-datas/{id}/emails` - Get emails for record
- `POST /api/contact-persons` - Create contact person
- `POST /api/raw-datas/{id}/complete` - Mark as matched
- `POST /api/raw-datas/{id}/release-lock` - Release lock

## File Paths

All paths are absolute from the matching directory:

```
/Users/fatihalkan/Documents/GitHub/orubacontacts/frontend/matching/
├── index.html
├── css/styles.css
└── js/
    ├── config.js
    ├── api.js
    ├── timer.js
    ├── state.js
    ├── ui.js
    └── app.js
```

## Modifying Configuration

Edit: `/Users/fatihalkan/Documents/GitHub/orubacontacts/frontend/matching/js/config.js`

```javascript
export const config = {
  // Change API URL
  API_BASE_URL: 'http://localhost:3000/api',

  // Change timer duration (in milliseconds)
  LOCK_TIMEOUT_MS: 5 * 60 * 1000,  // 5 minutes

  // Change warning thresholds (in seconds)
  WARNING_THRESHOLD: 120,  // 2 minutes
  DANGER_THRESHOLD: 60,    // 1 minute
  BLINK_THRESHOLD: 30      // 30 seconds
};
```

## Browser DevTools

Open browser console (F12) to see:
- Timer start messages
- API request logs
- State changes
- Error messages

## Next Steps

1. Test the timer functionality
2. Try adding multiple contact persons
3. Test the complete matching flow
4. Test releasing a lock
5. Try the hospital search
6. Watch the page auto-reload at timer expiry

## Need Help?

Check the main README.md for detailed documentation:
`/Users/fatihalkan/Documents/GitHub/orubacontacts/frontend/matching/README.md`
