import React from 'react';
import { ProductCategory, StorageZoneReq } from '../types';

export const getCategoryBadge = (cat: ProductCategory, customName?: string): React.ReactNode => {
  switch (cat) {
    case 'FOOD_BEVERAGE':
      return (
        <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
          {customName || 'Thực Phẩm & Đồ Uống'}
        </span>
      );
    case 'CHEMICAL':
      return (
        <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-purple-50 text-purple-800 border border-purple-200">
          {customName || 'Hóa Mỹ Phẩm & Tẩy Rửa'}
        </span>
      );
    case 'ELECTRONICS':
      return (
        <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
          {customName || 'Thiết Bị Điện Tử'}
        </span>
      );
    case 'PHARMA':
    case 'PHARMACEUTICAL':
      return (
        <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-rose-50 text-rose-800 border border-rose-200">
          {customName || 'Dược Phẩm Y Tế'}
        </span>
      );
    case 'FASHION':
      return (
        <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-pink-50 text-pink-800 border border-pink-200">
          {customName || 'Thời Trang & Dệt May'}
        </span>
      );
    default:
      return (
        <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-800 border border-slate-200">
          {customName || 'Hàng Tổng Hợp'}
        </span>
      );
  }
};

export const getZoneBadge = (zone: StorageZoneReq | string): React.ReactNode => {
  if (zone === 'ZONE_B') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold bg-cyan-50 text-cyan-800 border border-cyan-200">
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse"></span>
        ZONE B (Mát 2-8°C)
      </span>
    );
  }
  if (zone === 'ZONE_C') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold bg-blue-50 text-blue-800 border border-blue-200">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
        ZONE C (Đông -18°C)
      </span>
    );
  }
  if (zone === 'ZONE_D') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200">
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
        ZONE D (Giá Trị Cao)
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold bg-amber-50 text-amber-800 border border-amber-200">
      ZONE A (Khô)
    </span>
  );
};
