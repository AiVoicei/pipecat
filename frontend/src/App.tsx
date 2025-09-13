import { Logo } from '@/components/ui/Logo';
import { VoiceChat, ConnectionStatus, ConversationHistory, AudioVisualizer } from '@/components/voice';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { Menu, X, MessageSquare, Settings, BarChart3 } from 'lucide-react';
import { useVoiceStore } from '@/stores/voiceStore';

function App() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'history' | 'settings'>('chat');

  // Get real conversation messages from voice store
  const { messages: conversationMessages } = useVoiceStore();

  // Enable dark mode and RTL support
  useEffect(() => {
    document.documentElement.classList.add('dark');
    document.documentElement.setAttribute('dir', 'rtl');
    document.documentElement.setAttribute('lang', 'he');
  }, []);


  const renderMobileContent = () => {
    switch (activeTab) {
      case 'chat':
        return (
          <div className="space-y-6">
            <Card className="ai-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-card-foreground hebrew">שיחה קולית</h2>
              </div>
              <VoiceChat />
            </Card>
          </div>
        );
      case 'history':
        return (
          <ConversationHistory
            messages={conversationMessages}
            maxHeight="calc(100vh - 200px)"
            showTimestamps={true}
            showMetadata={false}
          />
        );
      case 'settings':
        return (
          <Card className="ai-card p-6">
            <h2 className="text-lg font-semibold text-card-foreground mb-6 hebrew">הגדרות</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-border">
                <span className="text-sm font-medium hebrew">מצב כהה</span>
                <div className="w-10 h-6 bg-primary rounded-full relative">
                  <div className="w-4 h-4 bg-white rounded-full absolute top-1 left-1"></div>
                </div>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-border">
                <span className="text-sm font-medium hebrew">התראות קוליות</span>
                <div className="w-10 h-6 bg-muted rounded-full relative">
                  <div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1"></div>
                </div>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-sm font-medium hebrew">איכות שמע</span>
                <span className="text-sm text-muted-foreground">גבוהה</span>
              </div>
            </div>
          </Card>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="md:hidden border-b border-border bg-card/50 backdrop-blur sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Logo size="sm" showText={false} className="w-8 h-8" />
            <div>
              <h1 className="text-base font-semibold text-foreground hebrew">AI Voicei</h1>
              <p className="text-xs text-muted-foreground hebrew">עוזר קולי חכם</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ConnectionStatus />
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </header>

      {/* Desktop Header */}
      <header className="hidden md:block border-b border-border bg-card/50 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Logo size="sm" showText={false} className="w-10 h-10" />
              <div>
                <h1 className="text-xl font-semibold text-foreground hebrew">AI Voicei</h1>
                <p className="text-sm text-muted-foreground hebrew">עוזר קולי חכם בעברית</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <ConnectionStatus />
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Tab Navigation */}
      <nav className="md:hidden bg-card/30 border-b border-border sticky top-[73px] z-40">
        <div className="flex">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
              activeTab === 'chat'
                ? 'text-primary bg-primary/10 border-b-2 border-primary'
                : 'text-muted-foreground hover:text-card-foreground'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span className="hebrew">שיחה</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
              activeTab === 'history'
                ? 'text-primary bg-primary/10 border-b-2 border-primary'
                : 'text-muted-foreground hover:text-card-foreground'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span className="hebrew">היסטוריה</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
              activeTab === 'settings'
                ? 'text-primary bg-primary/10 border-b-2 border-primary'
                : 'text-muted-foreground hover:text-card-foreground'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span className="hebrew">הגדרות</span>
          </button>
        </div>
      </nav>

      {/* Mobile Content */}
      <main className="md:hidden container mx-auto px-4 py-6">
        <div className="ai-fade-in">
          {renderMobileContent()}
        </div>
      </main>

      {/* Desktop Content */}
      <main className="hidden md:block container mx-auto px-6 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Desktop Dashboard Grid */}
          <div className="grid gap-6 lg:grid-cols-4 mb-8">

            {/* Main Voice Chat Card */}
            <div className="lg:col-span-2 order-2 lg:order-1">
              <Card className="ai-card p-6 h-full min-h-[500px]">
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-card-foreground hebrew">שיחה קולית</h2>
                    <AudioVisualizer isActive={false} variant="bars" className="opacity-50" />
                  </div>
                  <div className="flex-1">
                    <VoiceChat />
                  </div>
                </div>
              </Card>
            </div>

            {/* Conversation History */}
            <div className="lg:col-span-2 order-1 lg:order-2">
              <ConversationHistory
                messages={conversationMessages}
                maxHeight="500px"
                showTimestamps={true}
                showMetadata={false}
                className="h-full"
              />
            </div>
          </div>

          {/* Info Cards Row */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card className="ai-card p-4">
              <h3 className="text-sm font-medium text-card-foreground mb-3 hebrew">מידע מהיר</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">מצב שרת</span>
                  <span className="status-connected px-2 py-1 rounded text-xs">פעיל</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">שפה</span>
                  <span className="text-card-foreground">עברית</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">AI מודל</span>
                  <span className="text-card-foreground">Gemini</span>
                </div>
              </div>
            </Card>

            <Card className="ai-card p-4">
              <h3 className="text-sm font-medium text-card-foreground mb-3 hebrew">איך להשתמש</h3>
              <div className="space-y-3 text-xs">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium text-[10px]">
                    1
                  </div>
                  <span className="text-muted-foreground leading-relaxed hebrew">לחץ על כפתור התחל שיחה</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium text-[10px]">
                    2
                  </div>
                  <span className="text-muted-foreground leading-relaxed hebrew">דבר באופן טבעי בעברית</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium text-[10px]">
                    3
                  </div>
                  <span className="text-muted-foreground leading-relaxed hebrew">קבל תשובות חכמות ומהירות</span>
                </div>
              </div>
            </Card>

            <Card className="ai-card p-4">
              <h3 className="text-sm font-medium text-card-foreground mb-2 hebrew">זיהוי קול מתקדם</h3>
              <p className="text-xs text-muted-foreground hebrew">טכנולוגיה מתקדמת לזיהוי דיבור בעברית</p>
              <div className="mt-3 flex justify-center">
                <AudioVisualizer isActive={true} variant="circle" className="scale-50" />
              </div>
            </Card>

            <Card className="ai-card p-4">
              <h3 className="text-sm font-medium text-card-foreground mb-2 hebrew">תשובות חכמות</h3>
              <p className="text-xs text-muted-foreground hebrew">מודל Gemini AI עם הבנה מעמיקה בעברית</p>
              <div className="mt-3">
                <AudioVisualizer isActive={true} variant="waveform" className="scale-75 opacity-60" />
              </div>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/30 backdrop-blur mt-8 md:mt-16">
        <div className="container mx-auto px-4 md:px-6 py-6">
          <div className="text-center text-muted-foreground text-sm">
            <p className="hebrew">© 2024 AI Voicei. כל הזכויות שמורות.</p>
            <p className="mt-2 text-xs">מופעל על ידי Pipecat AI Framework</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
