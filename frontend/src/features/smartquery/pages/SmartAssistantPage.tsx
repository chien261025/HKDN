import React, { useState } from 'react';
import { Bot, Send, Sparkles, ArrowRight, Database } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  tableData?: Array<Record<string, any>>;
  actionPayload?: {
    actionType: string;
    label: string;
    targetUrl: string;
  };
}

export const SmartAssistantPage: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'ai',
      text: 'Xin chào Quản lý kho! Tôi là Trợ lý AI Smart WMS. Bạn có thể hỏi tôi về số liệu tồn kho, các lô hàng cận date, hoặc tỷ lệ lấp đầy các ô kệ.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: input,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Giả lập phản hồi thông minh từ backend
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: 'Tôi tìm thấy 2 lô hàng có hạn sử dụng dưới 30 ngày cần thanh lý gấp:',
        tableData: [
          { sku: 'SKU-MILK-01', batch: 'BATCH-2026-08', expiryDate: '2026-09-25', onHand: 150 },
          { sku: 'SKU-EGG-04', batch: 'BATCH-2026-09', expiryDate: '2026-09-30', onHand: 40 },
        ],
        actionPayload: {
          actionType: 'CREATE_LIQUIDATION_ORDER',
          label: 'Tạo phiếu xuất thanh lý giảm giá 40%',
          targetUrl: '/outbound/create?type=LIQUIDATION&batch=BATCH-2026-08',
        },
      };
      setMessages((prev) => [...prev, aiResponse]);
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] max-w-5xl mx-auto p-4">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
        <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-md shadow-indigo-100">
          <Bot className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            Trợ lý AI Truy vấn Kho Thông minh
            <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full border border-indigo-200 font-medium">
              Text-to-SQL Safe
            </span>
          </h1>
          <p className="text-xs text-slate-500">Hỏi đáp số liệu kho tự nhiên, phân tích cận date và gợi ý hành động</p>
        </div>
      </div>

      {/* Chat Messages Body */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.sender === 'ai' && (
              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
            )}
            <div
              className={`max-w-2xl rounded-2xl p-4 text-sm ${
                msg.sender === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-none'
                  : 'bg-white border border-slate-200 shadow-sm text-slate-700 rounded-bl-none'
              }`}
            >
              <p className="leading-relaxed">{msg.text}</p>

              {/* Table Data nếu có */}
              {msg.tableData && (
                <div className="mt-3 overflow-hidden rounded-lg border border-slate-200">
                  <table className="min-w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b">
                      <tr>
                        <th className="px-3 py-2">Mã SKU</th>
                        <th className="px-3 py-2">Lô hàng</th>
                        <th className="px-3 py-2">Hạn sử dụng</th>
                        <th className="px-3 py-2 text-right">Tồn kho</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {msg.tableData.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="px-3 py-1.5 font-medium">{row.sku}</td>
                          <td className="px-3 py-1.5 text-slate-500">{row.batch}</td>
                          <td className="px-3 py-1.5 text-rose-600 font-semibold">{row.expiryDate}</td>
                          <td className="px-3 py-1.5 text-right font-bold">{row.onHand}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Nút Hành Động Ngữ Cảnh (Action Payload) */}
              {msg.actionPayload && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => alert(`Chuyển hướng đến: ${msg.actionPayload?.targetUrl}`)}
                    className="flex items-center gap-2 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
                  >
                    <span>{msg.actionPayload.label}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center animate-pulse">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 text-xs text-slate-400">
              Đang phân tích ý định và truy vấn dữ liệu...
            </div>
          </div>
        )}
      </div>

      {/* Input Box */}
      <div className="pt-3 border-t border-slate-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ví dụ: 'Cho tôi xem các lô hàng sắp hết hạn trong 30 ngày tới'..."
            className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
          />
          <button
            onClick={handleSend}
            className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md shadow-indigo-100 flex items-center gap-2 text-sm font-semibold transition-all"
          >
            <Send className="w-4 h-4" />
            <span>Gửi</span>
          </button>
        </div>
      </div>
    </div>
  );
};
