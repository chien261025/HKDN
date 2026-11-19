-- V7: Enrich Product Master Data with Pricing, Dimensions, Brand, Origin, Image, Capacity & Business Status
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

ALTER TABLE wms_product
    ADD COLUMN IF NOT EXISTS description VARCHAR(500) NULL AFTER name,
    ADD COLUMN IF NOT EXISTS brand VARCHAR(100) NULL AFTER unit,
    ADD COLUMN IF NOT EXISTS origin VARCHAR(100) NULL AFTER brand,
    ADD COLUMN IF NOT EXISTS image_url VARCHAR(500) NULL AFTER origin,
    ADD COLUMN IF NOT EXISTS storage_condition VARCHAR(50) DEFAULT 'AMBIENT' AFTER image_url,
    ADD COLUMN IF NOT EXISTS weight_kg DECIMAL(10,2) DEFAULT 1.00 AFTER storage_condition,
    ADD COLUMN IF NOT EXISTS length_cm DECIMAL(10,2) DEFAULT 20.00 AFTER weight_kg,
    ADD COLUMN IF NOT EXISTS width_cm DECIMAL(10,2) DEFAULT 15.00 AFTER length_cm,
    ADD COLUMN IF NOT EXISTS height_cm DECIMAL(10,2) DEFAULT 10.00 AFTER width_cm,
    ADD COLUMN IF NOT EXISTS max_stock INT DEFAULT 500 AFTER reorder_point,
    ADD COLUMN IF NOT EXISTS purchase_price DECIMAL(15,2) DEFAULT 0.00 AFTER max_stock,
    ADD COLUMN IF NOT EXISTS selling_price DECIMAL(15,2) DEFAULT 0.00 AFTER purchase_price,
    ADD COLUMN IF NOT EXISTS business_status VARCHAR(30) DEFAULT 'ACTIVE' AFTER selling_price;

-- Seed rich enterprise data for existing 15 items
UPDATE wms_product SET
    brand = 'Vinamilk',
    origin = 'Việt Nam',
    description = 'Sữa tươi tiệt trùng nguyên chất 100% từ sữa bò tươi tự nhiên, đóng hộp tiện lợi 1 lít.',
    storage_condition = 'COOL',
    weight_kg = 1.05,
    length_cm = 10.00,
    width_cm = 8.00,
    height_cm = 20.00,
    max_stock = 600,
    purchase_price = 28000.00,
    selling_price = 34500.00,
    business_status = 'ACTIVE',
    image_url = 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300&auto=format&fit=crop&q=80'
WHERE sku = 'SKU-MILK-100';

UPDATE wms_product SET
    brand = 'Samsung',
    origin = 'Hàn Quốc',
    description = 'Flagship smartphone Snapdragon 8 Gen 3, Camera 200MP, Màn hình Dynamic AMOLED 2X, Kèm bút S-Pen.',
    storage_condition = 'SECURE',
    weight_kg = 0.35,
    length_cm = 16.30,
    width_cm = 7.90,
    height_cm = 0.86,
    max_stock = 60,
    purchase_price = 24500000.00,
    selling_price = 29990000.00,
    business_status = 'ACTIVE',
    image_url = 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=300&auto=format&fit=crop&q=80'
WHERE sku = 'SKU-SAMS-S24';

UPDATE wms_product SET
    brand = 'Unilever',
    origin = 'Việt Nam',
    description = 'Nước giặt chuyên dụng cho máy giặt cửa trên, công nghệ xoáy sâu đánh bật vết bẩn cứng đầu.',
    storage_condition = 'AMBIENT',
    weight_kg = 3.65,
    length_cm = 25.00,
    width_cm = 12.00,
    height_cm = 35.00,
    max_stock = 300,
    purchase_price = 165000.00,
    selling_price = 215000.00,
    business_status = 'ACTIVE',
    image_url = 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=300&auto=format&fit=crop&q=80'
WHERE sku = 'SKU-OMO-MATIC';

