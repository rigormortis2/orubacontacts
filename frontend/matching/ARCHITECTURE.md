# Matching System Architecture

## Module Dependency Graph

```
index.html
    |
    +-- css/styles.css
    |
    +-- js/config.js (no dependencies)
    |
    +-- js/api.js
    |    └── depends on: config.js
    |
    +-- js/timer.js
    |    └── depends on: config.js
    |
    +-- js/state.js (no dependencies)
    |
    +-- js/ui.js
    |    └── depends on: config.js
    |
    +-- js/app.js (main orchestrator)
         └── depends on: config.js, api.js, timer.js, state.js, ui.js
```

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         USER ACTIONS                         │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                        app.js (Main)                         │
│  - Event Handlers                                            │
│  - Workflow Orchestration                                    │
│  - Business Logic                                            │
└──────┬──────────────┬──────────────┬──────────────┬─────────┘
       │              │              │              │
       ▼              ▼              ▼              ▼
┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐
│  api.js   │  │ timer.js  │  │ state.js  │  │  ui.js    │
│           │  │           │  │           │  │           │
│ HTTP      │  │ Timer     │  │ State     │  │ DOM       │
│ Requests  │  │ Countdown │  │ Store     │  │ Updates   │
└─────┬─────┘  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘
      │              │              │              │
      ▼              ▼              ▼              ▼
┌─────────────────────────────────────────────────────────────┐
│                     EXTERNAL SYSTEMS                         │
│  - Backend API          - Browser Timer                     │
│  - Database             - LocalStorage                      │
│  - Session Storage      - DOM Elements                      │
└─────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

### config.js (Configuration Layer)
**Purpose**: Central configuration management

**Exports**:
- `config` object with constants

**No Dependencies**

**Used By**: All other modules

---

### api.js (API Service Layer)
**Purpose**: Backend communication abstraction

**Key Methods**:
- `getNextUnmatched(username)` - Fetch next record
- `assignContact(data)` - Create contact
- `completeMatching(id, username)` - Mark complete
- `releaseLock(id, username)` - Release lock
- `getJobTitles()` - Fetch job titles
- `getHospitals(search)` - Search hospitals
- `getMatchingStats()` - Fetch statistics

**Dependencies**: config.js

**Used By**: app.js

---

### timer.js (Timer Management Layer)
**Purpose**: 5-minute countdown with auto-reload

**Key Class**: `LockTimer`

**Methods**:
- `start(onExpire)` - Start countdown
- `stop()` - Stop timer
- `reset()` - Restart timer
- `getTimeRemaining()` - Get seconds left
- `updateDisplay()` - Update UI every second
- `defaultExpireHandler()` - Auto-reload page

**Dependencies**: config.js

**Used By**: app.js

**Critical Behavior**: Automatically calls `location.reload()` at 0:00

---

### state.js (State Management Layer)
**Purpose**: Centralized application state

**Key Class**: `AppState`

**State Properties**:
- `username` - Current user
- `currentRawData` - Active record
- `jobTitles` - Job titles list
- `hospitals` - Hospitals list
- `phones` - Phone numbers
- `emails` - Email addresses
- `contactForms` - Form states

**Event System**:
- `on(event, callback)` - Subscribe
- `off(event, callback)` - Unsubscribe
- `emit(event, data)` - Publish

**No External Dependencies**

**Used By**: app.js

---

### ui.js (UI Rendering Layer)
**Purpose**: DOM manipulation and rendering

**Key Class**: `UIManager`

**Rendering Methods**:
- `renderStats(stats)` - Statistics cards
- `renderMatchingCard(rawData)` - Main card
- `renderPhoneList(phones)` - Phone list
- `renderEmailList(emails)` - Email list
- `renderPhoneItem(phone)` - Single phone
- `renderEmailItem(email)` - Single email

**UI Controls**:
- `showAlert(message, type)` - Toast notifications
- `showModal(title, content)` - Modal dialogs
- `showUsernameModal(onSubmit)` - Username input
- `showLoading(message)` - Loading overlay
- `hideLoading()` - Hide loading
- `showEmptyState()` - No records state

**Utilities**:
- `escapeHtml(text)` - XSS prevention
- `populateJobTitles()` - Fill dropdown
- `populateHospitals()` - Fill dropdown

**Dependencies**: config.js

**Used By**: app.js

---

### app.js (Application Orchestration Layer)
**Purpose**: Main application logic and workflow

**Key Class**: `MatchingApp`

**Initialization Flow**:
1. Check for saved username
2. Show username modal if needed
3. Load statistics
4. Load job titles
5. Load hospitals
6. Fetch next unmatched record
7. Start lock timer

**Core Methods**:
- `init()` - Bootstrap application
- `startMatching()` - Begin workflow
- `loadNextRecord()` - Fetch and display record
- `completeMatching()` - Save and finish
- `releaseLock()` - Exit without saving
- `addContactForm()` - Add contact form
- `createContactForm(id)` - Build form DOM

**Event Handling**:
- Add contact button
- Complete matching button
- Release lock button
- Form input changes
- Hospital search

**Dependencies**: config.js, api.js, timer.js, state.js, ui.js

---

## Sequence Diagrams

### 1. Application Startup

