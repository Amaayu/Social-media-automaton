# Instagram Comment Automation - Frontend

React-based web interface for managing Instagram comment automation.

## Features

- **Configuration Panel**: Set up Instagram credentials, reply tone, and Gemini API key
- **Automation Control**: Start/stop automation with real-time status monitoring
- **Activity Log**: View and filter automation logs with pagination
- **Toast Notifications**: Global error handling and user feedback
- **Responsive Design**: Mobile and desktop optimized with TailwindCSS

## Project Structure

```
client/
├── src/
│   ├── components/          # React components
│   │   ├── ActivityLog.jsx
│   │   ├── AutomationControl.jsx
│   │   ├── ConfigurationPanel.jsx
│   │   ├── ErrorBoundary.jsx
│   │   ├── Toast.jsx
│   │   └── ToastContainer.jsx
│   ├── context/             # React context providers
│   │   └── AppContext.jsx
│   ├── hooks/               # Custom React hooks
│   │   └── useToast.js
│   ├── utils/               # Utility functions
│   │   └── api.js          # API client with axios
│   ├── App.jsx             # Main application component
│   ├── main.jsx            # Application entry point
│   └── index.css           # Global styles
├── public/                  # Static assets
├── dist/                    # Build output
└── package.json
```

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## API Integration

The frontend communicates with the backend API through the centralized API client (`src/utils/api.js`):

- **Configuration API**: Manage Instagram credentials and settings
- **Automation API**: Control automation start/stop and status
- **Logs API**: Fetch and export activity logs

## State Management

Global state is managed through React Context (`AppContext`):
- Automation status
- Toast notifications
- Shared API methods

## Styling

- **TailwindCSS**: Utility-first CSS framework
- **Responsive Design**: Mobile-first approach
- **Custom Animations**: Toast slide-in animations

## Error Handling

- **ErrorBoundary**: Catches React component errors
- **API Interceptors**: Global error handling for API calls
- **Toast Notifications**: User-friendly error messages
