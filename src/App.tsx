import { useAppStore } from './stores';
import { JournalTab } from './components/JournalTab.tsx';
import { AIInsightsTab } from './components/AIInsightsTab.tsx';
import { Analytics } from './components/Analytics.tsx';
import { SettingsTab } from './components/SettingsTab.tsx';
import TherapyTab from './components/TherapyTab.tsx';
import { Header } from './components/Header.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { NotificationProvider } from './components/NotificationSystem';
import './App.css';

function App() {
  const { activeTab, setActiveTab } = useAppStore();

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'journal':
        return <JournalTab />;
      case 'ai-insights':
        return <AIInsightsTab />;
      case 'analytics':
        return <Analytics />;
      case 'therapy':
        return <TherapyTab />;
      case 'settings':
        return <SettingsTab />;
      default:
        return <JournalTab />;
    }
  };

  return (
    <ErrorBoundary>
      <NotificationProvider>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
          <Header activeTab={activeTab} onTabChange={setActiveTab} />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
