import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SavedChatSession, SmartQueryHeader } from '../components/SmartQueryHeader';
import { ChatMessageItem } from '../components/ChatMessageItem';
import { ChatInputSection } from '../components/ChatInputSection';
import { AiDiagnosisCard } from '../components/AiDiagnosisCard';
import { KoraAvatar } from '../components/KoraAvatar';
import { SmartPromptGrid } from '../components/SmartPromptGrid';
import { ChatMessage } from '../types';
import { smartQueryApi } from '../services/smartQueryApi';
import { authService } from '../../auth/services/authService';
import { warehouseService, DEFAULT_WAREHOUSES } from '../../masterdata/services/warehouseService';

const LEGACY_STORAGE_KEY = 'kora_ai_chat_sessions_v1';
const MAX_SAVED_SESSIONS = 15;

const getUserStorageKey = (): string => {
  const username = (authService.getCurrentSession()?.username || 'guest').trim().toLowerCase();
  return `${LEGACY_STORAGE_KEY}_${username}`;
};

const loadSavedSessions = (storageKey: string): SavedChatSession[] => {
  try {
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const SmartAssistantPage: React.FC = () => {
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [selectedWarehouse, setSelectedWarehouse] = useState<string>(
    () => warehouseService.getActiveWarehouseId() || 'ALL'
  );
  const [warehouses, setWarehouses] = useState<Array<{ code: string; name: string }>>(() =>
    DEFAULT_WAREHOUSES.map((w) => ({ code: w.code, name: w.name }))
  );

  useEffect(() => {
    warehouseService
      .getWarehouses()
      .then((list) => {
        if (list && list.length > 0) {
          setWarehouses(list.map((w) => ({ code: w.code, name: w.name })));
        }
      })
      .catch(() => {});
  }, []);

  const storageKey = getUserStorageKey();
  const [sessions, setSessions] = useState<SavedChatSession[]>(() => loadSavedSessions(storageKey));
  const [activeSessionId, setActiveSessionId] = useState<string>(() => `sess-${Date.now()}`);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('Đang xác thực quyền kho...');

  useEffect(() => {
    setSessions(loadSavedSessions(storageKey));
    const newId = `sess-${Date.now()}`;
    setActiveSessionId(newId);
    try {
      const handoffRaw = sessionStorage.getItem('kora_ai_handoff_session_v1');
      if (handoffRaw) {
        sessionStorage.removeItem('kora_ai_handoff_session_v1');
        const handoff = JSON.parse(handoffRaw);
        if (Array.isArray(handoff?.messages) && handoff.messages.length > 0) {
          const wh = handoff.warehouseCode || selectedWarehouse || 'ALL';
          if (handoff.warehouseCode) setSelectedWarehouse(handoff.warehouseCode);
          setMessages(handoff.messages);
          persistSession(handoff.messages, wh, newId);
          return;
        }
      }
    } catch {
      // Ignore handoff parse errors
    }
    setMessages([]);
  }, [storageKey]);

  const quickPrompts = [
    'Tổng hợp sự cố tồn kho, đơn chờ xuất và lô hết hạn / QC Hold hiện tại',
    'Tại sao tồn vật lý nhiều nhưng tồn khả dụng thấp? (Kiểm tra Reserved & Blocked)',
    'Cho tôi xem các lô hàng sắp hết hạn trong 30 ngày tới',
    'Kiểm tra PO đang về hoặc hàng chờ cất lên kệ (Putaway)',
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (!loading) return;
    setLoadingStep('Đang xác thực quyền kho...');
    const t1 = setTimeout(() => setLoadingStep('Đang truy xuất dữ liệu MySQL...'), 1400);
    const t2 = setTimeout(() => setLoadingStep('Kora AI đang tổng hợp kết quả...'), 3500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [loading]);

  const persistSession = (nextMsgs: ChatMessage[], whCode: string, sessId: string) => {
    if (nextMsgs.length === 0) return;
    const firstUser = nextMsgs.find((m) => m.sender === 'user');
    const title = firstUser ? firstUser.text.slice(0, 60) : 'Cuộc trò chuyện Kora AI';
    const updated: SavedChatSession = {
      id: sessId,
      title,
      warehouseCode: whCode,
      updatedAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      messages: nextMsgs.slice(-20),
    };
    setSessions((prev) => {
      const nextList = [updated, ...prev.filter((s) => s.id !== sessId)].slice(0, MAX_SAVED_SESSIONS);
      try {
        localStorage.setItem(storageKey, JSON.stringify(nextList));
      } catch {
        // Ignore storage quota errors
      }
      return nextList;
    });
  };

  const handleClearHistory = () => {
    setActiveSessionId(`sess-${Date.now()}`);
    setMessages([]);
  };

  const handleSelectSession = (s: SavedChatSession) => {
    setActiveSessionId(s.id);
    setSelectedWarehouse(s.warehouseCode || 'ALL');
    setMessages(s.messages);
  };

  const handleDeleteSession = (id: string) => {
    setSessions((prev) => {
      const next = prev.filter((s) => s.id !== id);
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        // Ignore
      }
      return next;
    });
    if (id === activeSessionId) {
      handleClearHistory();
    }
  };

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString('vi-VN'),
      text: query,
    };

    const withUser = [...messages, userMsg];
    setMessages(withUser);
    setInput('');
    setLoading(true);

    try {
      const historyPayload = messages.slice(-4).map((m) => ({
        sender: m.sender,
        text: m.text.slice(0, 300),
      }));
      const result = await smartQueryApi.chat(query, selectedWarehouse, historyPayload);
      const nextMessages: ChatMessage[] = [
        ...withUser,
        {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          timestamp: new Date().toLocaleTimeString('vi-VN'),
          text: result.answer,
          sqlQuery: result.sqlQuery,
          astStatus: result.astStatus,
          executionTimeMs: result.executionTimeMs,
          tableData: result.tableData,
          diagnosis: result.diagnosis,
        },
      ];
      setMessages(nextMessages);
      persistSession(nextMessages, selectedWarehouse, activeSessionId);
    } catch (error: any) {
      const errMsgs: ChatMessage[] = [
        ...withUser,
        {
          id: `ai-error-${Date.now()}`,
          sender: 'ai',
          timestamp: new Date().toLocaleTimeString('vi-VN'),
          text:
            error?.response?.data?.message ||
            'Không thể kết nối Kora AI. Vui lòng kiểm tra cấu hình dịch vụ AI ở máy chủ.',
        },
      ];
      setMessages(errMsgs);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-104px)] min-h-[580px]">
      <SmartQueryHeader
        onClearHistory={handleClearHistory}
        messageCount={messages.length}
        warehouses={warehouses}
        selectedWarehouse={selectedWarehouse}
        onWarehouseChange={setSelectedWarehouse}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onDeleteSession={handleDeleteSession}
      />

      <div className="flex-1 overflow-y-auto py-6">
        {messages.length === 0 ? (
          <div className="max-w-2xl mx-auto h-full flex flex-col items-center justify-center text-center space-y-6 py-8">
            <KoraAvatar size="lg" />
            <div className="space-y-1.5">
              <h2 className="text-xl font-semibold text-slate-900 tracking-tight">
                Kora AI có thể giúp gì cho kho hàng hôm nay?
              </h2>
              <p className="text-sm text-slate-500 max-w-lg mx-auto">
                Hỏi về tồn kho chi nhánh, đơn xuất SO thiếu hàng, lô cận hạn hoặc thống kê theo phân khu — mọi số liệu đều đọc trực tiếp từ MySQL theo quyền RBAC.
              </p>
            </div>
            <div className="w-full text-left">
              <SmartPromptGrid
                prompts={quickPrompts}
                onSelect={(prompt) => void handleSend(prompt)}
                disabled={loading}
              />
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-6 px-1">
            {messages.map((msg) =>
              msg.sender === 'ai' && msg.diagnosis ? (
                <div key={msg.id} className="flex items-start gap-3.5">
                  <div className="mt-0.5">
                    <KoraAvatar size="md" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <AiDiagnosisCard
                      diagnosis={msg.diagnosis}
                      onNavigate={(url) => navigate(url)}
                    />
                  </div>
                </div>
              ) : (
                <ChatMessageItem
                  key={msg.id}
                  message={msg}
                  onNavigateAction={(url) => navigate(url)}
                />
              )
            )}

            {loading && (
              <div className="flex items-center gap-3">
                <KoraAvatar size="md" pulse />
                <span className="text-sm text-slate-500">{loadingStep}</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="pt-2 pb-1">
        <div className="max-w-4xl mx-auto">
          <ChatInputSection
            input={input}
            setInput={setInput}
            onSend={handleSend}
            loading={loading}
            quickPrompts={quickPrompts}
            showPrompts={messages.length > 0}
          />
        </div>
      </div>
    </div>
  );
};
