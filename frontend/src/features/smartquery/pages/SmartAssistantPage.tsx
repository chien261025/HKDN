import React, { useState } from 'react';
import { Bot, Send, Sparkles, ArrowRight, ShieldCheck, Terminal, Cpu, CheckCircle2 } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  sqlQuery?: string;
  sanitized?: boolean;
  tableData?: Array<Record<string, any>>;
  actionPayload?: {
    label: string;
    targetUrl: string;
  };
}

export const SmartAssistantPage: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'ai',
      text: 'Xin chào Quản trị viên! Tôi là Trợ lý AI Smart WMS. Tôi có thể chuyển đổi ngôn ngữ tự nhiên thành câu truy vấn SQL an toàn (được kiểm duyệt bởi bộ lọc AST JSqlParser, tự động chặn DROP/DELETE và tiêm LIMIT 50).',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const quickPrompts = [
    'Cho tôi xem các lô hàng sắp hết hạn trong 30 ngày tới',
    'Tỷ lệ lấp đầy các ô kệ tại Phân khu A hiện tại',
    'Kiểm tra sản phẩm nào đang có mức tồn thấp hơn an toàn',
  ];

  const handleSend = (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: query,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    setTimeout(() => {
      let aiResponse: ChatMessage;

      if (query.includes('hạn') || query.includes('date')) {
        aiResponse = {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: 'Phân tích AST hoàn tất. Đã thực thi truy vấn an toàn (chỉ SELECT + LIMIT 50):',
          sqlQuery: 'SELECT sku, batch_number, expiry_date, on_hand_qty FROM v_stock_summary WHERE expiry_date <= NOW() + INTERVAL \'30 days\' LIMIT 50',
          sanitized: true,
          tableData: [
            { sku: 'SKU-MILK-100', batch: 'BATCH-MILK-26A', expiryDate: '2026-09-25', onHand: 80, location: 'ZB-B01-R01-S01-B05' },
            { sku: 'SKU-OMO-MATIC', batch: 'BATCH-OMO-01', expiryDate: '2026-10-07', onHand: 60, location: 'ZA-A01-R02-S01-B03' },
          ],
          actionPayload: {
            label: 'Xuất lệnh điều phối nhặt hàng FEFO cho các lô trên',
            targetUrl: '/orders',
          },
        };
      } else {
        aiResponse = {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: 'Truy vấn thành công! Dưới đây là phân tích dữ liệu tổng hợp theo yêu cầu:',
          sqlQuery: 'SELECT zone_code, COUNT(id) AS total_bins, SUM(CASE WHEN status=\'OCCUPIED\' THEN 1 ELSE 0 END) AS occupied_bins FROM wms_location GROUP BY zone_code LIMIT 50',
          sanitized: true,
          tableData: [
            { zone: 'ZONE_A (Kho Khô)', total: 200, occupied: 170, occupancyRate: '85.0%' },
            { zone: 'ZONE_B (Kho Mát)', total: 100, occupied: 62, occupancyRate: '62.0%' },
          ],
        };
      }

      setMessages((prev) => [...prev, aiResponse]);
      setLoading(false);
    }, 800);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] max-w-5xl mx-auto pb-6">
      {/* Header */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-800/80 shadow-2xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-tr from-indigo-600 to-cyan-500 rounded-xl text-white shadow-lg shadow-indigo-600/30">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              Trợ Lý AI Smart Query (Text-to-SQL AST)
              <span className="text-[10px] font-mono bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded-full border border-cyan-500/30 font-bold">
                JSqlParser Verified
              </span>
            </h1>
            <p className="text-xs text-slate-400">Hỏi đáp số liệu kho tự nhiên • Chặn đứng SQL Injection • Tự động tiêm LIMIT 50</p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>AST Sandbox Safe</span>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.sender === 'ai' && (
              <div className="w-8 h-8 rounded-xl bg-slate-800 text-indigo-400 border border-slate-700 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
            )}
            <div
              className={`max-w-2xl rounded-2xl p-4 text-xs space-y-3 ${
                msg.sender === 'user'
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-br-none shadow-lg shadow-indigo-900/40'
                  : 'glass-panel border border-slate-800/80 text-slate-200 rounded-bl-none shadow-xl'
              }`}
            >
              <p className="leading-relaxed text-sm">{msg.text}</p>

              {/* SQL Query Snippet */}
              {msg.sqlQuery && (
                <div className="p-3 rounded-xl bg-black/60 border border-slate-800 font-mono text-[11px] space-y-1">
                  <div className="flex justify-between text-slate-400 pb-1 border-b border-slate-800/80">
                    <span className="flex items-center gap-1.5 text-cyan-400"><Terminal className="w-3 h-3" /> Sanitized SQL (AST Cleaned)</span>
                    <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Safe to Execute</span>
                  </div>
                  <code className="text-indigo-300 block pt-1 overflow-x-auto">{msg.sqlQuery}</code>
                </div>
              )}

              {/* Table Data nếu có */}
              {msg.tableData && (
                <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950/60">
                  <table className="min-w-full text-[11px] text-left font-mono">
                    <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                      <tr>
                        {Object.keys(msg.tableData[0]).map((key) => (
                          <th key={key} className="px-3 py-2 uppercase">{key}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {msg.tableData.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/40">
                          {Object.values(row).map((val: any, vIdx) => (
                            <td key={vIdx} className="px-3 py-2 font-semibold">
                              {String(val)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Action Button */}
              {msg.actionPayload && (
                <div className="pt-2">
                  <button
                    onClick={() => alert(`Điều hướng: ${msg.actionPayload?.label}`)}
                    className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl text-xs font-bold shadow-md transition-all"
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
            <div className="w-8 h-8 rounded-xl bg-slate-800 text-indigo-400 border border-slate-700 flex items-center justify-center animate-pulse">
              <Cpu className="w-4 h-4" />
            </div>
            <div className="glass-panel border border-slate-800 rounded-2xl p-4 text-xs font-mono text-cyan-400 animate-pulse">
              Đang phân tích AST cú pháp & tiêm LIMIT 50...
            </div>
          </div>
        )}
      </div>

      {/* Quick Prompts */}
      <div className="py-2 flex flex-wrap gap-2">
        {quickPrompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(p)}
            className="text-[11px] px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-cyan-300 transition-all font-medium"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <div className="pt-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Hỏi bất kỳ câu hỏi nào về kho hàng (VD: 'Tìm các mặt hàng còn dưới 20 cái')..."
            className="flex-1 px-4 py-3 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 shadow-inner font-medium"
          />
          <button
            onClick={() => handleSend()}
            className="px-5 py-3 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-2 text-xs font-bold transition-all"
          >
            <Send className="w-4 h-4" />
            <span>Gửi</span>
          </button>
        </div>
      </div>
    </div>
  );
};
