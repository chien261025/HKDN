import React from 'react';
import { ProductCategory } from '../types';

export const getCategoryBadge = (cat: ProductCategory): React.ReactNode => {
  switch (cat) {
    case 'FOOD_BEVERAGE':
      return <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">Thực Phẩm & Đồ Uống</span>;
    case 'CHEMICAL':
      return <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-purple-50 text-purple-800 border border-purple-200">Hóa Chất / Dung Môi</span>;
    case 'ELECTRONICS':
      return <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">Linh Kiện Điện Tử</span>;
    case 'PHARMA':
      return <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-rose-50 text-rose-800 border border-rose-200">Dược Phẩm Y Tế</span>;
    default:
      return <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-800 border border-slate-200">Hàng Tổng Hợp</span>;
  }
};

export const getZoneBadge = (zone: 'ZONE_A' | 'ZONE_B'): React.ReactNode => {
  if (zone === 'ZONE_B') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold bg-blue-50 text-blue-800 border border-blue-200">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
        ZONE B (Mát 2-8°C)
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold bg-amber-50 text-amber-800 border border-amber-200">
      ZONE A (Khô)
    </span>
  );
};
