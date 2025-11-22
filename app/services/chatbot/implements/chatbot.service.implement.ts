import {
  FunctionCallingMode,
  GoogleGenerativeAI,
  SchemaType,
} from '@google/generative-ai';
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

export class ChatbotService implements IChatbotService {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private memoryService: ConversationMemoryService;
  private productService: ProductService;
  private embeddingService: EmbeddingService;
  private productRepository: ProductRepository;
  private cartService: CartService;
  private orderService: OrderService;
  private inventoryRepository: InventoryRepository;
  private variantService: IVariantService;

  constructor() {
    this.genAI = new GoogleGenerativeAI(config.gemini.apiKey);
    this.memoryService = new ConversationMemoryService();
    this.productService = new ProductService();
    this.embeddingService = new EmbeddingService();
    this.productRepository = new ProductRepository();
    this.cartService = new CartService();
    this.orderService = new OrderService();
    this.inventoryRepository = new InventoryRepository();
    this.variantService = new VariantService();

    // Initialize Gemini model with function calling
    this.model = this.genAI.getGenerativeModel({
      model: config.gemini.model,
      systemInstruction: `
        Bạn là một trợ lý bán hàng thời trang thông minh, thân thiện của cửa hàng.
        Nhiệm vụ: Tìm kiếm sản phẩm, tư vấn size/màu và hỗ trợ đặt hàng (Function Calling).
        
        QUY TẮC BẮT DI BẤT DỊCH:
        
        0. KHI NÀO GỌI HÀM:
          - Khi khách hỏi về sản phẩm ("tìm", "có", "xem", "mua", v.v.) -> GỌI NGAY searchProducts
          - Khi khách muốn thêm vào giỏ -> GỌI addToCart
          - Khi khách muốn đặt hàng -> GỌI createOrder
          - KHÔNG TỰ Ý TRẢ LỜI mà không gọi hàm khi khách hỏi về sản phẩm.
        1. ID VÀ DỮ LIỆU:
          - TUYỆT ĐỐI KHÔNG tự bịa ra 'productId' hoặc 'variantId'. Chỉ sử dụng ID từ kết quả của hàm 'searchProducts' hoặc lịch sử hội thoại.
          - Nếu không tìm thấy sản phẩm trong dữ liệu, hãy xin lỗi và gợi ý từ khóa khác.
    
        2. QUY TRÌNH THÊM GIỎ HÀNG (addToCart):
          - Khi khách nói "mua cái này", "lấy màu xanh": PHẢI kiểm tra xem sản phẩm đó có cần chọn Size/Màu không.
          - Nếu thiếu Size/Màu -> HỎI KHÁCH HÀNG (VD: "Dạ mẫu này bên em còn size M và L, bạn lấy size nào ạ?").
          - Chỉ gọi 'addToCart' khi đã xác định được CHÍNH XÁC 'variantId' tương ứng.
    
        3. QUY TRÌNH TẠO ĐƠN (createOrder):
          - Để đặt hàng, BẮT BUỘC phải có đủ: Tên, SĐT, và Địa chỉ chi tiết.
          - Về ĐỊA CHỈ: Hệ thống cần 3 cấp hành chính riêng biệt. Hãy hỏi hoặc trích xuất rõ ràng:
            + Tỉnh/Thành phố (city)
            + Quận/Huyện (district)
            + Phường/Xã (ward)
            + Số nhà/Đường (fullAddress)
          - Nếu khách chỉ nói "Ở Hà Nội", hãy hỏi thêm Quận, Phường và địa chỉ cụ thể.
    
        4. PHONG CÁCH:
          - Trả lời ngắn gọn, súc tích, không văn vở dài dòng.
          - Xưng hô: "Dạ/mình" hoặc "em/anh/chị" tùy ngữ cảnh, luôn lịch sự.
          - Luôn gợi mở để khách mua thêm hàng.
      `,
      tools: [
        {
          functionDeclarations: [
            {
              name: 'searchProducts',
              description:
                'Tìm kiếm sản phẩm. QUAN TRỌNG: Hãy trích xuất TỪ KHÓA CHÍNH về sản phẩm từ câu nói của khách (Ví dụ: khách nói "tìm cho anh quần kaki đi", hãy search query="quần kaki"). Đừng đưa các từ vô nghĩa như "tôi muốn", "tìm giúp", "màu gì đẹp" vào query.',
              parameters: {
                type: SchemaType.OBJECT,
                properties: {
                  query: {
                    type: SchemaType.STRING,
                    description: 'Từ khóa tìm kiếm',
                  },
                  category: {
                    type: SchemaType.STRING,
                    description: 'Danh mục (tùy chọn)',
                  },
                  limit: {
                    type: SchemaType.NUMBER,
                    description: 'Số lượng (mặc định: 5)',
                  },
                },
                required: ['query'],
              },
            },
            {
              name: 'addToCart',
              description: 'Thêm vào giỏ hàng',
              parameters: {
                type: SchemaType.OBJECT,
                properties: {
                  productId: {
                    type: SchemaType.STRING,
                    description: 'ID sản phẩm',
                  },
                  variantId: {
                    type: SchemaType.STRING,
                    description: 'ID biến thể',
                  },
                  quantity: {
                    type: SchemaType.NUMBER,
                    description: 'Số lượng (mặc định: 1)',
                  },
                },
                required: ['productId', 'variantId'],
              },
            },
            {
              name: 'createOrder',
              description:
                'Tạo đơn hàng. QUAN TRỌNG: Chỉ gọi hàm này khi đã có ĐẦY ĐỦ: tên, sđt, và địa chỉ gồm 3 cấp (Xã/Phường, Quận/Huyện, Tỉnh/Thành phố). Nếu thiếu bất kỳ cấp nào của địa chỉ, hãy hỏi lại người dùng.',
              parameters: {
                type: SchemaType.OBJECT,
                properties: {
                  fullName: {
                    type: SchemaType.STRING,
                    description: 'Tên người nhận',
                  },
                  phone: {
                    type: SchemaType.STRING,
                    description: 'Số điện thoại',
                  },
                  fullAddress: {
                    type: SchemaType.STRING,
                    description: 'Địa chỉ',
                  },
                  city: {
                    type: SchemaType.STRING,
                    description:
                      'Tên Tỉnh hoặc Thành phố trực thuộc trung ương (VD: Hà Nội, TP.HCM)',
                  },
                  district: {
                    type: SchemaType.STRING,
                    description:
                      'Tên Quận hoặc Huyện (VD: Quận 1, Huyện Củ Chi)',
                  },
                  ward: {
                    type: SchemaType.STRING,
                    description: 'Tên Phường hoặc Xã (VD: Phường Bến Nghé)',
                  },
                  isCOD: {
                    type: SchemaType.BOOLEAN,
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
          ],
        },
      ],
      toolConfig: {
        functionCallingConfig: {
          mode: FunctionCallingMode.AUTO,
        },
      },
    });
  }

  async chat(request: ChatbotRequest): Promise<ChatbotResponse> {
    try {
      const sessionId = request.sessionId || request.userId;
      const userMessage = request.message;

      // Get conversation history - limit to 3-4 messages to avoid 503 errors
      // Gemini 503 errors are caused by oversized requests
      // Get conversation history - increased limit for better context
      const history = await this.memoryService.getLimitedHistory(sessionId, 20);

      // Convert history to Gemini format and truncate long messages
      let chatHistory = history.map((msg) => {
        const parts = msg.parts.map((part: any) => {
          if (part.text) {
            return { text: this.truncateText(part.text, 1000) };
          }
          return part;
        });
        return {
          role: msg.role === 'user' ? 'user' : 'model',
          parts,
        };
      });

      // Ensure history starts with 'user' role (Gemini requirement)
      // If first message is 'model', remove it or add a dummy 'user' message
      if (chatHistory.length > 0 && chatHistory[0].role !== 'user') {
        // Option 1: Remove the first 'model' message
        chatHistory = chatHistory.slice(1);

        // Option 2: Or add a dummy user message at the beginning
        // chatHistory = [{ role: 'user', parts: [{ text: 'Hello' }] }, ...chatHistory];
      }

      // Ensure history alternates between user and model
      // Remove consecutive messages with same role
      const cleanedHistory = [];
      for (let i = 0; i < chatHistory.length; i++) {
        const current = chatHistory[i];
        const previous = cleanedHistory[cleanedHistory.length - 1];

        // Skip if same role as previous (except for first message)
        if (previous && previous.role === current.role) {
          continue;
        }

        cleanedHistory.push(current);
      }

      // Final check: ensure first message is 'user'
      if (cleanedHistory.length > 0 && cleanedHistory[0].role !== 'user') {
        cleanedHistory.shift(); // Remove first message if it's not 'user'
      }

      // Start chat session
      const chat = this.model.startChat({
        history: cleanedHistory.length > 0 ? cleanedHistory : undefined,
      });

      // Truncate user message if too long
      const truncatedMessage = this.truncateText(userMessage, 1000);

      // Add user message to history
      await this.memoryService.addMessage(sessionId, {
        role: 'user',
        parts: [{ text: truncatedMessage }],
      });

      // Send message to Gemini
      const result = await chat.sendMessage(truncatedMessage);
      const response = result.response;

      // Check if function calling is needed
      const functionCalls = response.functionCalls();
      let functionResults: any[] = [];
      let products: ProductResponseDto[] = [];
      let requiresAction: 'add_to_cart' | 'create_order' | null = null;

      if (functionCalls && functionCalls.length > 0) {
        // Execute function calls
        for (const funcCall of functionCalls) {
          const functionName = funcCall.name;
          const args = funcCall.args;

          try {
            let functionResult: any;

            switch (functionName) {
              case 'searchProducts':
                functionResult = await this.handleSearchProducts(args);
                products = functionResult.products || [];
                products = this.formatProductsForResponse(products);
                break;

              case 'addToCart':
                functionResult = await this.handleAddToCart(
                  request.userId,
                  args,
                );
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
            functionResults.push({
              functionResponse: {
                name: functionName,
                response: compressedResult, // Already an object, not JSON string
              },
            });
          } catch (error) {
            logger.error(`Error executing function ${functionName}:`, error);
            functionResults.push({
              functionResponse: {
                name: functionName,
                response: {
                  error: (error as Error).message,
                },
              },
            });
          }
        }

        // Send function results back to model for final response
        const finalResult = await chat.sendMessage(functionResults);
        const finalResponse = finalResult.response;

        // Add model response to history
        let historyText = finalResponse.text();
        if (products && products.length > 0) {
          const productContext = products
            .map(
              (p) =>
                `Product: ${p.name} (ID: ${p.id}). Variants: ${p.variants
                  .map(
                    (v) => `[Color: ${v.color}, Size: ${v.size}, ID: ${v.id}]`,
                  )
                  .join(', ')}`,
            )
            .join('\n');
          historyText += `\n\n[System Context - Thông tin sản phẩm đã tìm thấy (Khách hàng không nhìn thấy dòng này, chỉ dùng để bot tham chiếu đặt hàng):\n${productContext}]`;
        }

        await this.memoryService.addMessage(sessionId, {
          role: 'model',
          parts: [{ text: historyText }],
        });

        return {
          message: finalResponse.text(),
          products: this.formatProductsForResponse(products),
          requiresAction,
          sessionId: request.userId,
        };
      } else {
        // No function calling, return direct response
        const responseText = response.text();

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
    } catch (error) {
      logger.error('Error in chatbot service:', error);
      return {
        message:
          'Xin lỗi, tôi gặp lỗi khi xử lý yêu cầu của bạn. Vui lòng thử lại sau.',
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
      // Step 1: Generate embedding for user query
      const queryEmbedding = await this.embeddingService.generateEmbedding(
        query,
      );

      // Step 2: Retrieve products using semantic search
      // First try Redis Search (full-text)
      let products = await this.productService.searchProducts(
        query,
        category,
        undefined,
        'desc',
        'createdAt',
        1,
        limit * 2, // Get more results for filtering
      );

      // Step 3: If we have embeddings in DB, do semantic search
      // Otherwise, use the Redis search results
      if (products.products.length > 0) {
        // Filter and rank by semantic similarity if embeddings exist
        const productsWithSimilarity = await Promise.all(
          products.products.map(async (product) => {
            try {
              const productEntity = await this.productRepository.getProductById(
                product.id,
              );
              const filteredProduct = await this.filterProductVariantsWithStock(
                productEntity,
              );

              if (!filteredProduct) {
                return { product: null, similarity: 0 };
              }

              // Get embedding from Redis
              const embeddingKey = `product:${product.id}`;
              const embeddingJson = await redis.hget(embeddingKey, 'embedding');

              if (embeddingJson) {
                try {
                  const productEmbedding = JSON.parse(embeddingJson);
                  const similarity = this.embeddingService.cosineSimilarity(
                    queryEmbedding,
                    productEmbedding,
                  );
                  return { product: filteredProduct, similarity };
                } catch (error) {
                  logger.error(
                    `Error parsing embedding for product ${product.id}:`,
                    error,
                  );
                }
              }

              const textMatch = this.calculateTextMatch(query, filteredProduct);
              return { product: filteredProduct, similarity: textMatch };
            } catch (error) {
              logger.error(
                `Error preparing product ${product.id} for recommendation:`,
                error,
              );
              return { product: null, similarity: 0 };
            }
          }),
        );

        const filteredProducts = productsWithSimilarity
          .filter((item) => item.product !== null)
          .sort((a, b) => b.similarity - a.similarity)
          .slice(0, limit)
          .map((item) => item.product as ProductResponseDto);

        return {
          success: true,
          products: filteredProducts,
          count: filteredProducts.length,
        };
      }

      // Fallback: search in database
      const dbProductsRaw = await this.productService.searchProducts(
        query,
        category,
        undefined,
        'desc',
        'createdAt',
        1,
        limit,
      );

      const dbProducts: ProductResponseDto[] = [];

      for (const product of dbProductsRaw.products) {
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
    } catch (error) {
      logger.error('Error in handleSearchProducts:', error);
      return {
        success: false,
        products: [],
        error: (error as Error).message,
      };
    }
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
        status: 'UNPAID' as any,
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
        color:
          typeof v.color === 'object' ? v.color?.name || '' : v.color || '',
        size: v.size || '',
        price: v.price || 0,
        availableQuantity: v.availableQuantity || 0,
      })),
    }));
  }
}
