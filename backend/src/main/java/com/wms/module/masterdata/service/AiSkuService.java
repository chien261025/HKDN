package com.wms.module.masterdata.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.wms.module.masterdata.dto.AiSkuSuggestionDto;
import com.wms.module.smartquery.ai.AiLlmProperties;
import com.wms.module.smartquery.ai.GeminiClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.util.Random;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiSkuService {

    private final GeminiClient geminiClient;
    private final AiLlmProperties aiLlmProperties;
    private final ObjectMapper objectMapper;
    private final Random random = new Random();

    private static final String SYSTEM_PROMPT = """
            Bạn là chuyên gia WMS quản trị danh mục sản phẩm (Master Data Catalog Manager).
            Nhiệm vụ: Phân tích tên sản phẩm người dùng cung cấp và sinh mã SKU cùng các thuộc tính kho vận tối ưu theo chuẩn quốc tế.
            Chỉ trả về DUY NHẤT một chuỗi JSON hợp lệ, KHÔNG markdown, KHÔNG codefence:
            {
              "sku": "SKU-[NHOM]-[TEN_TAT]-[RANDOM_3_SO]",
              "category": "FOOD_BEVERAGE|ELECTRONICS|CHEMICAL|PHARMACEUTICAL|FASHION|GENERAL",
              "categoryLabel": "Tên tiếng Việt hiển thị của ngành hàng",
              "storageZone": "ZONE_A|ZONE_B|ZONE_C|ZONE_D",
              "storageCondition": "AMBIENT|COOL|COLD|SECURE",
              "unit": "Đơn vị tính phù hợp (Cái, Chai, Thùng, Hộp, Chiếc, Đôi, Can...)",
              "isExpiryManaged": true hoặc false,
              "outboundStrategy": "FEFO hoặc FIFO",
              "shelfLifeDays": số ngày sử dụng (0 nếu không quản lý hạn dùng),
              "reason": "Lý do phân tích ngắn gọn của AI"
            }
            Quy tắc nghiệp vụ:
            - Bàn, ghế, tủ, giường, nội thất: SKU-FURN-, category GENERAL, Zone A (Kho Khô), Không quản lý hạn dùng (FIFO), ĐVT Cái/Bộ.
            - Thực phẩm khô (nước mắm, gạo, mì, bia): SKU-FOOD-, category FOOD_BEVERAGE, Zone A, quản lý hạn dùng (FEFO).
            - Thực phẩm mát/lạnh (sữa chua, bơ, phô mai, thịt): SKU-FOOD-, category FOOD_BEVERAGE, Zone B (Mát 2-8C), FEFO.
            - Điện thoại, laptop, thiết bị điện tử giá trị: SKU-ELEC-, category ELECTRONICS, Zone D (An ninh cao) hoặc Zone A, FIFO, ĐVT Chiếc.
            - Quần áo, thời trang: SKU-FASH-, category FASHION, Zone A, FIFO, ĐVT Cái/Đôi.
            - Hóa mỹ phẩm, nước giặt, sơn: SKU-CHEM-, category CHEMICAL, Zone A, FEFO, ĐVT Chai/Can.
            - Dược phẩm, thuốc, y tế: SKU-MED-, category PHARMACEUTICAL, Zone A/B, FEFO, ĐVT Hộp/Vỉ.
            """;

    public AiSkuSuggestionDto suggestSku(String productName) {
        if (productName == null || productName.isBlank()) {
            return generateFallback("Sản phẩm mới");
        }

        // 1. Thử gọi Google Gemini AI nếu có API Key
        if (aiLlmProperties.isEnabled() && aiLlmProperties.getApiKey() != null && !aiLlmProperties.getApiKey().isBlank()) {
            try {
                log.info("Goi Google Gemini 1.5 de phan tich SKU cho: {}", productName);
                String responseText = geminiClient.generate(SYSTEM_PROMPT, "Tên sản phẩm: " + productName.trim(), true);
                String cleanJson = stripCodeFence(responseText);
                JsonNode node = objectMapper.readTree(cleanJson);

                return AiSkuSuggestionDto.builder()
                        .sku(node.path("sku").asText("SKU-GEN-" + (100 + random.nextInt(900))))
                        .category(node.path("category").asText("GENERAL"))
                        .categoryLabel(node.path("categoryLabel").asText("Hàng Tiêu Dùng Tổng Hợp"))
                        .storageZone(node.path("storageZone").asText("ZONE_A"))
                        .storageCondition(node.path("storageCondition").asText("AMBIENT"))
                        .unit(node.path("unit").asText("Cái"))
                        .isExpiryManaged(node.path("isExpiryManaged").asBoolean(false))
                        .outboundStrategy(node.path("outboundStrategy").asText("FIFO"))
                        .shelfLifeDays(node.path("shelfLifeDays").asInt(0))
                        .reason("Google Gemini 1.5: " + node.path("reason").asText("Phân tích ngữ nghĩa sản phẩm thành công"))
                        .aiPowered(true)
                        .build();
            } catch (Exception ex) {
                log.warn("Gemini AI API khong kha dung hoac gap loi, tu dong chuyen sang Semantic Fallback: {}", ex.getMessage());
            }
        }

        // 2. Fallback Heuristic Semantic Engine nếu Gemini chưa cấu hình key hoặc offline
        return generateFallback(productName);
    }

    private AiSkuSuggestionDto generateFallback(String productName) {
        String clean = removeTones(productName.toLowerCase());
        int randomSuffix = 100 + random.nextInt(900);

        // 1. Dược phẩm & Y tế
        if (hasAny(clean, "thuoc", "paracetamol", "panadol", "vitamin", "khau trang", "kim tiem", "y te", "duoc", "khang sinh", "siro")) {
            return AiSkuSuggestionDto.builder()
                    .sku("SKU-MED-DRUG-" + randomSuffix)
                    .category("PHARMACEUTICAL")
                    .categoryLabel("Dược Phẩm & Y Tế")
                    .storageZone("ZONE_A")
                    .storageCondition("AMBIENT")
                    .unit("Hộp")
                    .isExpiryManaged(true)
                    .outboundStrategy("FEFO")
                    .shelfLifeDays(730)
                    .reason("AI Semantic Engine: Nhận diện Dược Phẩm & Y Tế (Quản lý hạn dùng FEFO)")
                    .aiPowered(false)
                    .build();
        }

        // 2. Hóa mỹ phẩm & Tẩy rửa
        if (hasAny(clean, "nuoc giat", "xa phong", "dau goi", "sua tam", "nuoc rua chen", "nuoc lau nha", "son", "tay rua", "hoa chat", "omo", "downy", "comfort", "sunlight", "ariel")) {
            String tag = clean.contains("giat") || clean.contains("omo") ? "GIAT" : clean.contains("son") ? "PAINT" : "CHEM";
            return AiSkuSuggestionDto.builder()
                    .sku("SKU-CHEM-" + tag + "-" + randomSuffix)
                    .category("CHEMICAL")
                    .categoryLabel("Hóa Mỹ Phẩm & Tẩy Rửa")
                    .storageZone("ZONE_A")
                    .storageCondition("AMBIENT")
                    .unit(clean.contains("giat") || clean.contains("omo") ? "Can" : "Chai")
                    .isExpiryManaged(true)
                    .outboundStrategy("FEFO")
                    .shelfLifeDays(730)
                    .reason("AI Semantic Engine: Nhận diện Hóa Mỹ Phẩm / Tẩy Rửa (HSD 2 năm, FEFO)")
                    .aiPowered(false)
                    .build();
        }

        // 3. Thực phẩm mát / lạnh (Kho Mát Zone B)
        if (hasAny(clean, "sua chua", "bo", "pho mai", "kem", "xuc xich", "thit tuoi", "ca hoi", "hai san", "rau sach")) {
            String tag = clean.contains("sua chua") ? "YOGURT" : clean.contains("thit") ? "MEAT" : "COOL";
            return AiSkuSuggestionDto.builder()
                    .sku("SKU-FOOD-" + tag + "-" + randomSuffix)
                    .category("FOOD_BEVERAGE")
                    .categoryLabel("Thực Phẩm & Đồ Uống (F&B)")
                    .storageZone("ZONE_B")
                    .storageCondition("COOL")
                    .unit(clean.contains("sua chua") ? "Hộp" : "Khay")
                    .isExpiryManaged(true)
                    .outboundStrategy("FEFO")
                    .shelfLifeDays(45)
                    .reason("AI Semantic Engine: Nhận diện Thực Phẩm Mát (Kho Mát Zone B 2-8°C, FEFO)")
                    .aiPowered(false)
                    .build();
        }

        // 4. Điện tử & Thiết bị công nghệ
        if (hasAny(clean, "dien thoai", "iphone", "samsung", "laptop", "macbook", "dell", "may tinh", "chuot", "ban phim", "tai nghe", "airpods", "sac", "man hinh", "tivi", "loa", "ipad", "camera")) {
            boolean isHighValue = hasAny(clean, "iphone", "macbook", "laptop", "ipad", "camera");
            String tag = clean.contains("iphone") ? "IPHONE" : clean.contains("laptop") || clean.contains("macbook") ? "LAPTOP" : clean.contains("tai nghe") ? "AUDIO" : "DEV";
            return AiSkuSuggestionDto.builder()
                    .sku("SKU-ELEC-" + tag + "-" + randomSuffix)
                    .category("ELECTRONICS")
                    .categoryLabel("Thiết Bị & Linh Kiện Điện Tử")
                    .storageZone(isHighValue ? "ZONE_D" : "ZONE_A")
                    .storageCondition(isHighValue ? "SECURE" : "AMBIENT")
                    .unit("Chiếc")
                    .isExpiryManaged(false)
                    .outboundStrategy("FIFO")
                    .shelfLifeDays(0)
                    .reason("AI Semantic Engine: Nhận diện Thiết Bị Công Nghệ (" + (isHighValue ? "Kho An Ninh Cao Zone D" : "Kho Khô Zone A") + ")")
                    .aiPowered(false)
                    .build();
        }

        // 5. Nội thất / Bàn ghế / Gia dụng
        if (hasAny(clean, "ban", "ghe", "giuong", "sofa", "noi that", "ke sach", "dem", "nem", "tu quan ao", "tu bep", "tu sat", "tu go", "tu sach") || productName.toLowerCase().contains("tủ")) {
            String tag = clean.contains("ban") ? "BAN" : clean.contains("ghe") ? "GHE" : (clean.contains("tu") || productName.toLowerCase().contains("tủ")) ? "TU" : clean.contains("sofa") ? "SOFA" : "FURN";
            return AiSkuSuggestionDto.builder()
                    .sku("SKU-FURN-" + tag + "-" + randomSuffix)
                    .category("GENERAL")
                    .categoryLabel("Nội Thất & Gia Dụng (Furniture)")
                    .storageZone("ZONE_A")
                    .storageCondition("AMBIENT")
                    .unit("Cái")
                    .isExpiryManaged(false)
                    .outboundStrategy("FIFO")
                    .shelfLifeDays(0)
                    .reason("AI Semantic Engine: Nhận diện nhóm Nội Thất / Bàn Ghế (Kho Khô Zone A, không quản lý date)")
                    .aiPowered(false)
                    .build();
        }

        // 6. Thời trang & May mặc
        if (hasAny(clean, "ao", "quan", "vay", "dam", "giay", "dep", "non", "mu", "tat", "that lung", "balo", "tui xach", "dong ho", "so mi", "polo", "jean")) {
            String tag = clean.contains("ao") ? "AO" : clean.contains("quan") ? "QUAN" : clean.contains("giay") ? "SHOES" : "FASH";
            return AiSkuSuggestionDto.builder()
                    .sku("SKU-FASH-" + tag + "-" + randomSuffix)
                    .category("FASHION")
                    .categoryLabel("Thời Trang & Dệt May")
                    .storageZone("ZONE_A")
                    .storageCondition("AMBIENT")
                    .unit(hasAny(clean, "giay", "dep", "tat") ? "Đôi" : "Cái")
                    .isExpiryManaged(false)
                    .outboundStrategy("FIFO")
                    .shelfLifeDays(0)
                    .reason("AI Semantic Engine: Nhận diện Nhóm Thời Trang & May Mặc (Kho Khô Zone A)")
                    .aiPowered(false)
                    .build();
        }

        // 7. Mặc định Thực phẩm & Đồ uống khô (F&B)
        String foodTag = clean.contains("mam") ? "MAM" : clean.contains("sua") ? "MILK" : clean.contains("bia") ? "BEER" : clean.contains("gao") ? "RICE" : "FOOD";
        return AiSkuSuggestionDto.builder()
                .sku("SKU-FOOD-" + foodTag + "-" + randomSuffix)
                .category("FOOD_BEVERAGE")
                .categoryLabel("Thực Phẩm & Đồ Uống (F&B)")
                .storageZone("ZONE_A")
                .storageCondition("AMBIENT")
                .unit(clean.contains("mam") ? "Chai" : "Thùng")
                .isExpiryManaged(true)
                .outboundStrategy("FEFO")
                .shelfLifeDays(365)
                .reason("AI Semantic Engine: Nhận diện Thực Phẩm / Đồ Uống Khô (Kho Khô Zone A, FEFO)")
                .aiPowered(false)
                .build();
    }

    private boolean hasAny(String text, String... keywords) {
        for (String kw : keywords) {
            String regex = "(?i)(^|[\\s.,_/-])" + java.util.regex.Pattern.quote(kw) + "($|[\\s.,_/-])";
            if (java.util.regex.Pattern.compile(regex).matcher(text).find()) {
                return true;
            }
        }
        return false;
    }

    private String removeTones(String str) {
        String nfdNormalized = Normalizer.normalize(str, Normalizer.Form.NFD);
        return nfdNormalized.replaceAll("[\\p{InCombiningDiacriticalMarks}]", "").replace("đ", "d").replace("Đ", "D");
    }

    private String stripCodeFence(String value) {
        if (value == null) return "{}";
        return value.replace("```json", "").replace("```", "").trim();
    }
}

