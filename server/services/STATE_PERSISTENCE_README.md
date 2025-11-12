# Automation State Persistence

## Overview

The automation state persistence feature ensures that the Instagram Comment Automation system can resume its operation after a server restart. This is critical for production deployments where the server may restart due to updates, crashes, or platform maintenance.

## Implementation

### Storage Service Methods

#### `saveAutomationState(automationState)`

Saves the current automation state to the configuration file.

**Parameters:**
- `automationState.isActive` (boolean): Whether automation is currently running
- `automationState.lastCheckTime` (Date): Last time comments were checked
- `automationState.stats` (Object): Statistics about automation performance
  - `commentsDetected` (number): Total comments detected
  - `repliesGenerated` (number): Total replies generated
  - `repliesPosted` (number): Total replies posted
  - `errorCount` (number): Total errors encountered

**Storage Format:**
```json
{
  "instagram": { ... },
  "replyTone": "friendly",
  "automation": {
    "isActive": true,
    "lastCheckTime": "2025-11-11T10:30:00.000Z",
    "stats": {
      "commentsDetected": 10,
      "repliesGenerated": 9,
      "repliesPosted": 8,
      "errorCount": 1
    },
    "pollIntervalSeconds": 30
  }
}
```

#### `loadAutomationState()`

Loads the automation state from the configuration file.

**Returns:**
- `Object` with automation state, or `null` if no state exists

### AutomationWorkflow Methods

#### `persistState()`

Private method that saves the current workflow state to storage. Called automatically when:
- Automation is started
- Automation is stopped
- State changes occur

#### `restoreState()`

Restores the workflow state from storage on initialization.

**Returns:**
- `boolean`: `true` if automation was active and should resume, `false` otherwise

### Server Startup Behavior

On server startup, the system:

1. **Checks for saved state**: Reads the configuration file to see if automation was active
2. **Validates credentials**: Ensures Instagram credentials and Gemini API key are available
3. **Initializes services**: Sets up Instagram, AI, and workflow services
4. **Restores state**: Loads statistics and last check time
5. **Resumes automation**: If automation was active, automatically restarts it
6. **Logs resume**: Records the resume event in activity logs

### Error Handling

If state restoration fails (e.g., invalid credentials, API errors):
- The system logs the error
- Marks automation as inactive in storage
- Requires manual restart through the UI
- Preserves statistics for user review

## Usage

### Automatic Resume

No user action required. If automation was running when the server stopped, it will automatically resume on restart.

### Manual Control

Users can still manually start/stop automation through the UI, which will update the persisted state.

### Graceful Shutdown

The system handles `SIGTERM` and `SIGINT` signals to:
- Stop automation gracefully
- Persist final state
- Clean up resources

## Testing

Run the state persistence test:

```bash
node server/services/test-state-persistence.js
```

This test verifies:
- State saving functionality
- State loading functionality
- State integrity after save/load cycle
- State updates
- Null state handling

## Benefits

1. **Continuity**: Automation continues after server restarts
2. **Statistics Preservation**: Performance metrics are maintained across restarts
3. **User Experience**: No need to manually restart automation after deployments
4. **Production Ready**: Handles platform restarts on Render, Railway, Fly.io, etc.

## Requirements Satisfied

This implementation satisfies **Requirement 8.5**:
> "THE Automation System SHALL persist the automation state across application restarts"

The system ensures that:
- Automation state is saved when started/stopped
- State is restored on server startup
- Automation resumes if it was active before restart
- Statistics are preserved across restarts