UPDATE wms_product SET
    brand = 'Vinamilk',
    origin = 'Việt Nam',
    description = 'Sữa chua lên men tự nhiên giàu canxi và lợi khuẩn, lốc 4 hộp x 100g.',
    storage_condition = 'COOL',
    weight_kg = 0.45,
    length_cm = 14.00,
    width_cm = 14.00,
    height_cm = 7.00,
    max_stock = 800,
    purchase_price = 22000.00,
    selling_price = 28000.00,
    business_status = 'ACTIVE',
    image_url = 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=300&auto=format&fit=crop&q=80'
WHERE sku = 'SKU-YOGURT-04';

UPDATE wms_product SET
    brand = 'Heineken',
    origin = 'Hà Lan',
    description = 'Bia cao cấp thùng 24 lon sleek 330ml hương vị sảng khoái đậm đà tinh khiết.',
    storage_condition = 'AMBIENT',
    weight_kg = 8.50,
    length_cm = 40.00,
    width_cm = 27.00,
    height_cm = 15.00,
    max_stock = 1000,
    purchase_price = 385000.00,
    selling_price = 435000.00,
    business_status = 'ACTIVE',
    image_url = 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=300&auto=format&fit=crop&q=80'
WHERE sku = 'SKU-BEER-330';

UPDATE wms_product SET
    brand = 'Coca-Cola',
    origin = 'Mỹ',
    description = 'Nước ngọt có gas truyền thống sảng khoái, quy cách thùng 24 lon x 330ml.',
    storage_condition = 'AMBIENT',
    weight_kg = 8.40,
    length_cm = 40.00,
    width_cm = 27.00,
    height_cm = 15.00,
    max_stock = 1000,
    purchase_price = 195000.00,
    selling_price = 240000.00,
    business_status = 'ACTIVE',
    image_url = 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=300&auto=format&fit=crop&q=80'
WHERE sku = 'SKU-COCA-330';

UPDATE wms_product SET
    brand = 'Lavie',
    origin = 'Việt Nam',
    description = 'Nước khoáng thiên nhiên đóng chai từ nguồn khoáng ngầm, thùng 24 chai x 500ml.',
    storage_condition = 'AMBIENT',
    weight_kg = 12.50,
    length_cm = 38.00,
    width_cm = 26.00,
    height_cm = 22.00,
    max_stock = 1200,
    purchase_price = 85000.00,
    selling_price = 110000.00,
    business_status = 'ACTIVE',
    image_url = 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=300&auto=format&fit=crop&q=80'
WHERE sku = 'SKU-WATER-500';

UPDATE wms_product SET
    brand = 'Trung Nguyên',
    origin = 'Việt Nam',
    description = 'Cà phê hòa tan G7 3in1 công nghệ sấy lạnh nano hương thơm lôi cuốn, hộp 18 gói x 16g.',
    storage_condition = 'AMBIENT',
    weight_kg = 0.35,
    length_cm = 18.00,
    width_cm = 10.00,
    height_cm = 8.00,
    max_stock = 600,
    purchase_price = 45000.00,
    selling_price = 58000.00,
    business_status = 'ACTIVE',
    image_url = 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300&auto=format&fit=crop&q=80'
WHERE sku = 'SKU-COF-G7';

UPDATE wms_product SET
    brand = 'TH True Milk',
    origin = 'Việt Nam',
    description = 'Trà ô long tự nhiên thanh mát chuẩn vị trà nguyên bản, thùng 24 chai x 350ml.',
    storage_condition = 'AMBIENT',
    weight_kg = 9.00,
    length_cm = 36.00,
    width_cm = 24.00,
    height_cm = 18.00,
    max_stock = 800,
    purchase_price = 175000.00,
    selling_price = 210000.00,
    business_status = 'ACTIVE',
    image_url = 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=300&auto=format&fit=crop&q=80'
WHERE sku = 'SKU-TEA-TH';

