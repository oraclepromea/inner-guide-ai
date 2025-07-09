import { useEffect } from 'react';
import { useAppStore } from './stores';
import { JournalTab } from './components/JournalTab.tsx';
import { MoodTab } from './components/MoodTab.tsx';
import { Analytics } from './components/Analytics.tsx';
import { SettingsTab } from './components/SettingsTab.tsx';
import { Header } from './components/Header.tsx';
import { TabNavigation } from './components/TabNavigation.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { NotificationProvider } from './components/NotificationSystem';
import './App.css';

function App() {
  const { activeTab, setActiveTab, loadJournalEntries, loadMoodEntries } = useAppStore();

  useEffect(() => {
    loadJournalEntries();
    loadMoodEntries();
  }, [loadJournalEntries, loadMoodEntries]);

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'journal':
        return <JournalTab />;
      case 'mood':
        return <MoodTab />;
      case 'analytics':
        return <Analytics />;
      case 'settings':
        return <SettingsTab />;
      default:
        return <JournalTab />;
    }
  };

  return (
    <ErrorBoundary>
      <NotificationProvider>
        <div className="min-h-screen">
          <Header />
          <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
          <main className="max-w-6xl mx-auto px-6 py-8">
            <div className="animate-fade-in">
              {renderActiveTab()}
            </div>
          </main>
        </div>
      </NotificationProvider>
    </ErrorBoundary>
  );
}

export default App;
