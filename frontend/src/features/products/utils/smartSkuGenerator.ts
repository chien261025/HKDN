import { ProductCategory, StorageZoneReq, StorageConditionType } from '../types';

/**
 * Hàm loại bỏ dấu tiếng Việt chuẩn xác
 */
export function removeVietnameseTones(str: string): string {
  let s = str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  s = s.replace(/[đĐ]/g, 'd');
  return s.toLowerCase().trim();
}

export interface SmartProductAnalysis {
  sku: string;
  category: ProductCategory;
  categoryLabel: string;
  storageZone: StorageZoneReq;
  storageCondition: StorageConditionType;
  unit: string;
  isExpiryManaged: boolean;
  outboundStrategy: 'FEFO' | 'FIFO';
  shelfLifeDays: number;
  reason: string;
}

/**
 * Bộ Engine AI / Semantic Rule-based phân tích tên sản phẩm để sinh mã SKU và thuộc tính kho tự động
 */
export function analyzeProductAndGenerateSku(productName: string): SmartProductAnalysis {
  const clean = removeVietnameseTones(productName);
  const words = clean.split(/\s+/).filter(Boolean);
  const randomSuffix = Math.floor(100 + Math.random() * 900);

  // 1. Nhóm Nội thất / Bàn ghế (Furniture & Decor)
  const furnitureKeywords = [
    'ban', 'ghe', 'tu', 'giuong', 'sofa', 'ke', 'dem', 'guong', 'nem', 'ke sach',
    'ban lam viec', 'ban an', 'ghe xoay', 'cong thai hoc', 'noi that', 'gia go',
    'tu quan ao', 'tu bep', 'den chum', 'chan ga', 'go'
  ];
  if (furnitureKeywords.some(kw => clean.includes(kw))) {
    let tag = 'FURN';
    if (clean.includes('ban')) tag = 'BAN';
    else if (clean.includes('ghe')) tag = 'GHE';
    else if (clean.includes('tu')) tag = 'TU';
    else if (clean.includes('giuong')) tag = 'GIUONG';
    else if (clean.includes('sofa')) tag = 'SOFA';

    return {
      sku: `SKU-FURN-${tag}-${randomSuffix}`,
      category: 'GENERAL',
      categoryLabel: 'Nội Thất & Gia Dụng (Furniture)',
      storageZone: 'ZONE_A',
      storageCondition: 'AMBIENT',
      unit: 'Cái',
      isExpiryManaged: false,
      outboundStrategy: 'FIFO',
      shelfLifeDays: 0,
      reason: 'Nhận diện nhóm Nội Thất / Bàn Ghế (Kho Khô Zone A, không quản lý date)',
    };
  }

  // 2. Nhóm Điện tử & Công nghệ (Electronics)
  const elecKeywords = [
    'dien thoai', 'iphone', 'samsung', 'xiaomi', 'oppo', 'laptop', 'macbook', 'dell',
    'hp', 'asus', 'may tinh', 'pc', 'chuot', 'ban phim', 'tai nghe', 'airpods',
    'sac', 'cap', 'man hinh', 'tivi', 'tv', 'loa', 'ipad', 'tablet', 'camera',
    'pin', 'sac du phong', 'cpu', 'ram', 'ssd', 'o cung', 'linh kien'
  ];
  if (elecKeywords.some(kw => clean.includes(kw))) {
    let tag = 'DEV';
    if (clean.includes('iphone')) tag = 'IPHONE';
    else if (clean.includes('dien thoai') || clean.includes('phone')) tag = 'PHONE';
    else if (clean.includes('laptop') || clean.includes('macbook')) tag = 'LAPTOP';
    else if (clean.includes('tai nghe')) tag = 'AUDIO';
    else if (clean.includes('chuot') || clean.includes('ban phim')) tag = 'GEAR';

    const isHighValue = clean.includes('iphone') || clean.includes('macbook') || clean.includes('laptop') || clean.includes('ipad');

    return {
      sku: `SKU-ELEC-${tag}-${randomSuffix}`,
      category: 'ELECTRONICS',
      categoryLabel: 'Thiết Bị & Linh Kiện Điện Tử',
      storageZone: isHighValue ? 'ZONE_D' : 'ZONE_A',
      storageCondition: isHighValue ? 'SECURE' : 'AMBIENT',
      unit: 'Chiếc',
      isExpiryManaged: false,
      outboundStrategy: 'FIFO',
      shelfLifeDays: 0,
      reason: isHighValue
        ? 'Nhận diện Thiết bị Điện Tử Giá Trị Cao (Kho An Ninh Cao Zone D)'
        : 'Nhận diện Thiết Bị / Phụ Kiện Điện Tử (Kho Khô Zone A)',
    };
  }

  // 3. Nhóm Thời trang / Dệt may (Fashion)
  const fashionKeywords = [
    'ao', 'quan', 'vay', 'dam', 'giay', 'dep', 'non', 'mu', 'tat', 'vo',
    'that lung', 'vi', 'balo', 'tui xach', 'dong ho', 'so mi', 'polo',
    'jean', 'kaki', 'sneaker', 'khoac', 'hoodie'
  ];
  if (fashionKeywords.some(kw => clean.includes(kw))) {
    let tag = 'FASH';
    if (clean.includes('ao')) tag = 'AO';
    else if (clean.includes('quan')) tag = 'QUAN';
    else if (clean.includes('giay') || clean.includes('dep')) tag = 'SHOES';
    else if (clean.includes('balo') || clean.includes('tui')) tag = 'BAG';

    return {
      sku: `SKU-FASH-${tag}-${randomSuffix}`,
      category: 'FASHION',
      categoryLabel: 'Thời Trang & Dệt May',
      storageZone: 'ZONE_A',
      storageCondition: 'AMBIENT',
      unit: clean.includes('giay') || clean.includes('dep') || clean.includes('tat') ? 'Đôi' : 'Cái',
      isExpiryManaged: false,
      outboundStrategy: 'FIFO',
      shelfLifeDays: 0,
      reason: 'Nhận diện Nhóm Thời Trang & May Mặc (Kho Khô Zone A)',
    };
  }

  // 4. Nhóm Hóa mỹ phẩm / Tẩy rửa (Chemicals & Cosmetics)
  const chemKeywords = [
    'xa phong', 'dau goi', 'sua tam', 'nuoc giat', 'nuoc rua chen', 'nuoc lau nha',
    'son', 'con', 'tay rua', 'my pham', 'kem duong', 'son moi', 'xit phong', 'dung moi', 'hoa chat'
  ];
  if (chemKeywords.some(kw => clean.includes(kw))) {
    let tag = 'CHEM';
    if (clean.includes('giat')) tag = 'GIAT';
    else if (clean.includes('goi') || clean.includes('tam')) tag = 'BATH';
    else if (clean.includes('son')) tag = 'PAINT';

    return {
      sku: `SKU-CHEM-${tag}-${randomSuffix}`,
      category: 'CHEMICAL',
      categoryLabel: 'Hóa Mỹ Phẩm & Tẩy Rửa',
      storageZone: 'ZONE_A',
      storageCondition: 'AMBIENT',
      unit: clean.includes('giat') || clean.includes('son') ? 'Can' : 'Chai',
      isExpiryManaged: true,
      outboundStrategy: 'FEFO',
      shelfLifeDays: 730,
      reason: 'Nhận diện Nhóm Hóa Mỹ Phẩm / Tẩy Rửa (Quản lý HSD 2 năm)',
    };
  }

  // 5. Nhóm Dược phẩm & Y tế (Pharma)
  const pharmaKeywords = [
    'thuoc', 'paracetamol', 'panadol', 'vitamin', 'khau trang', 'bong bang',
    'kim tiem', 'y te', 'duoc', 'siro', 'khang sinh', 'vien nen', 'dung dich'
  ];
  if (pharmaKeywords.some(kw => clean.includes(kw))) {
    let tag = 'MED';
    if (clean.includes('khau trang')) tag = 'MASK';
    else if (clean.includes('thuoc')) tag = 'DRUG';

    return {
      sku: `SKU-MED-${tag}-${randomSuffix}`,
      category: 'PHARMACEUTICAL',
      categoryLabel: 'Dược Phẩm & Y Tế',
      storageZone: 'ZONE_A',
      storageCondition: 'AMBIENT',
      unit: 'Hộp',
      isExpiryManaged: true,
      outboundStrategy: 'FEFO',
      shelfLifeDays: 730,
      reason: 'Nhận diện Nhóm Dược Phẩm & Vật Tư Y Tế (Quản lý chuẩn FEFO)',
    };
  }

  // 6. Nhóm Thực phẩm & Đồ uống (Food & Beverage)
  const coolFoodKeywords = [
    'sua chua', 'bo', 'pho mai', 'kem', 'xuc xich', 'thit tuoi', 'ca hoi', 'chao tuoi', 'nem chua'
  ];
  const isCoolFood = coolFoodKeywords.some(kw => clean.includes(kw));

  const foodKeywords = [
    'nuoc mam', 'mam', 'sua', 'banh', 'keo', 'tra', 'ca phe', 'bia', 'ruou',
    'thit', 'ca', 'gao', 'mi', 'gia vi', 'dau an', 'nuoc ngot', 'snack', 'pate',
    'nuoc tuong', 'tuong ot', 'bot ngot', 'hat nem', 'muoi', 'duong'
  ];

  if (isCoolFood || foodKeywords.some(kw => clean.includes(kw)) || clean.includes('thuc pham')) {
    let tag = 'FOOD';
    if (clean.includes('nuoc mam') || clean.includes('mam')) tag = 'MAM';
    else if (clean.includes('sua chua')) tag = 'YOGURT';
    else if (clean.includes('sua')) tag = 'MILK';
    else if (clean.includes('bia')) tag = 'BEER';
    else if (clean.includes('ca phe') || clean.includes('coffee')) tag = 'CAFE';
    else if (clean.includes('banh') || clean.includes('keo')) tag = 'SNACK';
    else if (clean.includes('gao')) tag = 'RICE';

    return {
      sku: `SKU-FOOD-${tag}-${randomSuffix}`,
      category: 'FOOD_BEVERAGE',
      categoryLabel: 'Thực Phẩm & Đồ Uống (F&B)',
      storageZone: isCoolFood ? 'ZONE_B' : 'ZONE_A',
      storageCondition: isCoolFood ? 'COOL' : 'AMBIENT',
      unit: clean.includes('nuoc mam') || clean.includes('dau an') ? 'Chai' : 'Thùng',
      isExpiryManaged: true,
      outboundStrategy: 'FEFO',
      shelfLifeDays: isCoolFood ? 45 : 365,
      reason: isCoolFood
        ? 'Nhận diện Thực Phẩm Mát (Bắt buộc kho mát Zone B 2-8°C, FEFO)'
        : 'Nhận diện Thực Phẩm / Đồ Uống Khô (Kho Khô Zone A, quản lý hạn dùng)',
    };
  }

  // 7. Nhóm mặc định nếu không khớp từ khóa đặc biệt (General Merchandise)
  const initialWord = words[0] ? words[0].toUpperCase().slice(0, 4) : 'GEN';
  return {
    sku: `SKU-GEN-${initialWord}-${randomSuffix}`,
    category: 'GENERAL',
    categoryLabel: 'Hàng Tiêu Dùng Tổng Hợp',
    storageZone: 'ZONE_A',
    storageCondition: 'AMBIENT',
    unit: 'Kiện',
    isExpiryManaged: false,
    outboundStrategy: 'FIFO',
    shelfLifeDays: 0,
    reason: 'Nhận diện Hàng Hóa Tiêu Dùng (Kho Khô Zone A)',
  };
}