UPDATE wms_product SET
    brand = 'Apple',
    origin = 'Mỹ',
    description = 'Flagship Apple iPhone 16 Pro Max chip Apple A18 Pro, Khung Titanium siêu bền, Cụm 3 camera 48MP.',
    storage_condition = 'SECURE',
    weight_kg = 0.38,
    length_cm = 16.30,
    width_cm = 7.70,
    height_cm = 0.82,
    max_stock = 60,
    purchase_price = 30500000.00,
    selling_price = 34990000.00,
    business_status = 'ACTIVE',
    image_url = 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=300&auto=format&fit=crop&q=80'
WHERE sku = 'SKU-APPL-IP16';

UPDATE wms_product SET
    brand = 'Apple',
    origin = 'Mỹ',
    description = 'Tai nghe chống ồn chủ động ANC thế hệ 2 chip H2, Hộp sạc MagSafe cổng Type-C.',
    storage_condition = 'SECURE',
    weight_kg = 0.15,
    length_cm = 10.00,
    width_cm = 10.00,
    height_cm = 4.00,
    max_stock = 100,
    purchase_price = 4800000.00,
    selling_price = 5690000.00,
    business_status = 'ACTIVE',
    image_url = 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=300&auto=format&fit=crop&q=80'
WHERE sku = 'SKU-APPL-AIRP';

UPDATE wms_product SET
    brand = 'Unilever',
    origin = 'Việt Nam',
    description = 'Nước xả vải đậm đặc hương hoa quyến rũ, lưu hương thơm ngát suốt ngày dài, can 3.2L.',
    storage_condition = 'AMBIENT',
    weight_kg = 3.30,
    length_cm = 20.00,
    width_cm = 12.00,
    height_cm = 32.00,
    max_stock = 300,
    purchase_price = 175000.00,
    selling_price = 225000.00,
    business_status = 'ACTIVE',
    image_url = 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=300&auto=format&fit=crop&q=80'
WHERE sku = 'SKU-COMFORT-3';

UPDATE wms_product SET
    brand = 'Unilever',
    origin = 'Việt Nam',
    description = 'Dầu gội bổ sung tinh dầu bồ kết và mica óng ánh giúp mái tóc óng mượt rạng ngời, chai vòi 650g.',
    storage_condition = 'AMBIENT',
    weight_kg = 0.75,
    length_cm = 8.00,
    width_cm = 6.00,
    height_cm = 24.00,
    max_stock = 400,
    purchase_price = 110000.00,
    selling_price = 145000.00,
    business_status = 'ACTIVE',
    image_url = 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=300&auto=format&fit=crop&q=80'
WHERE sku = 'SKU-SUNSILK-6';

UPDATE wms_product SET
    brand = 'Nestle',
    origin = 'Việt Nam',
    description = 'Nước tương Maggi đậm đặc công nghệ lên men tự nhiên từ hạt đậu nành chọn lọc, chai 700ml.',
    storage_condition = 'AMBIENT',
    weight_kg = 0.85,
    length_cm = 7.50,
    width_cm = 7.50,
    height_cm = 28.00,
    max_stock = 500,
    purchase_price = 26000.00,
    selling_price = 33000.00,
    business_status = 'ACTIVE',
    image_url = 'https://images.unsplash.com/photo-1546554137-f86b9593a222?w=300&auto=format&fit=crop&q=80'
WHERE sku = 'SKU-MAGGI-700';

UPDATE wms_product SET
    brand = 'Masan',
    origin = 'Việt Nam',
    description = 'Nước mắm Chinsu Cá Hồi hương thơm lừng vị đậm đà truyền thống, chai thủy tinh 500ml.',
    storage_condition = 'AMBIENT',
    weight_kg = 0.70,
    length_cm = 7.00,
    width_cm = 7.00,
    height_cm = 26.00,
    max_stock = 500,
    purchase_price = 38000.00,
    selling_price = 47000.00,
    business_status = 'ACTIVE',
    image_url = 'https://images.unsplash.com/photo-1514733670139-4d87a1941d55?w=300&auto=format&fit=crop&q=80'
WHERE sku = 'SKU-CHINSU-500';
