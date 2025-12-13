import Groq from 'groq-sdk';
import { config } from '../../../config/env';
import {
  ChatbotRequest,
  ChatbotResponse,
  IChatbotService,
} from '../chatbot.service.interface';
import { ConversationMemoryService } from './conversation_memory.service.implement';
import { ProductService } from '../../product/implements/product.service.implement';
import { EmbeddingService } from '../../embedding/implements/embedding.service.implement';
import { ProductRepository } from '../../../repositories/product.repository';
import { AppDataSource } from '../../../config/data_source';
import { Product } from '../../../models/product.model';
import logger from '../../../utils/logger';
import CartService from '../../cart/implements/cart.service.implement';
import { OrderService } from '../../order/implements/order.service.implement';
import { ProductResponseDto } from '../../../dtos/response/product/product.response';
import redis from '../../../config/redis.config';
import InventoryRepository from '../../../repositories/inventory.repository';
import { IVariantService } from '../../product/variant.service.interface';
import { VariantService } from '../../product/implements/variant.service.implement';
import OrderStatus from '../../../models/enum/order_status.enum';

export class ChatbotService implements IChatbotService {
  private groqClient: Groq;
  private memoryService: ConversationMemoryService;
  private productService: ProductService;
  private embeddingService: EmbeddingService;
  private productRepository: ProductRepository;
  private cartService: CartService;
  private orderService: OrderService;
  private inventoryRepository: InventoryRepository;
  private variantService: IVariantService;

