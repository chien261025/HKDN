import React, { useState } from 'react';
import { ReportsHeader } from '../components/ReportsHeader';
import { ReportTemplateSelector } from '../components/ReportTemplateSelector';
import { ReportJobsFeed } from '../components/ReportJobsFeed';
import { ReportOverviewPanel } from '../components/ReportOverviewPanel';
import { ReportJob, ReportTemplate } from '../types';

export const ReportsPage: React.FC = () => {
  const [jobs, setJobs] = useState<ReportJob[]>([
    {
      id: 'EXP-202610-9821',
      reportCode: 'RPT-LEDGER',
      reportTitle: 'Sổ Cái Thẻ Kho & Bút Toán Đối Soát',
      category: 'Kiểm Toán & Kế Toán',
      format: 'EXCEL',
      status: 'COMPLETED',
      statusLabel: 'Sẵn sàng tải về',
      progress: 100,
      totalRows: 50000,
      createdAt: '15 phút trước',
      completedAt: '15 phút trước',
      fileSize: '4.2 MB',
      requestedBy: 'Nguyễn Quản Trị (Admin)',
      downloadUrl: '#',
    },
    {
      id: 'EXP-202610-7734',
      reportCode: 'RPT-EXPIRY',
      reportTitle: 'Cân Đối Tồn & Hạn Dùng (FEFO/FIFO)',
      category: 'Quản Lý Hạn Sử Dụng',
      format: 'EXCEL',
      status: 'COMPLETED',
      statusLabel: 'Sẵn sàng tải về',
      progress: 100,
      totalRows: 15000,
      createdAt: '1 giờ trước',
      completedAt: '1 giờ trước',
      fileSize: '1.8 MB',
      requestedBy: 'Trưởng Ca Vận Hành',
      downloadUrl: '#',
    },
  ]);

  const [isProcessing, setIsProcessing] = useState(false);

  const handleTriggerExport = (template: ReportTemplate) => {
    setIsProcessing(true);
    const randomHex = Math.floor(1000 + Math.random() * 9000);
    const newJobId = `EXP-202610-${randomHex}`;

    const newJob: ReportJob = {
      id: newJobId,
      reportCode: template.code,
      reportTitle: template.title,
      category: template.category,
      format: template.format,
      status: 'INITIALIZING',
      statusLabel: 'Đang kết nối CSDL kho vận...',
      progress: 25,
      totalRows: parseInt(template.estimatedRows.replace(/\D/g, '')) || 10000,
      createdAt: 'Vừa xong',
      requestedBy: 'Nguyễn Quản Trị (Admin)',
    };

    setJobs((prev) => [newJob, ...prev]);

    // Giai đoạn 2: Trích xuất & tổng hợp dữ liệu
    setTimeout(() => {
      setJobs((prev) =>
        prev.map((j) =>
          j.id === newJobId
            ? {
                ...j,
                status: 'EXTRACTING',
                statusLabel: 'Đang tổng hợp dòng dữ liệu...',
                progress: 65,
              }
            : j
        )
      );
    }, 800);

    // Giai đoạn 3: Định dạng bảng tính Excel
    setTimeout(() => {
      setJobs((prev) =>
        prev.map((j) =>
          j.id === newJobId
            ? {
                ...j,
                status: 'FORMATTING',
                statusLabel: 'Đang kết xuất bảng tính Excel (.xlsx)...',
                progress: 90,
              }
            : j
        )
      );
    }, 1800);

    // Giai đoạn 4: Hoàn thành sẵn sàng tải về
    setTimeout(() => {
      setJobs((prev) =>
        prev.map((j) =>
          j.id === newJobId
            ? {
                ...j,
                status: 'COMPLETED',
                statusLabel: 'Sẵn sàng tải về',
                progress: 100,
                fileSize: template.estimatedSize,
                completedAt: 'Vừa xong',
                downloadUrl: '#',
              }
            : j
        )
      );
      setIsProcessing(false);
    }, 2800);
  };

  const handleDownload = (job: ReportJob) => {
    const timestamp = new Date().toISOString().slice(0, 10);
    const safeTitle = job.reportTitle.replace(/[^\w\s\u00C0-\u1EF9]/gi, '_').replace(/\s+/g, '_');
    const fileName = `${safeTitle}_${timestamp}.csv`;

    let csvContent = '\uFEFF'; // UTF-8 BOM để Excel hiển thị tiếng Việt chuẩn
    csvContent += `BÁO CÁO KHO VẬN: ${job.reportTitle.toUpperCase()}\n`;
    csvContent += `Mã tệp: ${job.id}, Kỳ báo cáo: Tháng 10/2026, Người trích xuất: ${job.requestedBy}, Thời gian: ${new Date().toLocaleString('vi-VN')}\n\n`;

    if (job.reportCode === 'RPT-LEDGER') {
      csvContent += `STT,Mã Chứng Từ,Thời Gian,Loại Giao Dịch,Mã SKU,Tên Hàng Hóa,Vị Trí Ô Kệ,Số Lượng,Đơn Vị,Số Dư Trước,Số Dư Sau,Ghi Chú Đối Soát\n`;
      csvContent += `1,GR-2026-001,2026-10-27 08:30,Nhập kho PO,SKU-MILK-100,Sữa Tươi Tiệt Trùng 1L,A-01-02-01,1000,Thùng,500,1500,Nhập hàng nhà cung cấp Vinamilk\n`;
      csvContent += `2,DO-2026-089,2026-10-27 10:15,Xuất kho SO,SKU-BEER-330,Bia Heineken Sleek 330ml,B-02-01-03,200,Thùng,850,650,Xuất giao siêu thị Go!\n`;
      csvContent += `3,TR-2026-012,2026-10-27 14:00,Điều chuyển nội bộ,SKU-WATER-500,Nước Khoáng Lavie 500ml,A-03-01-02,150,Thùng,300,450,Đảo vị trí lấy hàng nhanh\n`;
      csvContent += `4,ADJ-2026-005,2026-10-27 16:45,Cân đối kiểm kê,SKU-COCA-330,Coca Cola Nguyên Bản 330ml,B-01-03-02,+5,Thùng,120,125,Bù chênh lệch sau đợt kiểm kê mù\n`;
    } else if (job.reportCode === 'RPT-EXPIRY') {
      csvContent += `STT,Mã SKU,Tên Hàng Hóa,Mã Lô Hàng,Ngày Sản Xuất,Hạn Sử Dụng,Số Ngày Còn Lại,Tồn Khả Dụng,Vị Trí Lưu Kho,Phân Loại Date\n`;
      csvContent += `1,SKU-MILK-100,Sữa Tươi Tiệt Trùng 1L,BAT-2026-A1,2026-05-01,2026-11-15,19,450,A-01-02-01,CẬN DATE KHẨN CẤP (< 30 ngày)\n`;
      csvContent += `2,SKU-YOGURT-04,Sữa Chua Lên Men,BAT-2026-B2,2026-08-10,2026-12-05,39,1200,A-02-01-04,Cảnh báo (30-60 ngày)\n`;
      csvContent += `3,SKU-BEER-330,Bia Heineken Sleek 330ml,BAT-2026-C3,2026-07-20,2027-04-15,170,3500,B-02-01-03,An toàn (> 90 ngày)\n`;
    } else if (job.reportCode === 'RPT-SLOTTING') {
      csvContent += `STT,Mã Ô Kệ,Phân Khu,Tải Trọng Tối Đa (kg),Tải Trọng Thực Tế (kg),Tỷ Lệ Tải Trọng (%),Thể Tích Khả Dụng (m3),Trạng Thái Sức Chứa\n`;
      csvContent += `1,A-01-01-01,Zone A - Hàng Tiêu Dùng,1500,1350,90.0%,0.2,Sức chứa tối ưu\n`;
      csvContent += `2,A-01-01-02,Zone A - Hàng Tiêu Dùng,1500,450,30.0%,1.8,Còn chỗ trống\n`;
      csvContent += `3,B-02-01-01,Zone B - Đồ Uống & Rượu,2000,1950,97.5%,0.1,Cảnh báo gần đầy tải\n`;
    } else {
      csvContent += `STT,Mã Đơn Hàng,Loại Đơn,Thời Gian Tiếp Nhận,Thời Gian Hoàn Tất,Thời Gian Chu Kỳ (Phút),Nhân Sự Lấy Hàng,Đạt Chuẩn SLA\n`;
      csvContent += `1,SO-202610-001,Xuất Bán Lẻ,2026-10-27 08:00,2026-10-27 08:35,35,Nguyễn Văn A,ĐẠT (SLA < 45m)\n`;
      csvContent += `2,SO-202610-002,Xuất Đại Lý,2026-10-27 09:15,2026-10-27 10:10,55,Trần Văn B,ĐẠT (SLA < 60m)\n`;
      csvContent += `3,PO-202610-088,Nhập NCC,2026-10-27 10:00,2026-10-27 11:20,80,Lê Hoàng C,ĐẠT (SLA < 90m)\n`;
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleRemoveJob = (id: string) => {
    setJobs((prev) => prev.filter((j) => j.id !== id));
  };

  const completedCount = jobs.filter((j) => j.status === 'COMPLETED').length;
  const activeCount = jobs.filter((j) => j.status !== 'COMPLETED').length;

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-8">
      {/* 1. Header Doanh Nghiệp Chuẩn */}
      <ReportsHeader
        completedJobsCount={completedCount}
        activeJobsCount={activeCount}
      />

      {/* 2. Danh Mục Mẫu Báo Cáo Nghiệp Vụ */}
      <ReportTemplateSelector
        onTriggerExport={handleTriggerExport}
        isProcessing={isProcessing}
      />

      {/* 3. Bố Cục 2 Cột: Bảng Tải Báo Cáo (8 cols) + Bảng Điều Hành & Lịch Tự Động (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-1">
        {/* CỘT TRÁI (8 COLS): TRUNG TÂM TẢI VỀ & LỊCH SỬ BÁO CÁO */}
        <div className="lg:col-span-8">
          <ReportJobsFeed
            jobs={jobs}
            onDownload={handleDownload}
            onRemoveJob={handleRemoveJob}
          />
        </div>

        {/* CỘT PHẢI (4 COLS): CHỈ SỐ DOANH NGHIỆP, LỊCH TỰ ĐỘNG & BẢO MẬT */}
        <div className="lg:col-span-4">
          <ReportOverviewPanel />
        </div>
      </div>
    </div>
  );
};
