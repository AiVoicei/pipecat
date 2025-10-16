'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useLanguage } from '@/contexts/LanguageContext'
import { Sparkles, Upload, Loader2, FileText, ArrowRight, Languages } from 'lucide-react'
import {
  AnimatedBackground,
  AgentyAvatar,
  ConversationalStep,
  GenerationJourney,
  SuccessCelebration,
  BuildFlowStep,
  Message,
  AgentRequirements
} from '@/components/features/build'

const API_BASE_URL = 'http://localhost:7860'

export default function BuildWithAgentyPage() {
  const { isHebrew } = useLanguage()
  const router = useRouter()

  const [currentStep, setCurrentStep] = useState<BuildFlowStep>('welcome')
  const [requirements, setRequirements] = useState<AgentRequirements>({
    description: '',
    gender: 'female'
  })
  const [messages, setMessages] = useState<Message[]>([])
  const [currentMessage, setCurrentMessage] = useState('')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [generatedAgentId, setGeneratedAgentId] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [animationState, setAnimationState] = useState<'idle' | 'listening' | 'thinking'>('idle')

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadedFile(file)
      setRequirements({ ...requirements, knowledgeBase: file })
    }
  }

  const startJourney = () => {
    setCurrentStep('description')
    setAnimationState('listening')
  }

  const handleDescriptionSubmit = () => {
    if (!requirements.description.trim()) return
    setCurrentStep('name')
  }

  const handleNameSubmit = () => {
    setCurrentStep('language')
  }

  const handleLanguageSubmit = () => {
    setCurrentStep('gender')
  }

  const handleGenderSubmit = () => {
    setCurrentStep('knowledge')
  }

  const handleKnowledgeSubmit = async () => {
    // Start generation or clarification
    setIsProcessing(true)
    setAnimationState('thinking')

    try {
      const formData = new FormData()
      formData.append('action', 'start')
      formData.append('requirements', JSON.stringify({
        description: requirements.description,
        name: requirements.name,
        language: requirements.language,
        gender: requirements.gender,
        hasKnowledgeBase: !!uploadedFile
      }))

      const response = await fetch(`${API_BASE_URL}/api/build-agent`, {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (data.needsClarification) {
        setMessages([{ role: 'assistant', content: data.questions }])
        setConversationId(data.conversationId)
        setCurrentStep('clarification')
        setAnimationState('idle')
      } else {
        setConversationId(data.conversationId)
        startAgentGeneration(data.conversationId)
      }
    } catch (error) {
      console.error('Error starting generation:', error)
      setAnimationState('idle')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSendMessage = async () => {
    if (!currentMessage.trim()) return

    const newMessage: Message = { role: 'user', content: currentMessage }
    const updatedMessages = [...messages, newMessage]
    setMessages(updatedMessages)
    setCurrentMessage('')
    setIsProcessing(true)
    setAnimationState('thinking')

    try {
      const formData = new FormData()
      formData.append('action', 'clarify')
      formData.append('message', currentMessage)
      formData.append('messages', JSON.stringify(updatedMessages))
      if (conversationId) {
        formData.append('conversationId', conversationId)
      }

      const response = await fetch(`${API_BASE_URL}/api/build-agent`, {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (data.needsMoreInfo) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.questions }])
        setAnimationState('idle')
      } else {
        startAgentGeneration(data.conversationId)
      }
    } catch (error) {
      console.error('Error sending message:', error)
      setAnimationState('idle')
    } finally {
      setIsProcessing(false)
    }
  }

  const startAgentGeneration = async (conversationId?: string) => {
    setCurrentStep('generating')
    setProgress(0)
    setAnimationState('thinking')

    const startTime = Date.now()

    // Progress through phases: 0->20->40->60->80->90 (5 steps x 5 seconds = 25 seconds minimum)
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + 20
      })
    }, 5000)

    try {
      const formData = new FormData()
      formData.append('action', 'generate')
      formData.append('requirements', JSON.stringify({
        description: requirements.description,
        name: requirements.name,
        language: requirements.language,
        gender: requirements.gender
      }))
      formData.append('messages', JSON.stringify(messages))
      if (conversationId) {
        formData.append('conversationId', conversationId)
      }
      if (uploadedFile) {
        formData.append('knowledgeBase', uploadedFile)
      }

      const response = await fetch(`${API_BASE_URL}/api/build-agent`, {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      // Minimum 25 seconds (5 phases x 5 seconds each)
      const minTime = 25000
      const elapsed = Date.now() - startTime
      if (elapsed < minTime) {
        await new Promise(resolve => setTimeout(resolve, minTime - elapsed))
      }

      clearInterval(progressInterval)
      setProgress(100)

      if (data.success) {
        setGeneratedAgentId(data.agentId)
        setCurrentStep('complete')
        setAnimationState('idle')
      }
    } catch (error) {
      console.error('Error generating agent:', error)
      clearInterval(progressInterval)
      setAnimationState('idle')
    }
  }

  // Render different steps
  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Animated Background */}
      <AnimatedBackground
        variant={
          currentStep === 'generating' ? 'space' :
          currentStep === 'complete' ? 'celebration' :
          'default'
        }
      />

      {/* Main Content Container */}
      <div className="relative z-10 min-h-screen flex justify-center items-start p-4">
        <div className="w-full max-w-4xl min-h-screen">

          {/* Welcome Screen */}
          <ConversationalStep show={currentStep === 'welcome'}>
            <motion.div
              className="text-center space-y-12 min-h-screen flex flex-col justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {/* Avatar */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              >
                <AgentyAvatar state="idle" size="xl" />
              </motion.div>

              {/* Welcome Message */}
              <div className="space-y-6">
                <motion.h1
                  className="text-5xl md:text-7xl font-bold text-white"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  {isHebrew ? 'שלום! 👋' : 'Hello! 👋'}
                </motion.h1>

                <motion.p
                  className="text-2xl md:text-3xl text-purple-200"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  {isHebrew ? "אני Agenty, בואו ניצור את הסוכן המושלם שלכם!" : "I'm Agenty, let's create your perfect agent!"}
                </motion.p>

                <motion.p
                  className="text-lg text-gray-300 max-w-2xl mx-auto"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                >
                  {isHebrew
                    ? 'אספר לי מה אתה רוצה, ואני אבנה עבורך סוכן AI מותאם אישית תוך דקות'
                    : "Tell me what you want, and I'll build you a custom AI agent in minutes"}
                </motion.p>
              </div>

              {/* CTA Button */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.9, type: 'spring' }}
                className="mt-8"
              >
                <Button
                  onClick={startJourney}
                  size="lg"
                  className="px-12 py-8 text-2xl font-semibold rounded-2xl
                    bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400
                    build-button-glow group shadow-2xl"
                >
                  <Sparkles className="w-8 h-8 mr-3" />
                  {isHebrew ? "בואו נתחיל!" : "Let's Get Started!"}
                  <ArrowRight className="w-8 h-8 ml-3 group-hover:translate-x-2 transition-transform" />
                </Button>
              </motion.div>
            </motion.div>
          </ConversationalStep>

          {/* Description Step */}
          <ConversationalStep show={currentStep === 'description'}>
            <div className="space-y-8 pt-20">
              {/* Avatar asking question */}
              <div className="flex justify-center mb-8">
                <AgentyAvatar state="listening" size="md" />
              </div>

              {/* Question Card */}
              <div className="build-glass rounded-3xl p-8 md:p-12 space-y-6">
                <Label className="text-3xl font-bold text-white block mb-6">
                  {isHebrew ? '🤔 מה הסוכן שלך צריך לעשות?' : '🤔 What should your agent do?'}
                </Label>

                <Textarea
                  placeholder={isHebrew
                    ? 'לדוגמה: "אני רוצה סוכן שיעזור ללקוחות עם שירות לקוחות, יענה על שאלות נפוצות, ויעביר לנציג אנושי במידת הצורך..."'
                    : 'Example: "I want an agent that helps customers with support, answers FAQs, and escalates to human agent when needed..."'
                  }
                  value={requirements.description}
                  onChange={(e) => setRequirements({ ...requirements, description: e.target.value })}
                  className="min-h-[200px] text-lg bg-black/30 border-purple-400/30 focus:border-purple-400
                    placeholder:text-gray-500 resize-none"
                  dir={isHebrew ? 'rtl' : 'ltr'}
                  autoFocus
                />

                <div className="flex justify-between items-center text-sm text-gray-400">
                  <span>{requirements.description.length} {isHebrew ? 'תווים' : 'characters'}</span>
                  <span>{isHebrew ? 'תאר בפירוט ככל האפשר' : 'Be as detailed as possible'}</span>
                </div>

                <Button
                  onClick={handleDescriptionSubmit}
                  disabled={!requirements.description.trim()}
                  size="lg"
                  className="w-full py-6 text-lg build-button-glow"
                >
                  {isHebrew ? 'המשך' : 'Continue'}
                  <ArrowRight className="w-5 h-5 mr-2" />
                </Button>
              </div>
            </div>
          </ConversationalStep>

          {/* Name Step */}
          <ConversationalStep show={currentStep === 'name'}>
            <div className="space-y-8 pt-20">
              <div className="flex justify-center mb-8">
                <AgentyAvatar state="listening" size="md" />
              </div>

              <div className="build-glass rounded-3xl p-8 md:p-12 space-y-6">
                <Label className="text-3xl font-bold text-white block mb-6">
                  {isHebrew ? '✨ איך נקרא לסוכן שלך?' : "✨ What's your agent's name?"}
                </Label>

                <Input
                  placeholder={isHebrew ? 'לדוגמה: עוזר תמיכה, סוכן מכירות...' : 'Example: Support Helper, Sales Agent...'}
                  value={requirements.name || ''}
                  onChange={(e) => setRequirements({ ...requirements, name: e.target.value })}
                  className="text-2xl h-16 bg-black/30 border-purple-400/30 focus:border-purple-400 placeholder:text-gray-500"
                  dir={isHebrew ? 'rtl' : 'ltr'}
                  autoFocus
                />

                <p className="text-sm text-gray-400">
                  {isHebrew ? '(אופציונלי - נוכל להמליץ על שם מתאים)' : '(Optional - we can suggest a name)'}
                </p>

                <div className="flex gap-3">
                  <Button
                    onClick={() => setCurrentStep('description')}
                    variant="outline"
                    size="lg"
                    className="flex-1"
                  >
                    {isHebrew ? 'חזור' : 'Back'}
                  </Button>
                  <Button
                    onClick={handleNameSubmit}
                    size="lg"
                    className="flex-1 build-button-glow"
                  >
                    {isHebrew ? 'המשך' : 'Continue'}
                    <ArrowRight className="w-5 h-5 mr-2" />
                  </Button>
                </div>
              </div>
            </div>
          </ConversationalStep>

          {/* Language Step */}
          <ConversationalStep show={currentStep === 'language'}>
            <div className="space-y-8 pt-20">
              <div className="flex justify-center mb-8">
                <AgentyAvatar state="listening" size="md" />
              </div>

              <div className="build-glass rounded-3xl p-8 md:p-12 space-y-6">
                <Label className="text-3xl font-bold text-white block mb-6 flex items-center gap-3">
                  <Languages className="w-8 h-8" />
                  {isHebrew ? 'באיזו שפה הסוכן צריך לדבר?' : 'What language should your agent speak?'}
                </Label>

                <Input
                  placeholder={isHebrew ? 'לדוגמה: עברית, אנגלית, ספרדית...' : 'Example: Hebrew, English, Spanish...'}
                  value={requirements.language || ''}
                  onChange={(e) => setRequirements({ ...requirements, language: e.target.value })}
                  className="text-2xl h-16 bg-black/30 border-purple-400/30 focus:border-purple-400 placeholder:text-gray-500"
                  dir={isHebrew ? 'rtl' : 'ltr'}
                  autoFocus
                />

                <p className="text-sm text-gray-400">
                  {isHebrew ? '(אופציונלי - ברירת המחדל היא אנגלית)' : '(Optional - defaults to English)'}
                </p>

                <div className="flex gap-3">
                  <Button
                    onClick={() => setCurrentStep('name')}
                    variant="outline"
                    size="lg"
                    className="flex-1"
                  >
                    {isHebrew ? 'חזור' : 'Back'}
                  </Button>
                  <Button
                    onClick={handleLanguageSubmit}
                    size="lg"
                    className="flex-1 build-button-glow"
                  >
                    {isHebrew ? 'המשך' : 'Continue'}
                    <ArrowRight className="w-5 h-5 mr-2" />
                  </Button>
                </div>
              </div>
            </div>
          </ConversationalStep>

          {/* Gender Step */}
          <ConversationalStep show={currentStep === 'gender'}>
            <div className="space-y-8 pt-20">
              <div className="flex justify-center mb-8">
                <AgentyAvatar state="listening" size="md" />
              </div>

              <div className="build-glass rounded-3xl p-8 md:p-12 space-y-6">
                <Label className="text-3xl font-bold text-white block mb-6">
                  {isHebrew ? '🎭 איזה קול לסוכן?' : '🎭 Which voice for your agent?'}
                </Label>

                <Select
                  value={requirements.gender || 'female'}
                  onValueChange={(value: 'male' | 'female') => setRequirements({ ...requirements, gender: value })}
                >
                  <SelectTrigger className="text-2xl h-16 bg-black/30 border-purple-400/30 focus:border-purple-400">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-black/90 border-purple-400/30">
                    <SelectItem value="female" className="text-xl py-4">
                      {isHebrew ? '🎤 נקבה' : '🎤 Female'}
                    </SelectItem>
                    <SelectItem value="male" className="text-xl py-4">
                      {isHebrew ? '🎤 זכר' : '🎤 Male'}
                    </SelectItem>
                  </SelectContent>
                </Select>

                <p className="text-sm text-gray-400">
                  {isHebrew
                    ? 'בחירה זו משפיעה על הקול בזמן אמת של הסוכן'
                    : "This affects your agent's real-time voice"}
                </p>

                <div className="flex gap-3">
                  <Button
                    onClick={() => setCurrentStep('language')}
                    variant="outline"
                    size="lg"
                    className="flex-1"
                  >
                    {isHebrew ? 'חזור' : 'Back'}
                  </Button>
                  <Button
                    onClick={handleGenderSubmit}
                    size="lg"
                    className="flex-1 build-button-glow"
                  >
                    {isHebrew ? 'המשך' : 'Continue'}
                    <ArrowRight className="w-5 h-5 mr-2" />
                  </Button>
                </div>
              </div>
            </div>
          </ConversationalStep>

          {/* Knowledge Base Step */}
          <ConversationalStep show={currentStep === 'knowledge'}>
            <div className="space-y-8 pt-20">
              <div className="flex justify-center mb-8">
                <AgentyAvatar state="listening" size="md" />
              </div>

              <div className="build-glass rounded-3xl p-8 md:p-12 space-y-6">
                <Label className="text-3xl font-bold text-white block mb-6">
                  {isHebrew ? '📚 יש לך מסמכים לסוכן?' : '📚 Any documents for your agent?'}
                </Label>

                <div className="border-2 border-dashed border-purple-400/40 rounded-2xl p-12 text-center
                  hover:border-purple-400 hover:bg-purple-500/5 transition-all cursor-pointer">
                  <input
                    type="file"
                    id="knowledge"
                    className="hidden"
                    accept=".pdf,.txt,.doc,.docx,.md"
                    onChange={handleFileUpload}
                  />
                  <label htmlFor="knowledge" className="cursor-pointer block">
                    <Upload className="w-16 h-16 mx-auto mb-4 text-purple-400" />
                    {uploadedFile ? (
                      <div className="space-y-2">
                        <p className="text-xl text-white font-medium">{uploadedFile.name}</p>
                        <div className="flex items-center justify-center gap-2">
                          <FileText className="w-5 h-5 text-purple-300" />
                          <span className="text-purple-300">{(uploadedFile.size / 1024).toFixed(1)} KB</span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-xl text-white">
                          {isHebrew ? 'העלה מסמך' : 'Upload a document'}
                        </p>
                        <p className="text-gray-400">
                          {isHebrew ? 'PDF, TXT, DOC, או MD' : 'PDF, TXT, DOC, or MD'}
                        </p>
                      </div>
                    )}
                  </label>
                </div>

                <p className="text-sm text-gray-400 text-center">
                  {isHebrew ? '(אופציונלי - הסוכן יוכל ללמוד ממסמכים אלה)' : '(Optional - agent will learn from these documents)'}
                </p>

                <div className="flex gap-3">
                  <Button
                    onClick={() => setCurrentStep('gender')}
                    variant="outline"
                    size="lg"
                    className="flex-1"
                  >
                    {isHebrew ? 'חזור' : 'Back'}
                  </Button>
                  <Button
                    onClick={handleKnowledgeSubmit}
                    disabled={isProcessing}
                    size="lg"
                    className="flex-1 build-button-glow"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        {isHebrew ? 'מעבד...' : 'Processing...'}
                      </>
                    ) : (
                      <>
                        {isHebrew ? 'צור סוכן!' : 'Create Agent!'}
                        <Sparkles className="w-5 h-5 mr-2" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </ConversationalStep>

          {/* Clarification Chat */}
          <AnimatePresence mode="wait">
            {currentStep === 'clarification' && (
              <div className="build-glass rounded-3xl p-8 md:p-12 space-y-6 max-w-3xl mx-auto">

                {/* Avatar */}
                <div className="flex justify-center mb-6">
                  <AgentyAvatar state={isProcessing ? 'thinking' : 'idle'} size="md" />
                </div>

                <h2 className="text-2xl font-bold text-white text-center mb-6">
                  {isHebrew ? '💬 יש לי כמה שאלות...' : "💬 I have a few questions..."}
                </h2>

                {/* Messages */}
                <div className="space-y-4 max-h-[400px] overflow-y-auto p-4 bg-black/20 rounded-xl">
                  <AnimatePresence>
                    {messages.map((message, index) => (
                      <div
                        key={index}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] p-4 rounded-2xl ${
                            message.role === 'user'
                              ? 'bg-purple-600 text-white'
                              : 'bg-gray-800 text-gray-100 border border-purple-400/20'
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{message.content}</p>
                        </div>
                      </div>
                    ))}
                  </AnimatePresence>

                  {/* Typing Indicator */}
                  {isProcessing && (
                    <div className="flex justify-start">
                      <div className="bg-gray-800 border border-purple-400/20 p-4 rounded-2xl">
                        <div className="flex gap-1">
                          {[0, 1, 2].map((i) => (
                            <div
                              key={i}
                              className="w-2 h-2 bg-purple-400 rounded-full build-typing-indicator"
                              style={{ animationDelay: `${i * 0.2}s` }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input */}
                <div className="flex gap-3">
                  <Input
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !isProcessing && handleSendMessage()}
                    placeholder={isHebrew ? 'הקלד את התשובה שלך...' : 'Type your answer...'}
                    disabled={isProcessing}
                    className="flex-1 h-14 bg-black/30 border-purple-400/30 text-lg"
                    dir={isHebrew ? 'rtl' : 'ltr'}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={isProcessing || !currentMessage.trim()}
                    size="lg"
                    className="px-8 build-button-glow"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      isHebrew ? 'שלח' : 'Send'
                    )}
                  </Button>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Generation Journey Full Screen */}
      {currentStep === 'generating' && (
        <GenerationJourney
          progress={progress}
          onComplete={() => {
            // Journey complete, wait for success celebration
          }}
        />
      )}

      {/* Success Celebration Full Screen */}
      {currentStep === 'complete' && (
        <SuccessCelebration
          agentName={requirements.name}
          onViewAgent={() => router.push(`/agents/${generatedAgentId}`)}
          isHebrew={isHebrew}
        />
      )}
    </div>
  )
}
