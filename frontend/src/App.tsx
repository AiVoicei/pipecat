import { Logo } from '@/components/ui/Logo';
import { VoiceChat, ConnectionStatus } from '@/components/voice';
import { Card } from '@/components/ui/card';
import { useEffect } from 'react';

function App() {
  // Enable dark mode by adding dark class to html element
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Logo size="sm" showText={false} className="w-10 h-10" />
              <div>
                <h1 className="text-xl font-semibold text-foreground hebrew">AI Voicei</h1>
                <p className="text-sm text-muted-foreground hebrew">עוזר קולי חכם בעברית</p>
              </div>
            </div>
            <div className="hidden md:block">
              <ConnectionStatus />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Dashboard Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
            
            {/* Main Voice Chat Card */}
            <div className="lg:col-span-2">
              <Card className="ai-card p-6 h-full">
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-card-foreground hebrew">שיחה קולית</h2>
                    <div className="md:hidden">
                      <ConnectionStatus />
                    </div>
                  </div>
                  <div className="flex-1">
                    <VoiceChat />
                  </div>
                </div>
              </Card>
            </div>

            {/* Status & Info Card */}
            <div className="space-y-6">
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
            </div>
          </div>

          {/* Additional Features Row */}
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="ai-card p-4">
              <h3 className="text-sm font-medium text-card-foreground mb-2 hebrew">זיהוי קול מתקדם</h3>
              <p className="text-xs text-muted-foreground hebrew">טכנולוגיה מתקדמת לזיהוי דיבור בעברית</p>
            </Card>
            
            <Card className="ai-card p-4">
              <h3 className="text-sm font-medium text-card-foreground mb-2 hebrew">תשובות חכמות</h3>
              <p className="text-xs text-muted-foreground hebrew">מודל Gemini AI עם הבנה מעמיקה בעברית</p>
            </Card>
            
            <Card className="ai-card p-4">
              <h3 className="text-sm font-medium text-card-foreground mb-2 hebrew">מהירות גבוהה</h3>
              <p className="text-xs text-muted-foreground hebrew">תגובה מיידית ואיכות שמע מעולה</p>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/30 backdrop-blur mt-16">
        <div className="container mx-auto px-6 py-6">
          <div className="text-center text-muted-foreground text-sm">
            <p className="hebrew">© 2024 AI Voicei. כל הזכויות שמורות.</p>
            <p className="mt-2">מופעל על ידי Pipecat AI Framework</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
