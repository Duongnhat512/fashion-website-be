import { ProductResponseDto } from '../../dtos/response/product/product.response';

export interface ChatbotRequest {
  message: string;
  userId: string;
  sessionId?: string;
}

export interface ChatbotResponse {
  message: string;
  products?: ProductResponseDto[];
  suggestions?: string[];
  requiresAction?: 'add_to_cart' | 'create_order' | null;
  sessionId?: string;
}

export interface IChatbotService {
  /**
   * Process user message and generate response using RAG
   * @param request - Chatbot request with user message
   * @returns Promise<ChatbotResponse> - AI-generated response with product recommendations
   */
  chat(request: ChatbotRequest): Promise<ChatbotResponse>;
}
