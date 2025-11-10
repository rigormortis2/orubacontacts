# Contact Matching System

A modular frontend application for matching raw contact data with hospitals and assigning contact persons.

## Directory Structure

```
frontend/matching/
├── index.html          # Main HTML entry point
├── css/
│   └── styles.css      # All application styles
└── js/
    ├── config.js       # Configuration constants
    ├── api.js          # API service layer
    ├── timer.js        # 5-minute lock timer
    ├── state.js        # Application state management
    ├── ui.js           # UI rendering and DOM manipulation
    └── app.js          # Main application orchestration
```

## Key Features

### 1. 5-Minute Lock Timer
- **Automatic countdown from 5:00 to 0:00**
- Visual color coding:
  - Green: > 2 minutes remaining
  - Yellow: 1-2 minutes remaining
  - Red: < 1 minute remaining
  - Blinking: < 30 seconds remaining
- **Auto-reload on expiry** - Page automatically reloads when timer reaches 0:00
- Timer resets when new record is loaded
- Displayed prominently in header

### 2. Modular Architecture

#### config.js
- API endpoint configuration
- Timer thresholds and timeouts
- Local storage keys
- UI constants (debounce times, search limits)

#### api.js
- Centralized API service layer
- RESTful endpoint methods:
  - `getNextUnmatched(username)` - Fetch next record
  - `assignContact(data)` - Create contact person
  - `completeMatching(rawDataId, username)` - Mark as complete
  - `releaseLock(rawDataId, username)` - Release lock
  - `getJobTitles()` - Fetch job titles
  - `getHospitals(search)` - Search hospitals
  - `getMatchingStats()` - Get statistics

#### timer.js
- `LockTimer` class with methods:
  - `start(onExpire)` - Start 5-minute countdown
  - `stop()` - Stop timer
  - `reset()` - Restart timer
  - `getTimeRemaining()` - Get seconds remaining
  - `updateDisplay()` - Update UI every second
- Automatic page reload on expiry

#### state.js
- `AppState` class managing:
  - Current username
  - Current raw data record
  - Job titles list
  - Hospitals list
  - Statistics
  - Phones and emails
  - Contact forms state
- Event-driven architecture with listeners

#### ui.js
- `UIManager` class with rendering methods:
  - `renderStats(stats)` - Statistics dashboard
  - `renderMatchingCard(rawData)` - Main card display
  - `renderPhoneList(phones)` - Phone numbers list
  - `renderEmailList(emails)` - Email addresses list
  - `showAlert(message, type)` - Toast notifications
  - `showModal(title, content)` - Modal dialogs
  - `showUsernameModal(onSubmit)` - Username input
  - `showLoading(message)` - Loading overlay

#### app.js
- Main application orchestration
- Workflow management:
  1. Check for saved username
  2. Show username modal if needed
  3. Load statistics and reference data
  4. Load next unmatched record
  5. Start lock timer
  6. Handle user interactions
- Event listeners for all user actions

### 3. User Interface

#### Statistics Dashboard
- Total records count
- Matched records count
- Unmatched records count
- Locked records count
- Progress bar with percentage

#### Main Layout
- **Left Panel**: Phone numbers and email addresses
- **Right Panel**: Matching card with contact forms

#### Contact Forms
- Expandable contact person forms
- Fields:
  - First Name (required)
  - Last Name (optional)
  - Job Title dropdown (required)
  - Hospital search dropdown (required)
  - Notes textarea (optional)
- Add/remove contact persons dynamically
- Maximum 5 contact persons per record

#### Action Buttons
- **Add Contact Person** - Add new contact form
- **Complete Matching** - Save all contacts and mark complete
- **Release Lock & Exit** - Release current lock and reload

### 4. Workflow

1. **Initial Load**
   - User enters username (stored in localStorage)
   - System loads statistics and reference data
   - Next unmatched record is fetched and locked

2. **Record Display**
   - Trello card title and description shown
   - Associated phones and emails displayed
   - 5-minute timer starts

3. **Contact Assignment**
   - User adds contact person forms
   - Fills in required information
   - Selects job title from dropdown
   - Searches and selects hospital

4. **Completion**
   - Click "Complete Matching"
   - System validates all required fields
   - Saves all contact persons
   - Marks record as matched
   - Loads next record

5. **Lock Release**
   - User can release lock without completing
   - Record becomes available for others
   - Page reloads

6. **Timer Expiry**
   - At 0:00, page automatically reloads
   - Lock is automatically released
   - User must start fresh session

## Technical Details

### ES6 Modules
- All JavaScript uses ES6 module syntax
- Clean imports/exports between modules
- No global namespace pollution

### State Management
- Centralized state in `AppState` class
- Event-driven updates
- Listeners for reactive UI updates

### API Communication
- RESTful JSON API
- Async/await for all requests
- Centralized error handling
- Loading states during operations

### Responsive Design
- Mobile-first CSS approach
- Flexbox and Grid layouts
- Breakpoints: 1024px, 768px, 480px
- Touch-friendly UI elements

### Browser Compatibility
- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES6+ features required
- CSS Grid and Flexbox
- Fetch API for HTTP requests

## Configuration

### API Endpoint
Edit `/js/config.js` to change API base URL:
```javascript
API_BASE_URL: 'http://localhost:3000/api'
```

### Timer Duration
Default: 5 minutes (300,000 milliseconds)
```javascript
LOCK_TIMEOUT_MS: 5 * 60 * 1000
```

### Warning Thresholds
```javascript
WARNING_THRESHOLD: 120,  // 2 minutes - yellow
DANGER_THRESHOLD: 60,    // 1 minute - red
BLINK_THRESHOLD: 30      // 30 seconds - blinking
```

## Usage

### Development
1. Ensure backend API is running on `http://localhost:3000`
2. Open `index.html` in a modern browser
3. Or use a local server:
   ```bash
   # Using Python
   python3 -m http.server 8080

   # Using Node.js
   npx http-server -p 8080
   ```
4. Navigate to `http://localhost:8080/matching/`

### Production
1. Update `API_BASE_URL` in `config.js` to production endpoint
2. Deploy to web server (Nginx, Apache, etc.)
3. Ensure CORS is configured on backend API

## Security Considerations

- Username stored in localStorage (not secure for production)
- Consider implementing proper authentication
- Add CSRF tokens for state-changing operations
- Validate all input on backend
- Sanitize HTML output (currently using `escapeHtml()`)

## Browser Requirements

- ES6 Modules support
- Fetch API
- Async/Await
- CSS Grid and Flexbox
- LocalStorage API
- Modern JavaScript (2015+)

## Future Enhancements

- [ ] User authentication with JWT tokens
- [ ] Keyboard shortcuts for faster workflow
- [ ] Bulk operations support
- [ ] Advanced search and filtering
- [ ] Export matched data
- [ ] Audit trail and history
- [ ] Collaborative matching indicators
- [ ] Custom timer duration per user
- [ ] Offline support with Service Workers
- [ ] Dark mode theme

## Troubleshooting

### Timer not displaying
- Check browser console for errors
- Ensure `timer.js` is loaded
- Verify timer element ID matches (`lock-timer`)

### API errors
- Check backend server is running
- Verify API_BASE_URL in `config.js`
- Check browser network tab for failed requests
- Ensure CORS is properly configured

### Page doesn't reload on timer expiry
- Check for JavaScript errors in console
- Verify `location.reload()` isn't blocked
- Test in different browser

### Contact forms not saving
- Validate all required fields are filled
- Check API responses in network tab
- Verify backend endpoints are working

## License

Proprietary - Oruba Contacts Management System

## Support

For issues or questions, contact the development team.
