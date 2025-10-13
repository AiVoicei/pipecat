'use client'

import { Logo } from '@/components/ui/Logo';
import { VoiceChat, ConnectionStatus, ConversationHistory } from '@/components/voice';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useEffect, useState } from 'react';
import { Menu, X, MessageSquare, Settings, BarChart3, Mic, Brain, Volume2, Zap } from 'lucide-react';
import { useVoiceStore } from '@/stores/voiceStore';
import { useAgentStore } from '@/stores/useAgentStore';

interface AiVoiceiInterfaceProps {
  agentId?: string;
  isQuickTest?: boolean;
}

export function AiVoiceiInterface({ agentId, isQuickTest = false }: AiVoiceiInterfaceProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'history' | 'settings'>('chat');
  const { isHebrew } = useLanguage();

  // Get real conversation messages from voice store
  const { messages: conversationMessages, isAssistantSpeaking } = useVoiceStore();

  // Get agent configuration to display provider info
  const { agents } = useAgentStore();
  const agent = agentId ? agents.find(a => a.id === agentId) : null;

  // Quick test mode always uses Gemini Live
  const config = isQuickTest
    ? { llm: { provider: 'gemini-live' } }
    : agent?.configuration;

  // Determine pipeline type
  const isRealtimePipeline = isQuickTest || (!config?.stt && !config?.llm && !config?.tts);
  const pipelineType = isRealtimePipeline ? 'realtime' : 'traditional';

  // Enable dark mode and language support
  useEffect(() => {
    document.documentElement.classList.add('dark');
    // Language context now manages dir and lang attributes
  }, []);


  const renderMobileContent = () => {
    switch (activeTab) {
      case 'chat':
        return (
          <div className="space-y-6">
            <Card className="ai-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-card-foreground">
                  {isHebrew ? 'שיחה קולית' : 'Voice Chat'}
                </h2>
              </div>
              <VoiceChat agentId={agentId} />
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
          <div className="space-y-6">
            {/* Provider Information Card (Mobile) */}
            <Card className="ai-card p-6">
              <h2 className="text-lg font-semibold text-card-foreground mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5" />
                {isHebrew ? 'ספקי AI בשימוש' : 'AI Providers in Use'}
              </h2>
              <div className="space-y-3">
                {isRealtimePipeline ? (
                  // Realtime Pipeline Display
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
                    <Zap className="w-5 h-5 text-purple-400" />
                    <div className="flex-1">
                      <div className="text-xs text-muted-foreground">{isHebrew ? 'צינור זמן-אמת' : 'Realtime Pipeline'}</div>
                      <div className="font-medium text-purple-400">
                        {config?.llm?.provider === 'gemini-live' && 'Gemini 2.0 Flash Live'}
                        {config?.llm?.provider === 'openai-realtime' && 'OpenAI Realtime'}
                        {!config?.llm?.provider && (isHebrew ? 'לא מוגדר' : 'Not configured')}
                      </div>
                    </div>
                  </div>
                ) : (
                  // Traditional Pipeline Display
                  <>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                      <Mic className="w-5 h-5 text-blue-400" />
                      <div className="flex-1">
                        <div className="text-xs text-muted-foreground">{isHebrew ? 'זיהוי דיבור (STT)' : 'Speech-to-Text (STT)'}</div>
                        <div className="font-medium text-blue-400">{config?.stt?.provider || (isHebrew ? 'לא מוגדר' : 'Not set')}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                      <Brain className="w-5 h-5 text-green-400" />
                      <div className="flex-1">
                        <div className="text-xs text-muted-foreground">{isHebrew ? 'מודל AI (LLM)' : 'AI Model (LLM)'}</div>
                        <div className="font-medium text-green-400">{config?.llm?.provider || (isHebrew ? 'לא מוגדר' : 'Not set')}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
                      <Volume2 className="w-5 h-5 text-purple-400" />
                      <div className="flex-1">
                        <div className="text-xs text-muted-foreground">{isHebrew ? 'סינתזת קול (TTS)' : 'Text-to-Speech (TTS)'}</div>
                        <div className="font-medium text-purple-400">{config?.tts?.provider || (isHebrew ? 'לא מוגדר' : 'Not set')}</div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </Card>

            {/* Other Settings */}
            <Card className="ai-card p-6">
              <h2 className="text-lg font-semibold text-card-foreground mb-6">{isHebrew ? 'הגדרות' : 'Settings'}</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <span className="text-sm font-medium">{isHebrew ? 'מצב כהה' : 'Dark Mode'}</span>
                  <div className="w-10 h-6 bg-primary rounded-full relative">
                    <div className="w-4 h-4 bg-white rounded-full absolute top-1 left-1"></div>
                  </div>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <span className="text-sm font-medium">{isHebrew ? 'התראות קוליות' : 'Voice Notifications'}</span>
                  <div className="w-10 h-6 bg-muted rounded-full relative">
                    <div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1"></div>
                  </div>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-sm font-medium">{isHebrew ? 'איכות שמע' : 'Audio Quality'}</span>
                  <span className="text-sm text-muted-foreground">{isHebrew ? 'גבוהה' : 'High'}</span>
                </div>
              </div>
            </Card>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-screen w-screen bg-background flex flex-col overflow-hidden">
      {/* Mobile Header */}
      <header className="md:hidden border-b border-border bg-card/50 backdrop-blur sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Logo size="sm" showText={false} className="w-8 h-8" />
            <div>
              <h1 className="text-base font-semibold text-foreground">AI Voicei</h1>
              <p className="text-xs text-muted-foreground">{isHebrew ? 'עוזר קולי חכם' : 'Smart Voice Assistant'}</p>
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
                <h1 className="text-xl font-semibold text-foreground">AI Voicei</h1>
                <p className="text-sm text-muted-foreground">{isHebrew ? 'עוזר קולי חכם בעברית' : 'Smart Voice Assistant in Hebrew'}</p>
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
            <span>{isHebrew ? 'שיחה' : 'Chat'}</span>
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
            <span>{isHebrew ? 'היסטוריה' : 'History'}</span>
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
            <span>{isHebrew ? 'הגדרות' : 'Settings'}</span>
          </button>
        </div>
      </nav>

      {/* Mobile Content */}
      <main className="md:hidden flex-1 overflow-y-auto overflow-x-hidden">
        <div className="container mx-auto px-4 py-6 ai-fade-in">
          {renderMobileContent()}
        </div>
      </main>

      {/* Desktop Content */}
      <main className="hidden md:block flex-1 overflow-y-auto overflow-x-hidden">
        <div className="container max-w-[110rem] mx-auto px-8 py-8">
          <div className="max-w-[105rem] mx-auto">
          {/* Desktop Dashboard Grid - Three Column Layout */}
          <div className="grid gap-6 lg:grid-cols-3 mb-8">

            {/* Main Voice Chat Card */}
            <div className="order-1 lg:order-1">
              <Card className="ai-card p-8 h-full min-h-[700px]">
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-card-foreground">{isHebrew ? 'משתמש' : 'User'}</h2>
                    <div className="w-8 h-6 flex items-center justify-center">
                      <div className="flex gap-1">
                        <div className="w-1 h-3 bg-[#6C2CCC]/30 rounded-full"></div>
                        <div className="w-1 h-4 bg-[#6C2CCC]/50 rounded-full"></div>
                        <div className="w-1 h-2 bg-[#6C2CCC]/30 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1">
                    <VoiceChat agentId={agentId} />
                  </div>
                </div>
              </Card>
            </div>

            {/* Conversation History */}
            <div className="order-2 lg:order-2">
              <ConversationHistory
                messages={conversationMessages}
                maxHeight="700px"
                showTimestamps={true}
                showMetadata={false}
                className="h-full"
              />
            </div>

            {/* Agent Section */}
            <div className="order-3 lg:order-3">
              <Card className="ai-card p-8 h-full min-h-[700px]">
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-card-foreground">{isHebrew ? 'סוכן' : 'Agent'}</h2>
                    <div className="w-8 h-6 flex items-center justify-center">
                      <div className="flex gap-1">
                        <div className="w-1 h-3 bg-[#6C2CCC]/30 rounded-full"></div>
                        <div className="w-1 h-4 bg-[#6C2CCC]/50 rounded-full"></div>
                        <div className="w-1 h-2 bg-[#6C2CCC]/30 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col items-center justify-center">
                    {/* Agent Video Placeholder - Beautiful Gradient Design */}
                    <div className={`relative w-full max-w-sm aspect-video rounded-2xl overflow-hidden mb-6 transition-all duration-700 ease-out ${
                      isAssistantSpeaking
                        ? 'shadow-[0_0_40px_rgba(108,44,204,0.4)] transform scale-105'
                        : 'shadow-[0_8px_32px_rgba(0,0,0,0.3)]'
                    }`}>
                      {/* Gradient Background */}
                      <div className={`absolute inset-0 transition-all duration-700 ${
                        isAssistantSpeaking
                          ? 'bg-gradient-to-br from-[#6C2CCC]/30 via-[#8A4FDB]/20 to-[#6C2CCC]/40'
                          : 'bg-gradient-to-br from-slate-800/50 via-slate-700/30 to-slate-800/50'
                      }`}></div>

                      {/* Animated Background Particles */}
                      <div className="absolute inset-0 overflow-hidden">
                        {[...Array(6)].map((_, i) => (
                          <div
                            key={i}
                            className={`absolute w-2 h-2 rounded-full transition-all duration-1000 ${
                              isAssistantSpeaking
                                ? 'bg-[#6C2CCC]/60 animate-bounce'
                                : 'bg-slate-400/20'
                            }`}
                            style={{
                              left: `${15 + i * 15}%`,
                              top: `${20 + (i % 3) * 20}%`,
                              animationDelay: `${i * 200}ms`,
                              animationDuration: '2s'
                            }}
                          />
                        ))}
                      </div>

                      {/* Central AI Avatar */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className={`relative transition-all duration-700 ${
                          isAssistantSpeaking ? 'animate-breathing' : ''
                        }`}>
                          {/* Outer Glow Ring */}
                          <div className={`absolute inset-0 rounded-full transition-all duration-700 ${
                            isAssistantSpeaking
                              ? 'bg-gradient-to-r from-[#6C2CCC]/40 to-[#8A4FDB]/40 animate-spin-slow blur-sm scale-110'
                              : 'bg-gradient-to-r from-slate-600/30 to-slate-500/30'
                          }`} style={{ width: '120px', height: '120px' }}></div>

                          {/* Main Avatar Circle */}
                          <div className={`relative w-24 h-24 rounded-full transition-all duration-700 border-2 ${
                            isAssistantSpeaking
                              ? 'bg-gradient-to-br from-[#6C2CCC]/70 via-[#8A4FDB]/60 to-[#6C2CCC]/80 border-[#6C2CCC]/50 shadow-[0_0_30px_rgba(108,44,204,0.6)]'
                              : 'bg-gradient-to-br from-slate-600/50 via-slate-500/40 to-slate-600/60 border-slate-500/30 shadow-[0_4px_20px_rgba(0,0,0,0.4)]'
                          } flex items-center justify-center`}>

                            {/* Inner Pulse Dots */}
                            <div className="relative">
                              {[...Array(3)].map((_, i) => (
                                <div
                                  key={i}
                                  className={`absolute w-3 h-3 rounded-full transition-all duration-500 ${
                                    isAssistantSpeaking
                                      ? 'bg-white/90 animate-pulse'
                                      : 'bg-slate-300/60'
                                  }`}
                                  style={{
                                    transform: `rotate(${i * 120}deg) translateX(15px)`,
                                    animationDelay: `${i * 300}ms`
                                  }}
                                />
                              ))}

                              {/* Center Core */}
                              <div className={`w-4 h-4 rounded-full transition-all duration-500 ${
                                isAssistantSpeaking
                                  ? 'bg-white shadow-[0_0_15px_rgba(255,255,255,0.8)]'
                                  : 'bg-slate-300/80'
                              }`}></div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Glass Overlay Effect */}
                      <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/5 to-white/10 pointer-events-none"></div>

                      {/* Status Indicator */}
                      <div className="absolute top-4 right-4">
                        <div className={`w-3 h-3 rounded-full transition-all duration-500 ${
                          isAssistantSpeaking
                            ? 'bg-green-400 shadow-[0_0_10px_rgba(34,197,94,0.8)] animate-pulse'
                            : 'bg-slate-400/60'
                        }`}></div>
                      </div>
                    </div>

                    {/* Agent Speaking Indicator */}
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-2">{isHebrew ? 'מצב סוכן' : 'Agent Status'}</p>
                      <div className={`w-32 h-8 flex items-center justify-center gap-1 rounded-lg transition-all duration-300 ${
                        isAssistantSpeaking ? 'bg-[#6C2CCC]/10 border border-[#6C2CCC]/30' : 'bg-muted/50'
                      }`}>
                        {[1,2,3,4,5].map((i) => (
                          <div key={i} className={`w-1 rounded-full transition-all duration-300 ${
                            isAssistantSpeaking ? 'bg-[#6C2CCC] animate-pulse' : 'bg-[#6C2CCC]/40'
                          }`}
                               style={{
                                 height: isAssistantSpeaking ? `${[14, 18, 12, 20, 16][i-1]}px` : '6px',
                                 animationDelay: `${i * 100}ms`
                               }}></div>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {isAssistantSpeaking
                          ? (isHebrew ? 'הסוכן מדבר...' : 'Agent speaking...')
                          : (isHebrew ? 'הסוכן שותק' : 'Agent idle')}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Info Cards Row */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            {/* Provider Information Card */}
            <Card className="ai-card p-4">
              <h3 className="text-sm font-medium text-card-foreground mb-3 flex items-center gap-2">
                <Settings className="w-4 h-4" />
                {isHebrew ? 'ספקי AI בשימוש' : 'AI Providers in Use'}
              </h3>
              <div className="space-y-3 text-sm">
                {isRealtimePipeline ? (
                  // Realtime Pipeline Display
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-purple-500/10 border border-purple-500/30">
                      <Zap className="w-4 h-4 text-purple-400" />
                      <div className="flex-1">
                        <div className="text-xs text-muted-foreground">{isHebrew ? 'צינור זמן-אמת' : 'Realtime Pipeline'}</div>
                        <div className="font-medium text-purple-400">
                          {config?.llm?.provider === 'gemini-live' && 'Gemini 2.0 Flash Live'}
                          {config?.llm?.provider === 'openai-realtime' && 'OpenAI Realtime'}
                          {!config?.llm?.provider && (isHebrew ? 'לא מוגדר' : 'Not configured')}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Traditional Pipeline Display
                  <>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-500/10 border border-blue-500/30">
                      <Mic className="w-4 h-4 text-blue-400" />
                      <div className="flex-1">
                        <div className="text-xs text-muted-foreground">{isHebrew ? 'זיהוי דיבור' : 'STT'}</div>
                        <div className="font-medium text-blue-400">{config?.stt?.provider || (isHebrew ? 'לא מוגדר' : 'Not set')}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-green-500/10 border border-green-500/30">
                      <Brain className="w-4 h-4 text-green-400" />
                      <div className="flex-1">
                        <div className="text-xs text-muted-foreground">{isHebrew ? 'מודל AI' : 'LLM'}</div>
                        <div className="font-medium text-green-400">{config?.llm?.provider || (isHebrew ? 'לא מוגדר' : 'Not set')}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-purple-500/10 border border-purple-500/30">
                      <Volume2 className="w-4 h-4 text-purple-400" />
                      <div className="flex-1">
                        <div className="text-xs text-muted-foreground">{isHebrew ? 'סינתזת קול' : 'TTS'}</div>
                        <div className="font-medium text-purple-400">{config?.tts?.provider || (isHebrew ? 'לא מוגדר' : 'Not set')}</div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </Card>

            <Card className="ai-card p-4">
              <h3 className="text-sm font-medium text-card-foreground mb-3">{isHebrew ? 'איך להשתמש' : 'How to Use'}</h3>
              <div className="space-y-3 text-xs">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium text-[10px]">
                    1
                  </div>
                  <span className="text-muted-foreground leading-relaxed">{isHebrew ? 'לחץ על כפתור התחל שיחה' : 'Click the start call button'}</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium text-[10px]">
                    2
                  </div>
                  <span className="text-muted-foreground leading-relaxed">{isHebrew ? 'דבר באופן טבעי בעברית' : 'Speak naturally in Hebrew'}</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium text-[10px]">
                    3
                  </div>
                  <span className="text-muted-foreground leading-relaxed">{isHebrew ? 'קבל תשובות חכמות ומהירות' : 'Get smart and fast responses'}</span>
                </div>
              </div>
            </Card>

            <Card className="ai-card p-4">
              <h3 className="text-sm font-medium text-card-foreground mb-2">{isHebrew ? 'זיהוי קול מתקדם' : 'Advanced Voice Recognition'}</h3>
              <p className="text-xs text-muted-foreground">{isHebrew ? 'טכנולוגיה מתקדמת לזיהוי דיבור בעברית' : 'Advanced technology for Hebrew speech recognition'}</p>
              <div className="mt-3 flex justify-center">
                <div className="w-12 h-12 rounded-full border-2 border-[#6C2CCC]/20 flex items-center justify-center animate-pulse">
                  <div className="w-6 h-6 rounded-full bg-[#6C2CCC]/10 flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-[#6C2CCC]/30"></div>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="ai-card p-4">
              <h3 className="text-sm font-medium text-card-foreground mb-2">{isHebrew ? 'תשובות חכמות' : 'Smart Responses'}</h3>
              <p className="text-xs text-muted-foreground">{isHebrew ? 'מודל Gemini AI עם הבנה מעמיקה בעברית' : 'Gemini AI model with deep Hebrew understanding'}</p>
              <div className="mt-3">
                <div className="w-full h-6 flex items-center justify-center gap-1">
                  {[1,2,3,4,5,6].map((i) => (
                    <div key={i} className={`w-1 bg-[#6C2CCC]/40 rounded-full animate-pulse`}
                         style={{height: `${[8, 12, 6, 14, 10, 7][i-1]}px`, animationDelay: `${i * 100}ms`}}></div>
                  ))}
                </div>
              </div>
            </Card>
          </div>

        </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/30 backdrop-blur flex-shrink-0">
        <div className="container mx-auto px-4 md:px-6 py-4">
          <div className="text-center text-muted-foreground text-sm">
            <p>{isHebrew ? '© 2024 AI Voicei. כל הזכויות שמורות.' : '© 2024 AI Voicei. All rights reserved.'}</p>
            <p className="mt-1 text-xs">{isHebrew ? 'מופעל על ידי Pipecat AI Framework' : 'Powered by Pipecat AI Framework'}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}