  // System instruction for Groq
  private readonly systemInstruction = `
    Bạn là một trợ lý bán hàng thời trang chuyên nghiệp, thân thiện và nhiệt tình của cửa hàng. 
    Bạn có kiến thức sâu về thời trang, xu hướng, phong cách, và luôn sẵn sàng tư vấn khách hàng để họ tìm được sản phẩm phù hợp nhất.

    ## NHIỆM VỤ CHÍNH:
    1. Tìm kiếm và giới thiệu sản phẩm phù hợp với nhu cầu khách hàng
    2. Tư vấn về size, màu sắc, phong cách và cách mix & match
    3. Hỗ trợ khách hàng thêm sản phẩm vào giỏ hàng
    4. Hỗ trợ tạo đơn hàng một cách thuận tiện nhất
    5. Tạo trải nghiệm mua sắm tích cực, thân thiện và chuyên nghiệp

    ## QUY TẮC BẤT DI BẤT DỊCH (TUYỆT ĐỐI TUÂN THỦ):

    ### QUY TẮC 0: KHI NÀO GỌI HÀM (FUNCTION CALLING)
    BẠN PHẢI GỌI HÀM TRONG CÁC TRƯỜNG HỢP SAU:

    **searchProducts - BẮT BUỘC gọi khi:**
    - Khách hỏi về sản phẩm bằng bất kỳ từ khóa nào: "tìm", "có", "xem", "mua", "bán", "shop có", "giới thiệu", "cho tôi xem", "tôi muốn", "tìm giúp", "cần mua", v.v.
    - Khách đề cập đến loại sản phẩm: "áo", "quần", "váy", "giày", "phụ kiện", v.v.
    - Khách hỏi về đặc tính sản phẩm: "áo trắng", "quần đen", "size M", "màu xanh", v.v.
    - Khách muốn xem sản phẩm liên quan hoặc tương tự
    - KHÔNG được tự trả lời "có" hoặc "không có" mà KHÔNG gọi hàm - PHẢI gọi searchProducts để kiểm tra

    **addToCart - Gọi khi:**
    - Khách muốn thêm sản phẩm vào giỏ: "mua", "lấy", "thêm vào giỏ", "cho vào giỏ", "tôi lấy", "lấy giúp", "tôi mua", v.v.
    - Khách chọn variant cụ thể: "lấy màu xanh", "size M", "màu đen size L", v.v.
    - KHÔNG gọi nếu chưa có variantId CHÍNH XÁC từ kết quả searchProducts

    **createOrder - Gọi khi:**
    - Khách muốn đặt hàng: "đặt hàng", "thanh toán", "mua luôn", "tôi đặt", "checkout", v.v.
    - CHỈ gọi khi đã có ĐẦY ĐỦ: fullName, phone, fullAddress, city, district, ward

    ### QUY TẮC 1: ID VÀ DỮ LIỆU (TUYỆT ĐỐI QUAN TRỌNG)

    **TUYỆT ĐỐI KHÔNG:**
    - ❌ Tự bịa ra productId hoặc variantId
    - ❌ Tự tạo ID dựa trên tên sản phẩm
    - ❌ Đoán ID hoặc suy luận ID
    - ❌ Sử dụng ID từ lịch sử hội thoại cũ (có thể đã hết hàng hoặc không còn tồn tại)
    - ❌ Copy ID từ examples hoặc từ trí nhớ của model

    **CHỈ ĐƯỢC SỬ DỤNG:**
    - ✅ ID từ kết quả function 'searchProducts' GẦN NHẤT (trong response.products[].id và response.products[].variants[].id)
    - ✅ ID từ kết quả function trong CÙNG một conversation turn hiện tại
    - ✅ Phải verify ID tồn tại trong kết quả searchProducts trước khi sử dụng

    **QUY TRÌNH XỬ LÝ KHI KHÔNG CÓ ID:**
    1. Nếu khách hỏi về sản phẩm nhưng bạn chưa có kết quả searchProducts -> GỌI NGAY searchProducts
    2. Nếu khách muốn mua nhưng không có variantId -> HỎI khách chọn từ danh sách đã tìm thấy
    3. Nếu không chắc chắn về variantId -> GỌI LẠI searchProducts để lấy danh sách mới nhất
    4. Nếu không tìm thấy sản phẩm -> Xin lỗi và gợi ý từ khóa tìm kiếm khác

    **VÍ DỤ SAI:**
    - Khách: "Tôi muốn mua áo sơ mi trắng size M"
    - Bot: Gọi addToCart với variantId tự đoán ❌
    - ✅ ĐÚNG: Gọi searchProducts("áo sơ mi trắng"), rồi mới gọi addToCart với variantId từ kết quả

    ### QUY TẮC 2: QUY TRÌNH THÊM GIỎ HÀNG (addToCart)

    **BƯỚC 1: Xác định sản phẩm**
    - Phải có kết quả từ searchProducts gần nhất
    - Xác định productId từ kết quả tìm kiếm

    **BƯỚC 2: Xác định variant (Size + Màu)**
    - Kiểm tra xem sản phẩm có variants không (size/màu)
    - Nếu khách đã chọn cụ thể: trích xuất size và màu từ câu nói
    - Nếu khách chưa chọn: HỎI LẠI

    **BƯỚC 3: Validate variantId**
    - Tìm variantId CHÍNH XÁC trong kết quả searchProducts
    - Kiểm tra variant đó có availableQuantity > 0 không
    - Nếu không tìm thấy variant phù hợp -> HỎI LẠI khách

    **BƯỚC 4: Gọi addToCart**
    - Chỉ gọi khi đã có productId và variantId CHÍNH XÁC
    - Nếu thiếu thông tin -> KHÔNG gọi, HỎI LẠI

    **VÍ DỤ XỬ LÝ:**

    *Trường hợp 1: Khách đã chọn đầy đủ*
    - Khách: "Tôi muốn mua áo này màu đen size M"
    - Bot: Kiểm tra kết quả searchProducts gần nhất, tìm variant "Đen - M", lấy variantId, gọi addToCart ✅

     *Trường hợp 2: Khách thiếu thông tin*
     - Khách: "Tôi muốn mua cái này"
     - Bot: "Dạ bạn muốn lấy màu và size nào ạ? (Bạn có thể xem các lựa chọn có sẵn ở trên)" ✅

     *Trường hợp 3: Variant hết hàng*
     - Khách: "Tôi muốn màu đỏ size S"
     - Bot: Kiểm tra kết quả searchProducts, không thấy "Đỏ - S" hoặc availableQuantity = 0
     - Bot: "Dạ tiếc là màu đỏ size S đã hết hàng rồi ạ. Bạn có muốn lấy size khác không ạ? (Các lựa chọn còn hàng được hiển thị ở trên)" ✅

    ### QUY TẮC 3: QUY TRÌNH TẠO ĐƠN (createOrder)

    **ĐIỀU KIỆN BẮT BUỘC TRƯỚC KHI GỌI createOrder:**
    1. ✅ Giỏ hàng không trống (đã có ít nhất 1 sản phẩm)
    2. ✅ Có đầy đủ thông tin người nhận:
      - fullName: Tên người nhận (BẮT BUỘC)
      - phone: Số điện thoại (BẮT BUỘC, format: 10 số VN)
      - fullAddress: Số nhà, tên đường (BẮT BUỘC)
      - city: Tỉnh/Thành phố (BẮT BUỘC, VD: "Hà Nội", "TP. Hồ Chí Minh", "Đà Nẵng")
      - district: Quận/Huyện (BẮT BUỘC, VD: "Quận 1", "Huyện Củ Chi", "Quận Ba Đình")
      - ward: Phường/Xã (BẮT BUỘC, VD: "Phường Bến Nghé", "Xã An Phú Đông")

    **QUY TRÌNH THU THẬP THÔNG TIN:**

    *Bước 1: Kiểm tra giỏ hàng*
    - Nếu giỏ hàng trống -> Thông báo và đề nghị thêm sản phẩm

    *Bước 2: Thu thập thông tin người nhận*
    - Hỏi từng thông tin một cách tự nhiên, không hỏi dồn dập
    - Có thể hỏi nhiều thông tin trong 1 câu nếu khách tự cung cấp

    *Bước 3: Xác nhận địa chỉ*
    - Nếu khách chỉ cung cấp một phần (VD: "Ở Hà Nội") -> Hỏi thêm các phần còn lại
    - Nếu khách cung cấp đầy đủ trong 1 câu -> Trích xuất tất cả

    *Bước 4: Xác nhận phương thức thanh toán*
    - Hỏi: COD (trả tiền khi nhận) hay thanh toán online
    - Mặc định: isCOD = false nếu không rõ

    *Bước 5: Gọi createOrder*
    - Chỉ gọi khi ĐẦY ĐỦ tất cả thông tin bắt buộc

    **VÍ DỤ XỬ LÝ:**

    *Ví dụ 1: Khách cung cấp đầy đủ*
    - Khách: "Tôi đặt hàng, tên: Nguyễn Văn A, SĐT: 0912345678, địa chỉ: Số 123 Đường ABC, Phường XYZ, Quận 1, TP.HCM"
    - Bot: Trích xuất đầy đủ, gọi createOrder ✅

    *Ví dụ 2: Khách cung cấp thiếu*
    - Khách: "Tôi muốn đặt hàng, ở Hà Nội"
    - Bot: "Dạ được ạ! Để em đặt hàng cho bạn, em cần thêm một số thông tin:
            - Tên người nhận là gì ạ?
            - Số điện thoại của bạn?
            - Bạn ở Quận/Huyện nào ở Hà Nội ạ?
            - Phường/Xã và địa chỉ cụ thể (số nhà, tên đường)?" ✅

    *Ví dụ 3: Hỏi từng bước*
    - Khách: "Đặt hàng giúp tôi"
    - Bot: "Dạ được ạ! Bạn cho em biết tên người nhận nhé?"
    - Khách: "Nguyễn Văn A"
    - Bot: "Dạ, cảm ơn anh A. Số điện thoại của anh là gì ạ?"
    - Khách: "0912345678"
    - Bot: "Địa chỉ nhận hàng của anh ở đâu ạ? (Bao gồm: Tỉnh/TP, Quận/Huyện, Phường/Xã, và số nhà/tên đường)"
    - ... (tiếp tục cho đến khi đủ thông tin) ✅

     ### QUY TẮC 4: CÁCH TRÌNH BÀY THÔNG TIN SẢN PHẨM (QUAN TRỌNG)

     **NGUYÊN TẮC CƠ BẢN:**
     - Khi có kết quả tìm kiếm sản phẩm (sau khi gọi searchProducts), CHỈ trả lời ngắn gọn
     - KHÔNG liệt kê chi tiết sản phẩm trong message vì hệ thống đã tự động hiển thị qua field products
     - Message chỉ cần thông báo đã tìm thấy và gợi mở khách hàng

     **CÁCH TRÌNH BÀY KHI CÓ KẾT QUẢ TÌM KIẾM:**

     ❌ **SAI - Liệt kê chi tiết trong message:**
     - "Em tìm thấy 5 sản phẩm:
       1. Áo sơ mi - 350.000đ
          • Màu Đen - Size M
          • Màu Xanh - Size L
       2. Áo polo - 380.000đ
         ..."
       (KHÔNG cần vì frontend đã hiển thị)

     ✅ **ĐÚNG - Ngắn gọn, để frontend hiển thị:**
     - "Dạ em tìm thấy [số] sản phẩm phù hợp với yêu cầu của bạn. Bạn xem bên dưới và chọn sản phẩm bạn muốn nhé!"
     - "Dạ được ạ! Em tìm thấy [số] mẫu [từ khóa] cho bạn. Bạn muốn xem chi tiết sản phẩm nào hoặc muốn lấy ngay ạ?"
     - "Dạ em đã tìm thấy một số sản phẩm phù hợp. Bạn có thể xem chi tiết ở dưới và cho em biết sản phẩm nào bạn quan tâm nhé!"

     **QUY TẮC:**
     1. Sau khi gọi searchProducts thành công:
        - CHỈ thông báo số lượng sản phẩm tìm thấy
        - KHÔNG liệt kê tên, giá, màu, size, hình ảnh
        - Gợi mở khách hàng xem và chọn sản phẩm
     2. Khi khách muốn mua nhưng chưa chọn variant:
        - CHỈ hỏi về màu/size một cách ngắn gọn
        - KHÔNG cần liệt kê lại tất cả variants
        - Ví dụ: "Bạn muốn màu và size nào ạ? (Xem các lựa chọn có sẵn ở dưới nhé)"
     3. Khi khách hỏi về chi tiết sản phẩm:
        - Trả lời dựa trên thông tin trong response nhưng ngắn gọn
        - Không cần format lại toàn bộ thông tin

     **VÍ DỤ TRẢ LỜI TỐT:**

     *Sau khi tìm kiếm:*
     - "Dạ em tìm thấy 5 mẫu quần kaki nam phù hợp với yêu cầu của bạn. Bạn xem bên dưới và cho em biết sản phẩm nào bạn muốn nhé!"
     - "Dạ được ạ! Em tìm thấy một số sản phẩm bạn đang tìm. Bạn có thể xem chi tiết ở dưới ạ."
     - "Dạ em đã tìm thấy [số] sản phẩm. Bạn muốn em tư vấn thêm về màu sắc và size không ạ?"

     *Khi cần hỏi variant:*
     - "Bạn muốn lấy màu và size nào ạ? (Các lựa chọn có sẵn được hiển thị ở trên)"
     - "Dạ sản phẩm này có nhiều màu và size, bạn muốn lấy cái nào ạ?"

    ### QUY TẮC 5: PHONG CÁCH GIAO TIẾP

    **TONE & STYLE:**
    - Thân thiện, nhiệt tình, chuyên nghiệp
    - Ngắn gọn, súc tích, dễ hiểu
    - Tránh văn vở dài dòng, lan man
    - Tích cực, luôn sẵn sàng giúp đỡ

    **XƯNG HÔ:**
    - "Dạ" khi trả lời
    - "Em/anh/chị" tùy ngữ cảnh và cách khách xưng hô
    - "Mình" khi cần thân thiện hơn
    - Luôn lịch sự, tôn trọng khách hàng

    **CÁC TÌNH HUỐNG ĐẶC BIỆT:**

    *Khi không tìm thấy sản phẩm:*
    - "Dạ tiếc là em không tìm thấy sản phẩm [từ khóa] trong kho hàng. 
      Bạn có thể thử tìm kiếm với từ khóa khác không ạ? 
      Hoặc em có thể giúp bạn tìm sản phẩm tương tự?"

    *Khi sản phẩm hết hàng:*
    - "Dạ tiếc là sản phẩm này đã hết hàng rồi ạ. 
      Bên em có sản phẩm tương tự là [tên sản phẩm], bạn có muốn xem không ạ?"

    *Khi cần xác nhận:*
    - "Dạ để em xác nhận lại: Bạn muốn [tóm tắt yêu cầu], đúng không ạ?"

    *Khi hoàn thành task:*
    - "Dạ xong rồi ạ! Em đã [hành động]. Bạn có cần thêm gì nữa không ạ?"
    - Luôn gợi mở để khách mua thêm: "Bạn có muốn xem thêm sản phẩm nào khác không ạ?"

     **VÍ DỤ CÁC CÂU TRẢ LỜI TỐT:**

     ✅ "Dạ được ạ! Em tìm thấy 5 mẫu áo sơ mi trắng cho bạn. Bạn xem bên dưới và cho em biết sản phẩm nào bạn muốn nhé!"

     ✅ "Dạ em đã thêm sản phẩm vào giỏ hàng của bạn rồi ạ! 
       Bạn có muốn tiếp tục mua sắm hay đặt hàng ngay ạ?"

     ✅ "Dạ để em đặt hàng cho bạn, em cần một số thông tin: 
       Tên người nhận, số điện thoại và địa chỉ chi tiết ạ."

     ✅ "Dạ em tìm thấy một số sản phẩm phù hợp. Bạn có thể xem chi tiết ở dưới ạ!"

     ✅ "Dạ được ạ! Bạn xem các sản phẩm bên dưới và cho em biết bạn muốn sản phẩm nào nhé!"

    ## CÁC TÌNH HUỐNG ĐẶC BIỆT CẦN XỬ LÝ

    **1. Khách hỏi về chính sách:**
    - "Chính sách đổi trả như thế nào?"
    - Trả lời dựa trên kiến thức chung về e-commerce (nếu có thể)
    - Nếu không chắc -> Hướng dẫn liên hệ CSKH

    **2. Khách hỏi về vận chuyển:**
    - "Giao hàng bao lâu?"
    - "Phí ship bao nhiêu?"
    - Trả lời chung chung hoặc hướng dẫn xem chi tiết trong website

    **3. Khách hỏi về sản phẩm chi tiết:**
    - "Chất liệu là gì?"
    - "Áo này mặc như thế nào?"
    - Dựa vào thông tin có trong response (shortDescription), nếu không có -> Trả lời chung chung

    **4. Khách muốn xem nhiều sản phẩm:**
    - "Cho tôi xem thêm"
    - "Còn mẫu nào khác không?"
    - Gọi lại searchProducts với cùng query hoặc query mở rộng

    ## LƯU Ý QUAN TRỌNG CUỐI CÙNG

    1. **LUÔN verify dữ liệu** trước khi sử dụng
    2. **KHÔNG bao giờ tự bịa** productId/variantId
    3. **HỎI LẠI** nếu không chắc chắn thay vì đoán
    4. **GIỮ cuộc hội thoại tự nhiên** nhưng tuân thủ quy tắc
    5. **PRIORITIZE user experience** - làm cho khách hàng hài lòng
    6. **BE HELPFUL** - luôn cố gắng giúp khách tìm được sản phẩm phù hợp
    7. **KHÔNG LIỆT KÊ CHI TIẾT SẢN PHẨM** - Khi có kết quả searchProducts, CHỈ thông báo ngắn gọn. 
       Frontend đã tự động hiển thị chi tiết qua field products, KHÔNG cần liệt kê lại tên, giá, màu, size, hình ảnh trong message.
       Message chỉ nên: "Dạ em tìm thấy X sản phẩm. Bạn xem bên dưới nhé!"
      `;

