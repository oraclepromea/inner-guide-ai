<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Inner Guide AI - Copilot Instructions

## Project Overview
This is a React TypeScript application called "Inner Guide" - an AI-powered journal and mood tracking system with offline-first capabilities using IndexedDB for data storage.

## Key Technologies
- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with dark mode support
- **State Management**: Zustand
- **Database**: IndexedDB via Dexie.js
- **Icons**: Lucide React
- **Charts**: Recharts
- **Date Handling**: date-fns (if needed)

## Architecture Guidelines

### Component Structure
- Components are organized in `/src/components/`
- Each component is self-contained with proper TypeScript interfaces
- Use functional components with hooks
- Implement proper error handling and loading states

### Data Flow
- Global state managed via Zustand store (`/src/stores/index.ts`)
- All data persistence handled through IndexedDB
- Location detection via Geolocation API
- Moon phase calculation using astronomical algorithms

### Key Features
1. **Journal Tab**: Add, view, edit, delete journal entries with auto-detected location and moon phase
2. **AI Analysis**: Mock AI insights for sentiment, tone, and reflection prompts
3. **Mood Tracking**: 1-5 scale mood entries with notes and trend visualization
4. **Data Management**: Export/import functionality for backup and restore
5. **Offline Support**: All data stored locally in IndexedDB

### Code Style
- Use TypeScript interfaces for all data structures
- Implement proper error boundaries and loading states
- Follow React best practices for hooks and state management
- Use Tailwind CSS for styling with consistent color scheme
- Support both light and dark themes

### Security & Privacy
- All data stored locally - no external API calls except for location services
- Geolocation is optional and user-controlled
- AI analysis is currently mocked but can be extended with real AI APIs

## Development Notes
- The app is designed to work offline-first
- Location detection uses browser Geolocation API with fallback
- Moon phase calculation uses astronomical formulas
- All components are responsive and accessible