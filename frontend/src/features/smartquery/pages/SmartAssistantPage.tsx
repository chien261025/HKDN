import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SmartQueryHeader } from '../components/SmartQueryHeader';
import { ChatMessageItem } from '../components/ChatMessageItem';
import { ChatInputSection } from '../components/ChatInputSection';
import { AstSecuritySidebar } from '../components/AstSecuritySidebar';
import { ChatMessage } from '../types';
import { smartQueryApi } from '../services/smartQueryApi';

export const SmartAssistantPage: React.FC = () => {
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'ai',
      timestamp: 'Hệ Thống Sẵn Sàng',
      text: 'Chào bạn! Hệ thống hỗ trợ tra cứu nhanh các chỉ số kho vận qua câu hỏi tự nhiên. Bạn có thể tra cứu tồn kho, tìm các lô hàng cận date (FEFO), thống kê tỷ lệ lấp đầy ô kệ hoặc kiểm tra biến động thẻ kho.',
    },
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const quickPrompts = [
    'Cho tôi xem các lô hàng sắp hết hạn trong 30 ngày tới (FEFO)',
    'Tỷ lệ lấp đầy các ô kệ tại Phân khu A hiện tại',
    'Kiểm tra sản phẩm nào đang có mức tồn thấp hơn 20 cái',
    'Lịch sử biến động thẻ kho 24h gần nhất',
  ];

  // Auto scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleClearHistory = () => {
    setMessages([
      {
        id: 'welcome-reset',
        sender: 'ai',
        timestamp: new Date().toLocaleTimeString('vi-VN'),
        text: 'Lịch sử hội thoại đã được làm mới. Mời bạn đặt câu hỏi liên quan đến dữ liệu kho!',
      },
    ]);
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

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const result = await smartQueryApi.chat(query);
      setMessages((prev) => [...prev, {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        timestamp: new Date().toLocaleTimeString('vi-VN'),
        text: result.answer,
        sqlQuery: result.sqlQuery,
        astStatus: result.astStatus,
        executionTimeMs: result.executionTimeMs,
        tableData: result.tableData,
      }]);
    } catch (error: any) {
      setMessages((prev) => [...prev, {
        id: `ai-error-${Date.now()}`,
        sender: 'ai',
        timestamp: new Date().toLocaleTimeString('vi-VN'),
        text: error?.response?.data?.message || 'Không thể kết nối trợ lý Gemini. Vui lòng kiểm tra cấu hình GEMINI_API_KEY ở backend.',
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Xử lý khi người dùng bấm nút thử nghiệm tấn công SQL Injection
  const handleSimulateAttack = (attackSql: string) => {
    const userMsg: ChatMessage = {
      id: `attack-user-${Date.now()}`,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString('vi-VN'),
      text: `[TEST ATTACK] Thử nghiệm thực thi câu lệnh phá hoại: ${attackSql}`,
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    setTimeout(() => {
      let reason = 'Phát hiện câu lệnh nguy hại: Bộ phân tích AST chỉ cho phép câu lệnh SELECT.';
      if (attackSql.includes('DROP')) {
        reason = 'Cảnh báo AST: Cú pháp chứa lệnh [DropTableStatement]. Hành vi xóa bảng cơ sở dữ liệu bị chặn đứng 100%!';
      } else if (attackSql.includes('UPDATE')) {
        reason = 'Cảnh báo AST: Cú pháp chứa lệnh [UpdateStatement]. Thay đổi dữ liệu trực tiếp qua AI bị cấm triệt để để bảo vệ tính toàn vẹn!';
      } else if (attackSql.includes('DELETE')) {
        reason = 'Cảnh báo AST: Cú pháp chứa lệnh [DeleteStatement]. Sổ cái kho stock_ledger là cấu trúc bất biến (Append-Only), nghiêm cấm xóa!';
      }

      const aiRejection: ChatMessage = {
        id: `attack-ai-${Date.now()}`,
        sender: 'ai',
        timestamp: new Date().toLocaleTimeString('vi-VN'),
        text: 'CẢNH BÁO BẢO MẬT: Câu lệnh bị từ chối trước khi gửi đến PostgreSQL!',
        sqlQuery: attackSql,
        astStatus: 'REJECTED',
        astRejectionReason: reason,
        executionTimeMs: 4,
      };

      setMessages((prev) => [...prev, aiRejection]);
      setLoading(false);
    }, 500);
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-6">
      {/* 1. Header component */}
      <SmartQueryHeader
        onClearHistory={handleClearHistory}
        messageCount={messages.length}
      />

      {/* 2. Grid 8 : 4 Master-Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* CỘT TRÁI (8 COLS): KHU VỰC HỘI THOẠI & KẾT QUẢ TRUY VẤN */}
        <div className="lg:col-span-8 flex flex-col h-[calc(100vh-210px)] min-h-[550px] bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          {/* Scrollable Message Stream */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin">
            {messages.map((msg) => (
              <ChatMessageItem
                key={msg.id}
                message={msg}
                onNavigateAction={(url) => navigate(url)}
              />
            ))}

            {loading && (
              <div className="flex gap-3 items-center p-3.5 rounded-xl bg-indigo-50/80 border border-indigo-200 text-xs font-mono text-indigo-700 animate-pulse">
                <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-ping"></div>
                <span className="font-semibold">Đang phân tích cây cú pháp AST JSqlParser & kiểm tra whitelist an toàn...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input & Suggestion Chips Section */}
          <ChatInputSection
            input={input}
            setInput={setInput}
            onSend={handleSend}
            loading={loading}
            quickPrompts={quickPrompts}
          />
        </div>

        {/* CỘT PHẢI (4 COLS): HÀNG RÀO BẢO VỆ AST, THỬ NGHIỆM TẤN CÔNG & LƯỢC ĐỒ BẢNG */}
        {/* <div className="lg:col-span-4 h-[calc(100vh-210px)] min-h-[550px] overflow-y-auto pr-1 scrollbar-thin">
          <AstSecuritySidebar
            onSimulateAttack={handleSimulateAttack}
            disabled={loading}
          />
        </div> */}
      </div>
    </div>
  );
};