  constructor() {
    // Initialize Groq client
    this.groqClient = new Groq({
      apiKey: config.groq.apiKey,
    });
    this.memoryService = new ConversationMemoryService();
    this.productService = new ProductService();
    this.embeddingService = new EmbeddingService();
    this.productRepository = new ProductRepository();
    this.cartService = new CartService();
    this.orderService = new OrderService();
    this.inventoryRepository = new InventoryRepository();
    this.variantService = new VariantService();
  }

  /**
   * Convert conversation history from internal format to Groq/OpenAI format
   */
  private convertHistoryToGroqFormat(
    history: Array<{ role: string; parts: any[] }>,
  ): Array<{ role: 'user' | 'assistant' | 'system'; content: string }> {
    const groqMessages: Array<{
      role: 'user' | 'assistant' | 'system';
      content: string;
    }> = [];

    for (const msg of history) {
      // Extract text from parts
      const textParts = msg.parts
        .filter((part: any) => part.text)
        .map((part: any) => part.text);
      const content = textParts.join('\n').trim();

      if (!content) continue;

      // Convert role: 'model' -> 'assistant', 'user' -> 'user', 'function' -> skip (handle separately)
      if (msg.role === 'function') continue;

      const role =
        msg.role === 'model' ? 'assistant' : (msg.role as 'user' | 'assistant');

      groqMessages.push({ role, content });
    }

    return groqMessages;
  }

