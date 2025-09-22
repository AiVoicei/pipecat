'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

type Language = 'he' | 'en'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string, namespace?: string) => string
  isHebrew: boolean
  getLanguageClasses: (baseClasses?: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

// Translation data
const translations = {
  he: {
    // Navigation
    'navigation.dashboard': 'לוח בקרה',
    'navigation.myAgents': 'הסוכנים שלי',
    'navigation.analytics': 'ניתוחים',
    'navigation.templates': 'תבניות',
    'navigation.whiteLabel': 'מותג לבן',
    'navigation.settings': 'הגדרות',
    'navigation.createAgent': 'צור סוכן',

    // Voice Chat
    'voiceChat.title': 'ממשק שיחה קולית עם AI Voicei',
    'voiceChat.connectionStatus': 'מצב חיבור',
    'voiceChat.connected': 'מחובר',
    'voiceChat.connecting': 'מתחבר...',
    'voiceChat.disconnected': 'לא מחובר',
    'voiceChat.error': 'שגיאה',
    'voiceChat.selectCallType': 'בחרו סוג שיחה',
    'voiceChat.audioCall': 'שיחה קולית',
    'voiceChat.videoCall': 'שיחת וידאו',
    'voiceChat.audioOnly': 'שמע בלבד',
    'voiceChat.audioAndVideo': 'שמע ותמונה',
    'voiceChat.microphonePermission': 'תידרשו לאשר גישה למיקרופון בלבד',
    'voiceChat.cameraAndMicPermission': 'תידרשו לאשר גישה למצלמה ולמיקרופון',
    'voiceChat.clickToStart': 'לחצו על "התחל שיחה" להתחיל',
    'voiceChat.videoPreview': 'תצוגה מקדימה של הוידאו שלך',
    'voiceChat.enableVideo': 'הפעל וידאו',
    'voiceChat.enableCamera': 'הפעל מצלמה לשיחת וידאו',
    'voiceChat.startCall': 'התחל שיחה',
    'voiceChat.startAudioCall': 'התחל שיחה קולית',
    'voiceChat.startVideoCall': 'התחל שיחת וידאו',
    'voiceChat.endCall': 'סיים שיחה',
    'voiceChat.clickToStartCall': 'לחץ להתחלת שיחה עם AI Voicei',
    'voiceChat.smartVoiceService': 'שירות קולי חכם המבין עברית',
    'voiceChat.callActive': 'השיחה פעילה - דבר באופן טבעי',
    'voiceChat.speakingWithAI': 'מדבר עברית עם Gemini AI',
    'voiceChat.connectedToService': 'מחובר לשירות AI Voicei',
    'voiceChat.connectingToService': 'מתחבר לשירות AI Voicei...',
    'voiceChat.connectionError': 'שגיאת חיבור',
    'voiceChat.notConnected': 'לא מחובר לשירות',
    'voiceChat.sessionActive': 'השיחה פעילה',

    // Layout
    'layout.searchPlaceholder': 'חפש סוכנים, תבניות, או תיעוד...',

    // Conversation History
    'conversationHistory.you': 'אתה',
    'conversationHistory.system': 'מערכת',
    'conversationHistory.aiVoice': 'AI Voicei',

    // Build with Agenty
    'buildWithAgenty.title': 'בנה עם אגנטי',
    'buildWithAgenty.description': 'צור סוכנים עם סיוע AI באמצעות הנחיות פשוטות',
    'buildWithAgenty.tryAIBuilder': 'נסה בונה AI',

    // Dashboard
    'dashboard.title': 'לוח בקרה',
    'dashboard.welcome': 'ברוכים הבאים לאגנטי',
    'dashboard.monitorAgents': 'עקוב אחר הסוכנים שלך ומדד ביצועים',
    'dashboard.satisfaction': 'שביעות רצון',
    'dashboard.avgResponseTime': 'זמן תגובה ממוצע',
    'dashboard.conversations': 'שיחות',
    'dashboard.totalAgents': 'סך כל הסוכנים',
    'dashboard.fromLastMonth': 'מהחודש שעבר',
    'dashboard.improvement': 'שיפור',
    'dashboard.viewAll': 'צפה בהכל',
    'dashboard.yourAgents': 'הסוכנים שלך',
    'dashboard.manageAndMonitor': 'נהל ועקוב אחר סוכני הקול של AI',
    'dashboard.customerSupportBot': 'בוט תמיכת לקוחות',
    'dashboard.salesAssistant': 'עוזר מכירות',
    'dashboard.hebrewSupportBot': 'בוט תמיכה עברית',
    'dashboard.conversations_': 'שיחות',
    'dashboard.quickActions': 'פעולות מהירות',
    'dashboard.getStartedCommon': 'התחל עם משימות נפוצות',
    'dashboard.viewAnalytics': 'צפה בניתוחים',
    'dashboard.browseTemplates': 'עיין בתבניות',
    'dashboard.createNewAgent': 'צור סוכן חדש',
    'dashboard.testAgent': 'בדוק סוכן',
    'dashboard.active': 'פעיל',
    'dashboard.inactive': 'לא פעיל',
    'dashboard.paused': 'מושהה'
  },
  en: {
    // Navigation
    'navigation.dashboard': 'Dashboard',
    'navigation.myAgents': 'My Agents',
    'navigation.analytics': 'Analytics',
    'navigation.templates': 'Templates',
    'navigation.whiteLabel': 'White Label',
    'navigation.settings': 'Settings',
    'navigation.createAgent': 'Create Agent',

    // Voice Chat
    'voiceChat.title': 'AI Voice Interface',
    'voiceChat.connectionStatus': 'Connection Status',
    'voiceChat.connected': 'Connected',
    'voiceChat.connecting': 'Connecting...',
    'voiceChat.disconnected': 'Disconnected',
    'voiceChat.error': 'Error',
    'voiceChat.selectCallType': 'Select Call Type',
    'voiceChat.audioCall': 'Audio Call',
    'voiceChat.videoCall': 'Video Call',
    'voiceChat.audioOnly': 'Audio only',
    'voiceChat.audioAndVideo': 'Audio and video',
    'voiceChat.microphonePermission': 'Microphone permission required only',
    'voiceChat.cameraAndMicPermission': 'Camera and microphone permissions required',
    'voiceChat.clickToStart': 'Click "Start Call" to begin',
    'voiceChat.videoPreview': 'Your video preview',
    'voiceChat.enableVideo': 'Enable Video',
    'voiceChat.enableCamera': 'Enable camera for video call',
    'voiceChat.startCall': 'Start Call',
    'voiceChat.startAudioCall': 'Start Audio Call',
    'voiceChat.startVideoCall': 'Start Video Call',
    'voiceChat.endCall': 'End Call',
    'voiceChat.clickToStartCall': 'Click to start call with AI Voice',
    'voiceChat.smartVoiceService': 'Smart voice service that understands English',
    'voiceChat.callActive': 'Call active - speak naturally',
    'voiceChat.speakingWithAI': 'Speaking English with Gemini AI',
    'voiceChat.connectedToService': 'Connected to AI Voice service',
    'voiceChat.connectingToService': 'Connecting to AI Voice service...',
    'voiceChat.connectionError': 'Connection error',
    'voiceChat.notConnected': 'Not connected to service',
    'voiceChat.sessionActive': 'Session Active',

    // Layout
    'layout.searchPlaceholder': 'Search agents, templates, or documentation...',

    // Conversation History
    'conversationHistory.you': 'You',
    'conversationHistory.system': 'System',
    'conversationHistory.aiVoice': 'AI Voice',

    // Build with Agenty
    'buildWithAgenty.title': 'Build with Agenty',
    'buildWithAgenty.description': 'Create agents with AI assistance using simple prompts',
    'buildWithAgenty.tryAIBuilder': 'Try AI Builder',

    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.welcome': 'Welcome to Agenty',
    'dashboard.monitorAgents': 'Monitor your agents and track performance metrics',
    'dashboard.satisfaction': 'Satisfaction',
    'dashboard.avgResponseTime': 'Avg Response Time',
    'dashboard.conversations': 'Conversations',
    'dashboard.totalAgents': 'Total Agents',
    'dashboard.fromLastMonth': 'from last month',
    'dashboard.improvement': 'improvement',
    'dashboard.viewAll': 'View All',
    'dashboard.yourAgents': 'Your Agents',
    'dashboard.manageAndMonitor': 'Manage and monitor your voice AI agents',
    'dashboard.customerSupportBot': 'Customer Support Bot',
    'dashboard.salesAssistant': 'Sales Assistant',
    'dashboard.hebrewSupportBot': 'Hebrew Support Bot',
    'dashboard.conversations_': 'conversations',
    'dashboard.quickActions': 'Quick Actions',
    'dashboard.getStartedCommon': 'Get started with common tasks',
    'dashboard.viewAnalytics': 'View Analytics',
    'dashboard.browseTemplates': 'Browse Templates',
    'dashboard.createNewAgent': 'Create New Agent',
    'dashboard.testAgent': 'Test Agent',
    'dashboard.active': 'active',
    'dashboard.inactive': 'inactive',
    'dashboard.paused': 'paused'
  }
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en')

  // Load saved language from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('language') as Language || 'en'

    setLanguageState(saved)
    document.documentElement.dir = saved === 'he' ? 'rtl' : 'ltr'
    document.documentElement.lang = saved

    // Also ensure the body has correct attributes
    if (document.body) {
      document.body.setAttribute('dir', saved === 'he' ? 'rtl' : 'ltr')
      document.body.setAttribute('lang', saved)
    }
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem('language', lang)
    // Update document direction immediately
    const direction = lang === 'he' ? 'rtl' : 'ltr'
    document.documentElement.dir = direction
    document.documentElement.lang = lang

    // Also update body direction immediately
    if (document.body) {
      document.body.setAttribute('dir', direction)
      document.body.setAttribute('lang', lang)
    }

    // Force a re-render by triggering a minimal layout change
    document.body.style.transform = 'translateX(0px)'
    setTimeout(() => {
      document.body.style.transform = ''
    }, 1)
  }

  const t = (key: string, namespace?: string) => {
    const fullKey = namespace ? `${namespace}.${key}` : key
    return translations[language][fullKey] || key
  }

  const isHebrew = language === 'he'

  const getLanguageClasses = (baseClasses: string = '') => {
    const hebrewClasses = isHebrew ? 'hebrew' : ''
    return [baseClasses, hebrewClasses].filter(Boolean).join(' ')
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isHebrew, getLanguageClasses }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}