import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SmartQueryHeader } from '../components/SmartQueryHeader';
import { ChatMessageItem } from '../components/ChatMessageItem';
import { ChatInputSection } from '../components/ChatInputSection';
import { AstSecuritySidebar } from '../components/AstSecuritySidebar';
import { ChatMessage } from '../types';

export const SmartAssistantPage: React.FC = () => {
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'ai',
      timestamp: 'Hệ Thống Sẵn Sàng',
      text: 'Xin chào Quản trị viên! Tôi là Trợ lý AI Smart WMS. Tôi có thể chuyển đổi ngôn ngữ tiếng Việt tự nhiên thành câu truy vấn SQL an toàn. Mọi câu lệnh đều được duyệt qua bộ lọc AST JSqlParser (chỉ cho phép SELECT, chặn đứng SQL Injection và tự động tiêm LIMIT 50).',
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

  const handleSend = (textToSend?: string) => {
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

    setTimeout(() => {
      let aiResponse: ChatMessage;
      const lower = query.toLowerCase();

      // Phân tích câu hỏi
      if (lower.includes('hạn') || lower.includes('fefo') || lower.includes('date')) {
        aiResponse = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          timestamp: new Date().toLocaleTimeString('vi-VN'),
          text: 'Phân tích AST hoàn tất. Đã thực thi truy vấn an toàn (chỉ SELECT + tự động tiêm LIMIT 50):',
          sqlQuery: "SELECT sku, batch_number, expiry_date, on_hand_qty, location_code FROM v_stock_summary WHERE expiry_date <= CURRENT_DATE + INTERVAL '30 days' ORDER BY expiry_date ASC LIMIT 50;",
          astStatus: 'LIMIT_INJECTED',
          executionTimeMs: 19,
          tableData: [
            { sku: 'SKU-MILK-100', batch: 'BATCH-MILK-26A', expiryDate: '2026-09-25', onHand: 80, location: 'ZB-B01-R01-S01-B05' },
            { sku: 'SKU-OMO-MATIC', batch: 'BATCH-OMO-01', expiryDate: '2026-10-07', onHand: 60, location: 'ZA-A01-R02-S01-B03' },
          ],
          actionPayload: {
            label: 'Chuyển sang Điều Phối Phân Bổ Xuất FEFO Cho Các Lô Này',
            targetUrl: '/inventory',
            type: 'warning',
          },
        };
      } else if (lower.includes('lấp đầy') || lower.includes('khu a') || lower.includes('khu b') || lower.includes('occupancy')) {
        aiResponse = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          timestamp: new Date().toLocaleTimeString('vi-VN'),
          text: 'Truy vấn thành công! Dưới đây là phân tích tỷ lệ lấp đầy tổng hợp theo từng phân khu:',
          sqlQuery: "SELECT zone_code, COUNT(id) AS total_bins, SUM(CASE WHEN status='OCCUPIED' THEN 1 ELSE 0 END) AS occupied_bins, ROUND(SUM(CASE WHEN status='OCCUPIED' THEN 1.0 ELSE 0.0 END) / COUNT(id) * 100, 1) || '%' AS occupancy_rate FROM wms_location GROUP BY zone_code LIMIT 50;",
          astStatus: 'VERIFIED',
          executionTimeMs: 14,
          tableData: [
            { zone: 'ZONE_A (Kho Khô & Điện Tử)', totalBins: 200, occupied: 170, empty: 30, occupancyRate: '85.0%' },
            { zone: 'ZONE_B (Kho Mát 2-8°C)', totalBins: 100, occupied: 62, empty: 38, occupancyRate: '62.0%' },
          ],
          actionPayload: {
            label: 'Mở Sơ Đồ Không Gian Ô Kệ 2D/3D',
            targetUrl: '/layout',
            type: 'primary',
          },
        };
      } else if (lower.includes('thấp hơn') || lower.includes('tồn') || lower.includes('dưới')) {
        aiResponse = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          timestamp: new Date().toLocaleTimeString('vi-VN'),
          text: 'Đã quét bảng tồn kho. Phát hiện 2 sản phẩm có số lượng khả dụng tiệm cận ngưỡng an toàn:',
          sqlQuery: "SELECT sku, product_name, SUM(on_hand_qty) AS total_on_hand, SUM(reserved_qty) AS total_reserved, (SUM(on_hand_qty) - SUM(reserved_qty)) AS available_qty FROM v_stock_summary GROUP BY sku, product_name HAVING (SUM(on_hand_qty) - SUM(reserved_qty)) < 30 ORDER BY available_qty ASC LIMIT 50;",
          astStatus: 'VERIFIED',
          executionTimeMs: 22,
          tableData: [
            { sku: 'SKU-SAMS-S24', product: 'Samsung Galaxy S24 Ultra', onHand: 25, reserved: 10, available: 15 },
            { sku: 'SKU-OMO-MATIC', product: 'Nước giặt OMO Matic 3.6kg', onHand: 60, reserved: 45, available: 15 },
          ],
        };
      } else {
        aiResponse = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          timestamp: new Date().toLocaleTimeString('vi-VN'),
          text: `Đã xử lý yêu cầu "${query}". Cú pháp SQL an toàn được sinh như sau:`,
          sqlQuery: "SELECT id, transaction_type, delta_qty, reference_code, created_at FROM stock_ledger ORDER BY created_at DESC LIMIT 50;",
          astStatus: 'VERIFIED',
          executionTimeMs: 16,
          tableData: [
            { id: 108, type: 'INBOUND', delta: '+100', ref: 'PO-2026-001', time: '10/09/2026 22:45' },
            { id: 107, type: 'OUTBOUND', delta: '-20', ref: 'SO-2026-888', time: '10/09/2026 22:30' },
            { id: 106, type: 'RESERVED', delta: '+15', ref: 'SO-2026-889', time: '10/09/2026 22:15' },
          ],
        };
      }

      setMessages((prev) => [...prev, aiResponse]);
      setLoading(false);
    }, 700);
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
        <div className="lg:col-span-8 flex flex-col h-[calc(100vh-210px)] min-h-[550px] bg-[#070c17]/60 rounded-2xl border border-slate-800/80 p-4 shadow-2xl backdrop-blur-md">
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
              <div className="flex gap-3 items-center p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs font-mono text-cyan-400 animate-pulse">
                <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></div>
                <span>Đang phân tích cây cú pháp AST JSqlParser & kiểm tra whitelist an toàn...</span>
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
        <div className="lg:col-span-4 h-[calc(100vh-210px)] min-h-[550px] overflow-y-auto pr-1 scrollbar-thin">
          <AstSecuritySidebar
            onSimulateAttack={handleSimulateAttack}
            disabled={loading}
          />
        </div>
      </div>
    </div>
  );
};