  /**
   * Get Groq function definitions (OpenAI-compatible format)
   */
  private getGroqFunctions(): any[] {
    return [
      {
        type: 'function',
        function: {
          name: 'searchProducts',
          description:
            'Tìm kiếm sản phẩm. QUAN TRỌNG: Hãy trích xuất TỪ KHÓA CHÍNH về sản phẩm từ câu nói của khách (Ví dụ: khách nói "tìm cho anh quần kaki đi", hãy search query="quần kaki"). Đừng đưa các từ vô nghĩa như "tôi muốn", "tìm giúp", "màu gì đẹp" vào query.',
          parameters: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Từ khóa tìm kiếm',
              },
              category: {
                type: 'string',
                description: 'Danh mục (tùy chọn)',
              },
              limit: {
                type: 'number',
                description: 'Số lượng (mặc định: 5)',
              },
            },
            required: ['query'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'addToCart',
          description: 'Thêm vào giỏ hàng',
          parameters: {
            type: 'object',
            properties: {
              productId: {
                type: 'string',
                description: 'ID sản phẩm',
              },
              variantId: {
                type: 'string',
                description: 'ID biến thể',
              },
              quantity: {
                type: 'number',
                description: 'Số lượng (mặc định: 1)',
              },
            },
            required: ['productId', 'variantId'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'createOrder',
          description:
            'Tạo đơn hàng. QUAN TRỌNG: Chỉ gọi hàm này khi đã có ĐẦY ĐỦ: tên, sđt, và địa chỉ gồm 3 cấp (Xã/Phường, Quận/Huyện, Tỉnh/Thành phố). Nếu thiếu bất kỳ cấp nào của địa chỉ, hãy hỏi lại người dùng.',
          parameters: {
            type: 'object',
            properties: {
              fullName: {
                type: 'string',
                description: 'Tên người nhận',
              },
              phone: {
                type: 'string',
                description: 'Số điện thoại',
              },
              fullAddress: {
                type: 'string',
                description: 'Địa chỉ',
              },
              city: {
                type: 'string',
                description:
                  'Tên Tỉnh hoặc Thành phố trực thuộc trung ương (VD: Hà Nội, TP.HCM)',
              },
              district: {
                type: 'string',
                description: 'Tên Quận hoặc Huyện (VD: Quận 1, Huyện Củ Chi)',
              },
              ward: {
                type: 'string',
                description: 'Tên Phường hoặc Xã (VD: Phường Bến Nghé)',
              },
              isCOD: {
                type: 'boolean',
                description: 'Thanh toán COD',
              },
            },
            required: [
              'fullName',
              'phone',
              'fullAddress',
              'city',
              'district',
              'ward',
            ],
          },
        },
      },
    ];
  }

  async chat(request: ChatbotRequest): Promise<ChatbotResponse> {
    const sessionId = request.sessionId || request.userId;
    const userMessage = request.message;

    // Get conversation history
    const history = await this.memoryService.getLimitedHistory(sessionId, 20);

    // Convert history to Groq format
    const groqHistory = this.convertHistoryToGroqFormat(history);

    // Truncate user message if too long
    const truncatedMessage = this.truncateText(userMessage, 1000);

    // Add user message to history
    await this.memoryService.addMessage(sessionId, {
      role: 'user',
      parts: [{ text: truncatedMessage }],
    });

    try {
      // Prepare messages for Groq
      const messages: Array<{
        role: 'system' | 'user' | 'assistant';
        content: string;
      }> = [
        {
          role: 'system',
          content: this.systemInstruction,
        },
        ...groqHistory,
        {
          role: 'user',
          content: truncatedMessage,
        },
      ];

      // Call Groq API
      const completion = await this.groqClient.chat.completions.create({
        model: config.groq.model,
        messages: messages as any,
        tools: this.getGroqFunctions(),
        tool_choice: 'auto',
        temperature: 0.7,
        max_tokens: 2000,
      });

      const response = completion.choices[0]?.message;

      if (!response) {
        throw new Error('No response from Groq API');
      }

      // Process response
      return await this.processGroqResponse(
        response,
        request,
        sessionId,
        messages,
      );
    } catch (error: any) {
      logger.error('Error in chatbot chat:', {
        message: error.message,
        code: error.code,
        stack: error.stack,
      });

      // Return error response
      return {
        message:
          'Xin lỗi, tôi gặp lỗi khi xử lý yêu cầu của bạn. Vui lòng thử lại sau.',
        sessionId: request.userId,
      };
    }
  }

  /**
   * Process Groq chat response
   */
  private async processGroqResponse(
    response: any,
    request: ChatbotRequest,
    sessionId: string,
    messages: Array<{ role: string; content: string }>,
  ): Promise<ChatbotResponse> {
    // Check if function calling is needed
    const toolCalls = response.tool_calls;
    let products: ProductResponseDto[] = [];
    let requiresAction: 'add_to_cart' | 'create_order' | null = null;

    if (toolCalls && toolCalls.length > 0) {
      // Execute function calls
      const toolMessages: Array<{
        role: 'tool';
        tool_call_id: string;
        content: string;
      }> = [];

      for (const toolCall of toolCalls) {
        const functionName = toolCall.function.name;
        let args: any;

        try {
          args = JSON.parse(toolCall.function.arguments);
        } catch (error) {
          logger.error(
            `Error parsing function arguments for ${functionName}:`,
            error,
          );
          toolMessages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify({ error: 'Invalid function arguments' }),
          });
          continue;
        }

        try {
          let functionResult: any;

          switch (functionName) {
            case 'searchProducts':
              functionResult = await this.handleSearchProducts(args);
              products = functionResult.products || [];
              products = this.formatProductsForResponse(products);
              break;

            case 'addToCart':
              functionResult = await this.handleAddToCart(request.userId, args);
              requiresAction = 'add_to_cart';
              break;

            case 'createOrder':
              functionResult = await this.handleCreateOrder(
                request.userId,
                args,
              );
              requiresAction = 'create_order';
              break;

            default:
              functionResult = { error: 'Unknown function' };
          }

          // Compress function results to avoid oversized requests
          const compressedResult = this.compressFunctionResult(
            functionName,
            functionResult,
          );

          toolMessages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(compressedResult),
          });
        } catch (error) {
          logger.error(`Error executing function ${functionName}:`, error);
          toolMessages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify({
              error: (error as Error).message,
            }),
          });
        }
      }

      // Send function results back to model for final response
      const assistantMessage: any = {
        role: 'assistant',
        tool_calls: toolCalls,
      };
      
      // Only include content if it exists
      if (response.content) {
        assistantMessage.content = response.content;
      }

      const finalMessages = [
        ...messages,
        assistantMessage,
        ...toolMessages,
      ];

      const finalCompletion = await this.groqClient.chat.completions.create({
        model: config.groq.model,
        messages: finalMessages as any,
        tools: this.getGroqFunctions(),
        tool_choice: 'auto',
        temperature: 0.7,
        max_tokens: 2000,
      });

      const finalResponse = finalCompletion.choices[0]?.message;
      const userMessage = finalResponse?.content || response.content || '';

      // Remove System Context section if accidentally included
      const systemContextRegex =
        /\n\n\[System Context[^\]]*\]:?\s*\n[\s\S]*?(?=\n\n|$)/i;
      const cleanMessage = userMessage.replace(systemContextRegex, '').trim();

      // Prepare history text (with system context for bot's future reference)
      let historyText = cleanMessage;
      if (products && products.length > 0) {
        const productContext = products
          .map(
            (p) =>
              `Product: ${p.name} (ID: ${p.id}). Variants: ${p.variants
                .map((v) => {
                  const colorName =
                    typeof v.color === 'object'
                      ? v.color.name
                      : v.color || '';
                  return `[Color: ${colorName}, Size: ${v.size}, ID: ${v.id}]`;
                })
                .join(', ')}`,
          )
          .join('\n');
        // Append system context to history (but NOT to user message)
        historyText += `\n\n[System Context - Thông tin sản phẩm đã tìm thấy (Khách hàng không nhìn thấy dòng này, chỉ dùng để bot tham chiếu đặt hàng):\n${productContext}]`;
      }

      // Save to history with system context (for bot's reference in future conversations)
      await this.memoryService.addMessage(sessionId, {
        role: 'model',
        parts: [{ text: historyText }],
      });

      // Return clean message to user (without system context)
      return {
        message: cleanMessage,
        products: this.formatProductsForResponse(products),
        requiresAction,
        sessionId: request.userId,
      };
    } else {
      // No function calling, return direct response
      const responseText = response.content || '';

      await this.memoryService.addMessage(sessionId, {
        role: 'model',
        parts: [{ text: responseText }],
      });

      return {
        message: responseText,
        products:
          products.length > 0
            ? this.formatProductsForResponse(products)
            : undefined,
        sessionId: request.userId,
      };
    }
  }

  /**
   * Handle searchProducts function call
   * Uses RAG: Retrieval-Augmented Generation
   */
  private async handleSearchProducts(args: any): Promise<any> {
    const { query, category, limit = 5 } = args;
  
    try {
      const queryEmbedding = await this.embeddingService.generateEmbedding(query);
      
      const queryEmbeddingBuffer = Buffer.from(new Float32Array(queryEmbedding).buffer);
  
      try {
        const filterQuery = category 
          ? `@categoryId:{${category}} @status:{active}`
          : `@status:{active}`;
        
        const results = (await redis.call(
          'FT.SEARCH',
          'idx:products',
          `${filterQuery}=>[KNN ${limit * 2} @embedding $vec_param AS score]`,
          'PARAMS',
          '2',
          'vec_param',
          queryEmbeddingBuffer,
          'SORTBY',
          'score',
          'ASC',
          'LIMIT',
          '0',
          (limit * 2).toString(),
          'DIALECT',
          '2',
        )) as any[];
  
        const products = this.parseRedisKNNResults(results);
  
        const filteredProducts: ProductResponseDto[] = [];
        
        for (const redisProduct of products) {
          try {
            const productEntity = await this.productRepository.getProductById(
              redisProduct.id,
            );
            const filteredProduct = await this.filterProductVariantsWithStock(
              productEntity,
            );
            
            if (filteredProduct) {
              filteredProducts.push(filteredProduct);
              if (filteredProducts.length >= limit) break;
            }
          } catch (error) {
            logger.error(
              `Error filtering product ${redisProduct.id} variants by stock:`,
              error,
            );
          }
        }
  
        return {
          success: true,
          products: filteredProducts.slice(0, limit),
          count: filteredProducts.length,
        };
      } catch (error: any) {
        logger.warn(
          `Vector search failed for query "${query}", falling back to full-text search:`,
          error.message,
        );
        
        const products = await this.productService.searchProducts(
          query,
          category,
          undefined,
          'desc',
          'createdAt',
          1,
          limit,
        );
  
        const dbProducts: ProductResponseDto[] = [];
        for (const product of products.products) {
          try {
            const filtered = await this.filterProductVariantsWithStock(product);
            if (filtered) {
              dbProducts.push(filtered);
            }
          } catch (error) {
            logger.error(
              `Error filtering product ${product.id} variants by stock:`,
              error,
            );
          }
        }
  
        return {
          success: true,
          products: dbProducts,
          count: dbProducts.length,
        };
      }
    } catch (error) {
      logger.error('Error in handleSearchProducts:', error);
      return {
        success: false,
        products: [],
        error: (error as Error).message,
      };
    }
  }
  
  private parseRedisKNNResults(results: any[]): any[] {
    if (!results || results.length < 2) {
      return [];
    }
  
    const products: any[] = [];
    for (let i = 1; i < results.length; i += 2) {
      const productKey = results[i] as string;
      const productData = results[i + 1] as any[];
  
      if (!productKey || !productData) {
        continue;
      }
  
      const product: any = {};
      for (let j = 0; j < productData.length; j += 2) {
        const key = productData[j];
        const value = productData[j + 1];
  
        if (key === 'createdAt' || key === 'updatedAt') {
          product[key] = new Date(parseInt(value));
        } else if (key === 'ratingAverage') {
          product[key] = parseFloat(value);
        } else if (key === 'ratingCount') {
          product[key] = parseInt(value);
        } else if (key === 'variants') {
          try {
            product[key] = JSON.parse(value);
          } catch (error) {
            product[key] = [];
          }
        } else if (key === 'score') {
          product._score = parseFloat(value);
        } else if (key !== 'embedding') {
          product[key] = value;
        }
      }
      products.push(product);
    }
  
    return products;
  }

  /**
   * Calculate text match score between query and product
   */
  private calculateTextMatch(
    query: string,
    product: ProductResponseDto,
  ): number {
    const queryLower = query.toLowerCase();
    const productText = `${product.name} ${product.shortDescription} ${
      product.brand || ''
    }`.toLowerCase();

    // Simple keyword matching
    const queryWords = queryLower.split(/\s+/);
    let matchCount = 0;

    queryWords.forEach((word) => {
      if (productText.includes(word)) {
        matchCount++;
      }
    });

    return matchCount / queryWords.length;
  }

  /**
   * Handle addToCart function call
   */
  private async handleAddToCart(userId: string, args: any): Promise<any> {
    const { productId, variantId, quantity = 1 } = args;

    try {
      // VALIDATION: Kiểm tra input
      if (!variantId || !productId) {
        logger.warn(
          `Missing required fields - productId: ${productId}, variantId: ${variantId}`,
        );
        return {
          success: false,
          error:
            'Thiếu thông tin sản phẩm hoặc biến thể. Vui lòng chọn lại sản phẩm từ danh sách.',
        };
      }

      // VALIDATION: Kiểm tra variant có tồn tại không
      let variant;
      try {
        variant = await this.variantService.getVariantById(variantId);
      } catch (error) {
        logger.error(`Error fetching variant ${variantId}:`, error);
        return {
          success: false,
          error:
            'Biến thể sản phẩm không tồn tại. Vui lòng chọn lại sản phẩm từ danh sách.',
        };
      }

      if (!variant) {
        logger.warn(`Variant ${variantId} not found in database`);
        return {
          success: false,
          error:
            'Biến thể sản phẩm không tồn tại. Vui lòng chọn lại sản phẩm từ danh sách.',
        };
      }

      // VALIDATION: Kiểm tra variant thuộc về product đúng không
      // Cần query variant với product relation để kiểm tra
      const product = await this.productService.getProductByVariantId(
        variantId,
      );
      if (product?.id !== productId) {
        logger.warn(
          `Variant ${variantId} (product: ${variant?.product?.id}) does not belong to product ${productId}`,
        );
        return {
          success: false,
          error:
            'Sản phẩm và biến thể không khớp. Vui lòng chọn lại sản phẩm từ danh sách.',
        };
      }

      // Get user's cart
      let cart;
      try {
        cart = await this.cartService.findCartByUserId(userId);
      } catch (error) {
        // Cart doesn't exist, create one
        cart = await this.cartService.createCart({
          user: { id: userId } as any,
          cartItems: [] as any,
        });
      }

      logger.info(
        `Add item to cart, data = ${productId}, ${variantId}, ${quantity}`,
      );

      // Add item to cart
      await this.cartService.addCartItem({
        cartId: cart?.id || '',
        productId,
        variantId,
        quantity,
      });

      return {
        success: true,
        message: 'Đã thêm sản phẩm vào giỏ hàng',
      };
    } catch (error) {
      logger.error('Error in handleAddToCart:', error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Handle createOrder function call
   */
  private async handleCreateOrder(userId: string, args: any): Promise<any> {
    const {
      fullName,
      phone,
      fullAddress,
      city,
      district,
      ward,
      isCOD = false,
    } = args;

    try {
      // Get user's cart
      const cart = await this.cartService.findCartByUserId(userId);

      if (!cart || !cart.cartItems || cart.cartItems.length === 0) {
        return {
          success: false,
          error: 'Giỏ hàng trống',
        };
      }

      // Convert cart items to order items - fetch variants from DB
      const orderItems = await Promise.all(
        cart.cartItems.map(async (item: any) => {
          // Fetch variant from database to get current price
          const variant = await this.variantService.getVariantById(
            item.variant.id,
          );
          const rate = variant?.discountPrice || variant?.price!;

          return {
            product: item.product,
            variant: variant,
            quantity: item.quantity,
            rate: rate,
            amount: item.quantity * rate,
          };
        }),
      );

      // Create order
      const order = await this.orderService.createOrder({
        user: { id: userId } as any,
        status: OrderStatus.UNPAID as any,
        items: orderItems as any,
        shippingAddress: {
          fullName,
          phone,
          fullAddress,
          city,
          district,
          ward,
        },
        isCOD,
        discount: 0,
        shippingFee: 0, // Can be calculated based on address
      });

      return {
        success: true,
        orderId: order.id,
        message: 'Đơn hàng đã được tạo thành công',
      };
    } catch (error) {
      logger.error('Error in handleCreateOrder:', error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Filter product variants to only include those with available stock.
   * Enrich variants with available quantity and human-friendly display name.
   */
  private async filterProductVariantsWithStock(
    product: ProductResponseDto,
  ): Promise<ProductResponseDto | null> {
    if (!product.variants || product.variants.length === 0) {
      return null;
    }

    const variantsWithStock = [];

    for (const variant of product.variants) {
      try {
        const inventories =
          await this.inventoryRepository.getInventoryByVariantId(variant.id);

        const warehouses = inventories.map((inv) => ({
          id: inv.warehouse?.id,
          name: inv.warehouse?.name,
          available: Math.max((inv.onHand ?? 0) - (inv.reserved ?? 0), 0),
        }));

        const availableQuantity = warehouses.reduce(
          (sum, warehouse) => sum + warehouse.available,
          0,
        );

        if (availableQuantity <= 0) {
          continue;
        }

        const colorName =
          (variant.color as any)?.name ||
          (typeof variant.color === 'string' ? variant.color : '');

        const attributeParts = [colorName, variant.size]
          .map((value) => (value ? `${value}` : ''))
          .filter((value) => value && value.trim().length > 0);

        const displayName = attributeParts.length
          ? `${product.name} (${attributeParts.join(' - ')})`
          : product.name;

        variantsWithStock.push({
          ...variant,
          availableQuantity,
          warehouses,
          displayName,
        });
      } catch (error) {
        logger.error(
          `Error checking stock for variant ${variant.id} of product ${product.id}:`,
          error,
        );
      }
    }

    if (variantsWithStock.length === 0) {
      return null;
    }

    return {
      ...product,
      variants: variantsWithStock as any,
    };
  }

  /**
   * Compress function results to avoid oversized requests (fix 503 errors)
   * Removes unnecessary fields and limits array sizes
   */
  private compressFunctionResult(functionName: string, result: any): any {
    if (!result || typeof result !== 'object') {
      return result;
    }

    switch (functionName) {
      case 'searchProducts':
        // Limit products to 5 and remove ALL nested objects
        if (result.products && Array.isArray(result.products)) {
          return {
            success: result.success,
            count: result.count || result.products.length,
            products: result.products.slice(0, 5).map((p: any) => ({
              id: p.id,
              name: p.name,
              slug: p.slug,
              imageUrl: p.imageUrl,
              // Only keep essential variant info - flatten everything
              variants: (p.variants || []).slice(0, 3).map((v: any) => ({
                id: v.id,
                color:
                  typeof v.color === 'object'
                    ? v.color.name || ''
                    : v.color || '',
                size: v.size || '',
                price: v.price || 0,
                availableQuantity: v.availableQuantity || 0,
              })),
            })),
          };
        }
        return {
          success: result.success,
          count: result.count || 0,
          products: [],
        };

      case 'addToCart':
      case 'createOrder':
        // Keep only essential fields - no nested objects
        return {
          success: result.success || false,
          message: result.message || '',
          orderId: result.orderId || '',
          error: result.error || '',
        };

      default:
        // For any other function, return minimal structure
        return {
          success: result.success || false,
          message: result.message || '',
          error: result.error || '',
        };
    }
  }

  /**
   * Truncate text to max length to avoid oversized requests
   */
  private truncateText(text: string, maxLength: number = 500): string {
    if (!text || text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength) + '...';
  }

  /**
   * Estimate token count (rough estimation: 1 token ≈ 4 characters)
   */
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * Format products for chatbot response - only keep essential fields
   */
  private formatProductsForResponse(products: ProductResponseDto[]): any[] {
    if (!products || !Array.isArray(products)) {
      return [];
    }

    return products.map((p) => ({
      id: p.id,
      name: p.name,
      imageUrl: p.imageUrl,
      slug: p.slug,
      price: p.variants?.[0]?.price || 0,
      variants: (p.variants || []).map((v: any) => ({
        id: v.id,
        color: {
          id: v.color.id,
          name: v.color.name,
          code: v.color.code,
          hex: v.color.hex,
        },
        size: v.size || '',
        price: v.price || 0,
        availableQuantity: v.availableQuantity || 0,
        imageUrl: v.imageUrl || '',
      })),
    }));
  }
}
