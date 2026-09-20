import React, { useState } from 'react';
import { X, ClipboardCheck, Calendar, User, Layers, EyeOff } from 'lucide-react';
import { AuditSession } from '../types';

interface CreateAuditSessionModalProps {
  onClose: () => void;
  onCreateSession: (session: AuditSession) => void;
}

export const CreateAuditSessionModal: React.FC<CreateAuditSessionModalProps> = ({
  onClose,
  onCreateSession,
}) => {
  const [title, setTitle] = useState('Kiểm kê định kỳ Quý 3/2026 (Đếm Mù)');
  const [scope, setScope] = useState('Toàn Bộ Kho (Khu A & Khu B)');
  const [assignedOperator, setAssignedOperator] = useState('Trần Văn Thao (Thủ kho hiện trường)');
  const [startDate, setStartDate] = useState('2026-09-10');
  const [notes, setNotes] = useState('Áp dụng phương pháp Blind Count. Thủ kho chỉ nhập số lượng đếm bằng mắt thường.');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const auditCode = `AUD-2026-${Math.floor(10 + Math.random() * 90)}`;

    const newSession: AuditSession = {
      id: `aud-${Date.now()}`,
      auditCode,
      title,
      scope,
      startDate,
      status: 'COUNTING',
      totalBins: 40,
      countedBins: 0,
      discrepanciesCount: 0,
      assignedOperator,
      notes,
      items: [
        {
          id: 'item-1',
          locationBarcode: 'ZA-A01-R01-S01-B01',
          sku: 'SKU-SAMS-S24',
          productName: 'Samsung Galaxy S24 Ultra',
          batchNumber: 'BATCH-S24-01',
          systemQty: 25,
          countedQty: 25,
          differenceQty: 0,
          unit: 'Hộp',
          countedBy: 'Trần Văn Thao',
        },
        {
          id: 'item-2',
          locationBarcode: 'ZB-B01-R01-S01-B05',
          sku: 'SKU-MILK-100',
          productName: 'Sữa tươi Vinamilk 100% 1L',
          batchNumber: 'BATCH-MILK-26A',
          systemQty: 80,
          countedQty: 78,
          differenceQty: -2,
          unit: 'Thùng',
          countedBy: 'Trần Văn Thao',
          notes: 'Phát hiện thiếu 2 thùng so với số sách (rách bao bì ngoài bãi)',
        },
      ],
    };

    onCreateSession(newSession);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden text-slate-800">
        {/* Header */}
        <div className="p-4 md:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg text-slate-900">Tạo Đợt Kiểm Kê Kho Mới</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 md:p-6 space-y-4 text-sm">
          {/* Tiêu đề */}
          <div>
            <label className="text-slate-700 font-semibold block mb-1">Tên Đợt Kiểm Kê:</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
            />
          </div>

          {/* Phạm vi */}
          <div>
            <label className="text-slate-700 font-semibold block mb-1">Phạm Vi / Phân Khu Kiểm Kê:</label>
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 cursor-pointer"
            >
              <option value="Toàn Bộ Kho (Khu A & Khu B)">Toàn Bộ Kho (Khu A & Khu B)</option>
              <option value="Phân Khu A: Hàng Khô & Điện Tử">Phân Khu A: Hàng Khô & Điện Tử</option>
              <option value="Phân Khu B: Kho Mát (2-8°C)">Phân Khu B: Kho Mát (2-8°C)</option>
            </select>
          </div>

          {/* Phân công thủ kho & Ngày bắt đầu */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-700 font-semibold block mb-1">Phân Công Thủ Kho:</label>
              <input
                type="text"
                value={assignedOperator}
                onChange={(e) => setAssignedOperator(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="text-slate-700 font-semibold block mb-1">Ngày Bắt Đầu:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>
          </div>

          {/* Blind count notice */}
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-xs text-emerald-800">
            <EyeOff className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-600" />
            <span>
              <strong>Cơ chế Đếm Mù tự động kích hoạt:</strong> Màn hình PDA của Thủ kho sẽ được ẩn toàn bộ số lượng tồn kho hệ thống để đảm bảo số liệu đếm khách quan 100%.
            </span>
          </div>

          {/* Ghi chú */}
          <div>
            <label className="text-slate-700 font-semibold block mb-1">Chỉ Đạo Kiểm Kê:</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
            />
          </div>

          {/* Footer buttons */}
          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold text-sm transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition-all active:scale-95"
            >
              Phát Động Đợt Kiểm Kê
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
