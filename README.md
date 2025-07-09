# Inner Guide AI - Personal Journal & Mood Tracker

An AI-powered journaling and mood tracking application built with React, TypeScript, and modern web technologies. Inner Guide helps you reflect on your thoughts, analyze your emotions, and track your mood patterns over time.

## ✨ Features

### 📝 Journal Tab
- **Add Journal Entries**: Write your thoughts with automatic location detection and moon phase tracking
- **AI-Powered Insights**: Get sentiment analysis, tone detection, and reflection prompts
- **Location & Time Tracking**: Auto-detect your location with country flags and current moon phase
- **Entry Management**: View, edit, delete, and expand entries with a clean interface
- **Smart Analysis**: Mock AI provides insights into your writing patterns and emotional state

### 📊 Mood Tracking Tab
- **Daily Mood Logging**: Track your mood on a 1-5 scale with emoji indicators
- **Mood Visualization**: Interactive charts showing mood trends over time
- **Notes & Context**: Add optional notes to provide context for your mood entries
- **Mood Distribution**: See patterns in your emotional well-being with bar charts
- **Historical Data**: Review and manage your mood history

### 💾 Data Management
- **Offline-First**: All data stored locally using IndexedDB
- **Export/Import**: Backup and restore your data in JSON format
- **Privacy-Focused**: No external servers - your data stays on your device
- **Auto-Save**: Entries are saved automatically with timestamps

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd inner-guide-ai
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## 🛠️ Technology Stack

- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with dark mode support
- **State Management**: Zustand
- **Database**: IndexedDB via Dexie.js
- **Icons**: Lucide React
- **Charts**: Recharts for mood visualization
- **Location Services**: Browser Geolocation API

## 📱 Key Components

### Core Features
- **Journal Entries**: Add, view, and manage personal journal entries
- **Mood Tracking**: Log daily moods with visual trend analysis
- **AI Analysis**: Sentiment analysis and reflection prompts (mock implementation)
- **Location Detection**: Optional geolocation with country flag display
- **Moon Phase Tracking**: Automatic lunar phase calculation and display

### User Interface
- **Responsive Design**: Works on desktop and mobile devices
- **Dark Mode Support**: Automatic theme switching based on system preference
- **Intuitive Navigation**: Clean tab-based interface
- **Accessibility**: ARIA labels and keyboard navigation support

## 🔧 Development

### Project Structure
```
src/
├── components/          # React components
│   ├── JournalTab.tsx  # Journal functionality
│   ├── MoodTab.tsx     # Mood tracking
│   ├── Header.tsx      # App header with export/import
│   └── ...
├── stores/             # Zustand state management
├── lib/               # Database configuration
├── utils/             # Helper functions
├── types/             # TypeScript interfaces
└── App.tsx            # Main application component
```

### Key Features in Development
- **TypeScript**: Full type safety throughout the application
- **Error Handling**: Comprehensive error boundaries and loading states
- **Performance**: Optimized rendering with React best practices
- **Testing Ready**: Components structured for easy testing

## 🎯 Usage Guide

### Adding Journal Entries
1. Click the "Add new journal entry..." button
2. Write your thoughts in the text area
3. Click "Save Entry" - location and moon phase are detected automatically
4. View your entry with the expand/collapse functionality

### Getting AI Insights
1. Click the brain icon on any journal entry
2. Wait for the analysis to complete
3. View sentiment, tone, reflection prompts, and detected patterns
4. Use insights for self-reflection and personal growth

### Tracking Your Mood
1. Switch to the "Mood Tracker" tab
2. Select your current mood (1-5 scale)
3. Add optional notes about your mood
4. View trends in the automatically generated charts

### Data Management
- **Export**: Click the export button in the header to download your data
- **Import**: Click import to restore data from a backup file
- **Local Storage**: All data is stored securely in your browser

## 🔐 Privacy & Security

- **Local Storage**: All data stays on your device using IndexedDB
- **No External APIs**: Except for optional location services
- **No Tracking**: No analytics or user tracking
- **Data Ownership**: You have full control over your data

## 🚀 Future Enhancements

- **Real AI Integration**: Connect to OpenAI or other AI services
- **Advanced Analytics**: More detailed mood and journal analysis
- **Export Formats**: Support for CSV, PDF, and other formats
- **Sync Options**: Optional cloud sync for multiple devices
- **Themes**: Additional color themes and customization options

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues and enhancement requests.

---

**Built with ❤️ for personal growth and self-reflection**