```
User          App           UI            API          State        Timer
 |             |             |             |             |            |
 |-- Open ---->|             |             |             |            |
 |             |-- Check Username -------->|             |            |
 |             |<-- No Username ----------|             |            |
 |             |-- Show Modal ----------->|             |            |
 |<----------- Username Input ------------|             |            |
 |-- Enter --->|                          |             |            |
 |             |-- Save ------------------------------------>|         |
 |             |-- Load Stats ----------->|             |            |
 |             |<-- Stats ---------------|             |            |
 |             |-- Render Stats --------->|             |            |
 |             |-- Load Job Titles ------>|             |            |
 |             |<-- Job Titles ----------|             |            |
 |             |-- Set Job Titles ------------------------>|         |
 |             |-- Load Next Record ----->|             |            |
 |             |<-- Raw Data ------------|             |            |
 |             |-- Set Raw Data ---------------------------->|        |
 |             |-- Render Card ---------->|             |            |
 |             |-- Start Timer ---------------------------------->|   |
 |             |<-- Timer Running -----------------------------|   |
 |<----------- Page Ready --------------|             |            |
```

### 2. Complete Matching Flow

```
User          App           UI            API          State        Timer
 |             |             |             |             |            |
 |-- Click Complete -------->|             |             |            |
 |             |-- Validate --------------------------->|            |
 |             |<-- Forms Valid ----------------------|            |
 |             |-- Show Loading -------->|             |            |
 |             |                         |             |            |
 |             |-- Loop Forms:           |             |            |
 |             |   Create Contact ------>|             |            |
 |             |<-- Contact Created ----|             |            |
 |             |                         |             |            |
 |             |-- Mark Complete -------->|             |            |
 |             |<-- Completed ----------|             |            |
 |             |-- Stop Timer ---------------------------------->|   |
 |             |-- Hide Loading -------->|             |            |
 |             |-- Show Success -------->|             |            |
 |             |-- Load Stats ---------->|             |            |
 |             |-- Load Next Record ---->|             |            |
 |             |-- Start Timer --------------------------------->|   |
 |<----------- Next Record Ready --------|             |            |
```

### 3. Timer Expiry Flow

```
Timer         App           UI            Browser
 |             |             |             |
 |-- Countdown |             |             |
 |-- 5:00      |             |             |
 |-- 4:59      |             |             |
 |-- ...       |             |             |
 |-- 2:00 ---->|-- Update Display ------->|             |
 |             |             |-- Yellow Warning ---->|
 |-- 1:00 ---->|-- Update Display ------->|             |
 |             |             |-- Red Danger -------->|
 |-- 0:30 ---->|-- Update Display ------->|             |
 |             |             |-- Blinking Red ------>|
 |-- 0:00 ---->|-- onExpire() |             |
 |             |-- Show Alert ----------->|             |
 |             |-- location.reload() ----------------------->|
 |             |             |             |-- Page Reload --->
```

## State Transitions

```
┌──────────────┐
│   NO USER    │
└──────┬───────┘
       │ Enter Username
       ▼
┌──────────────┐
│ USER LOGGED  │
└──────┬───────┘
       │ Load Data
       ▼
┌──────────────┐     Load Next
│ RECORD READY │◄────────────┐
└──────┬───────┘             │
       │                     │
       │ Start Timer         │
       ▼                     │
┌──────────────┐             │
│ TIMER ACTIVE │             │
└──┬───────┬───┘             │
   │       │                 │
   │       │ Timer Expires   │
   │       └─────────────────┤
   │                         │
   │ Complete Matching       │
   └─────────────────────────┘
```

## Timer State Machine

```
┌─────────┐
│ STOPPED │
└────┬────┘
     │ start()
     ▼
┌─────────────┐
│   RUNNING   │───────┐
│   (Green)   │       │ updateDisplay()
└────┬────────┘       │ every 1 second
     │               ◄┘
     │ < 2 min
     ▼
┌─────────────┐
│  WARNING    │
│  (Yellow)   │
└────┬────────┘
     │ < 1 min
     ▼
┌─────────────┐
│   DANGER    │
│   (Red)     │
└────┬────────┘
     │ < 30 sec
     ▼
┌─────────────┐
│   BLINK     │
│ (Red Flash) │
└────┬────────┘
     │ 0:00
     ▼
┌─────────────┐
│  EXPIRED    │──> location.reload()
└─────────────┘
```

## Error Handling Flow

```
API Error
   │
   ▼
api.js catches
   │
   ▼
Throws error with message
   │
   ▼
app.js try/catch
   │
   ▼
ui.showAlert(error, 'error')
   │
   ▼
Toast notification to user
   │
   ▼
Log to console
```

## Key Design Patterns

### 1. Module Pattern
Each file exports a singleton instance for shared state

### 2. Observer Pattern
State management with event listeners

### 3. Service Layer Pattern
API abstraction for backend communication

### 4. Singleton Pattern
One instance of each manager class

### 5. Factory Pattern
Creating contact form elements dynamically

## Performance Considerations

1. **Debounced Search**: Hospital search uses 300ms debounce
2. **Efficient DOM Updates**: Only update changed elements
3. **Event Delegation**: Where possible, use delegated events
4. **Lazy Loading**: Load data only when needed
5. **Minimal Reflows**: Batch DOM updates

## Security Considerations

1. **XSS Prevention**: All user input escaped via `escapeHtml()`
2. **No Eval**: No dynamic code execution
3. **CORS**: Backend must configure CORS properly
4. **Input Validation**: Required fields enforced
5. **LocalStorage**: Only username stored (not sensitive)

## Browser Support

- Chrome 60+
- Firefox 60+
- Safari 11+
- Edge 79+

Requires:
- ES6 Modules
- Fetch API
- Async/Await
- CSS Grid
- CSS Flexbox
