import React from 'react';
import { OutboundStock } from '../../outbound/types';
import { PRIMARY_WAREHOUSE } from '../../../config/warehouse';

export const WarehouseClosingBalances: React.FC<{ balances: OutboundStock[] }> = ({ balances }) => {
  const products = balances.filter(p => p.warehouseId === PRIMARY_WAREHOUSE.id && p.onHandQty > 0);
  return <section className="rounded-xl border border-slate-200 bg-white p-4">
    <h2 className="font-bold text-slate-900">Tồn cuối sản phẩm trong kho ({products.length})</h2>
    <p className="mb-3 mt-1 text-xs text-slate-500">{PRIMARY_WAREHOUSE.name} · Số dư hiện tại sau các giao dịch nhập, xuất và điều chỉnh.</p>
    <div className="max-h-72 overflow-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50"><tr><th className="p-2">SKU</th><th className="p-2">Sản phẩm</th><th className="p-2">Đơn vị</th><th className="p-2">Tồn cuối</th><th className="p-2">Khả dụng để xuất</th></tr></thead>
        <tbody>{products.map(p => <tr key={p.productId} className="border-t">
          <td className="p-2 font-mono text-xs">{p.sku}</td><td className="p-2">{p.name}</td><td className="p-2">{p.unit}</td>
          <td className="p-2 font-semibold tabular-nums text-emerald-700">{p.onHandQty.toLocaleString('vi-VN')}</td><td className="p-2 tabular-nums">{p.availableQty.toLocaleString('vi-VN')}</td>
        </tr>)}</tbody>
      </table>
      {products.length === 0 && <p className="p-3 text-sm text-slate-500">Chưa có sản phẩm còn tồn trong kho.</p>}
    </div>
  </section>;
};
