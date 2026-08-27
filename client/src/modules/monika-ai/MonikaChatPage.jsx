import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  AlertOctagon,
  ShieldCheck,
  Ban,
  Ambulance,
  RefreshCw,
  Info,
  Clock,
  ChevronRight,
  User,
  HeartPulse,
  PhoneCall
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const MonikaChatPage = ({ onOpenAmbulanceWithReason }) => {
  const { user } = useAuth();
  const [sessionId] = useState(() => localStorage.getItem('monika_session_id') || `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`);
  const [messages, setMessages] = useState([]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('monika_session_id', sessionId);
    loadHistory();
  }, [sessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const loadHistory = async () => {
    try {
      const res = await api.get(`/monika-ai/history/${sessionId}`);
      if (res.success && res.data.messages) {
        setMessages(res.data.messages);
      }
    } catch {
      // New session
    }
  };

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!inputPrompt.trim() || isLoading) return;

    const userText = inputPrompt.trim();
    setInputPrompt('');

    const newMsgList = [
      ...messages,
      { role: 'user', content: userText, timestamp: new Date().toISOString() },
    ];
    setMessages(newMsgList);
    setIsLoading(true);

    try {
      const res = await api.post('/monika-ai/chat', {
        sessionId,
        prompt: userText,
      });

      if (res.success) {
        setMessages([
          ...newMsgList,
          {
            role: 'assistant',
            content: res.data.triageResult,
            timestamp: new Date().toISOString(),
          },
        ]);
      }
    } catch (err) {
      setMessages([
        ...newMsgList,
        {
          role: 'assistant',
          content: {
            urgency: 'SEE_DOCTOR_SOON',
            explanation: 'We encountered a momentary communication error. If you are experiencing serious discomfort, please consult a physician or call emergency services at 112.',
            precautions: ['Rest and keep hydrated.'],
            whatToAvoid: ['Avoid strenuous activity.'],
            recommendedAction: 'Visit nearest clinic if symptoms persist.',
            disclaimer: 'MonikaCare AI is an automated triage assistant and does not replace medical advice.',
          },
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = [
    'I have sudden tight chest pain and shortness of breath',
    'I have a persistent mild fever with body ache for 2 days',
    'Severe throbbing migraine with light sensitivity and nausea',
    'I stepped on a rusty nail and have swelling in my foot',
  ];

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-8rem)] sm:h-[calc(100vh-9rem)] bg-white sm:rounded-2xl shadow-sm sm:border border-slate-200 overflow-hidden">
      {/* Triage Assistant Header */}
      <div className="bg-gradient-to-r from-teal-700 via-emerald-700 to-teal-800 text-white px-4 py-3.5 flex items-center justify-between flex-shrink-0 shadow-md">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Bot className="w-6 h-6 text-teal-200 animate-pulse" />
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-teal-800 rounded-full"></span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight">MonikaCare AI</h1>
              <span className="bg-teal-500/30 text-teal-100 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border border-teal-400/20">
                Clinical Triage
              </span>
            </div>
            <p className="text-xs text-teal-100/80 font-normal">
              Doctor's Assistant for symptom evaluation & precautions
            </p>
          </div>
        </div>

        <button
          onClick={() => setMessages([])}
          className="p-2 text-teal-100 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          title="Clear Conversation"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Safety Notice Banner */}
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-[11px] text-amber-900 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-amber-700 flex-shrink-0" />
          <span>
            Not a diagnostic tool. For critical emergencies, call{' '}
            <a href="tel:112" className="font-bold underline">112</a> or tap 1-Tap Ambulance.
          </span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 smooth-scroll bg-slate-50/50">
        {messages.length === 0 ? (
          <div className="py-6 px-2 text-center space-y-6 max-w-md mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
              <HeartPulse className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Hello {user?.name ? user.name.split(' ')[0] : 'there'}!
              </h2>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Describe your symptoms, health concerns, or questions. I will provide practical precautions, things to avoid, and urgency triage.
              </p>
            </div>

            {/* Quick Prompts */}
            <div className="space-y-2 text-left">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Common Clinical Inquiries:
              </p>
              {quickPrompts.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInputPrompt(q);
                  }}
                  className="w-full text-left p-2.5 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-700 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all flex items-center justify-between group shadow-sm"
                >
                  <span className="truncate pr-2">{q}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isUser = msg.role === 'user';

            if (isUser) {
              return (
                <div key={index} className="flex justify-end items-start gap-2">
                  <div className="bg-emerald-600 text-white rounded-2xl rounded-tr-none px-4 py-2.5 max-w-[85%] sm:max-w-md shadow-sm">
                    <p className="text-sm font-normal leading-relaxed">{msg.content}</p>
                    <span className="text-[10px] text-emerald-200 block text-right mt-1 font-mono">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center flex-shrink-0 text-xs font-bold">
                    <User className="w-4 h-4" />
                  </div>
                </div>
              );
            }

            // Monika AI Triage Card Response
            const triage = typeof msg.content === 'object' ? msg.content : { explanation: msg.content };
            const isEmergency = triage.urgency === 'EMERGENCY';

            return (
              <div key={index} className="flex justify-start items-start gap-2">
                <div className="w-7 h-7 rounded-full bg-teal-600 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold shadow-sm">
                  <Bot className="w-4 h-4" />
                </div>

                <div className={`w-full max-w-lg rounded-2xl rounded-tl-none overflow-hidden shadow-md border ${
                  isEmergency ? 'border-red-500 bg-red-50/40' : 'border-slate-200 bg-white'
                }`}>
                  {/* Emergency Flag Banner */}
                  {isEmergency && (
                    <div className="bg-red-600 text-white px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertOctagon className="w-5 h-5 animate-bounce" />
                        <span className="text-xs font-extrabold uppercase tracking-wide">
                          CRITICAL EMERGENCY TIER
                        </span>
                      </div>
                      <button
                        onClick={() => onOpenAmbulanceWithReason?.(triage.explanation)}
                        className="bg-white text-red-600 hover:bg-red-50 active:scale-95 font-bold text-xs px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-1.5"
                      >
                        <Ambulance className="w-3.5 h-3.5" />
                        <span>Dispatch Ambulance</span>
                      </button>
                    </div>
                  )}

                  <div className="p-4 space-y-3.5">
                    {/* Explanation */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Clinical Overview
                      </h4>
                      <p className="text-sm font-medium text-slate-800 leading-relaxed">
                        {triage.explanation}
                      </p>
                    </div>

                    {/* Precautions */}
                    {triage.precautions?.length > 0 && (
                      <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 mb-1.5">
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          <span>Recommended Precautions:</span>
                        </div>
                        <ul className="space-y-1 text-xs text-slate-700">
                          {triage.precautions.map((p, pIdx) => (
                            <li key={pIdx} className="flex items-start gap-1.5">
                              <span className="text-emerald-500 font-bold">•</span>
                              <span>{p}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* What to avoid */}
                    {triage.whatToAvoid?.length > 0 && (
                      <div className="bg-rose-50/70 border border-rose-200/80 rounded-xl p-3">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800 mb-1.5">
                          <Ban className="w-4 h-4 text-rose-600" />
                          <span>What to Avoid:</span>
                        </div>
                        <ul className="space-y-1 text-xs text-slate-700">
                          {triage.whatToAvoid.map((a, aIdx) => (
                            <li key={aIdx} className="flex items-start gap-1.5">
                              <span className="text-rose-500 font-bold">•</span>
                              <span>{a}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Next Steps / Urgency badge */}
                    <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-100 gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-slate-500 font-medium">Urgency:</span>
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            isEmergency
                              ? 'bg-red-100 text-red-800 border border-red-300'
                              : triage.urgency === 'SEEK_PROMPT_CARE'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {triage.urgency}
                        </span>
                      </div>

                      {triage.recommendedAction && (
                        <p className="text-xs font-semibold text-slate-700 truncate max-w-xs">
                          {triage.recommendedAction}
                        </p>
                      )}
                    </div>

                    {/* Mandatory Disclaimer */}
                    <p className="text-[10px] text-slate-400 italic pt-1 leading-normal border-t border-slate-50">
                      ⚖️ {triage.disclaimer || 'MonikaCare AI is an automated triage assistant and does not replace medical advice.'}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {isLoading && (
          <div className="flex items-center gap-2 text-slate-500 text-xs py-2 px-3 bg-white rounded-xl max-w-xs border border-slate-200 shadow-sm animate-pulse">
            <Bot className="w-4 h-4 text-teal-600 animate-spin" />
            <span>MonikaCare AI is evaluating symptoms...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="p-3 bg-white border-t border-slate-200 flex-shrink-0">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Type symptoms or question (e.g. fever with headache)..."
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            disabled={isLoading}
            className="flex-1 bg-slate-100 border border-slate-200 focus:bg-white focus:border-teal-500 text-slate-900 text-sm px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all"
          />
          <button
            type="submit"
            disabled={!inputPrompt.trim() || isLoading}
            className="bg-teal-700 hover:bg-teal-800 active:scale-95 disabled:opacity-50 text-white p-2.5 rounded-xl font-semibold shadow-md shadow-teal-700/20 transition-all flex items-center justify-center"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
