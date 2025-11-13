export interface ChatMessage {
  role: 'user' | 'model' | 'function';
  parts: Array<{ text?: string; functionCall?: any; functionResponse?: any }>;
}

export interface IConversationMemoryService {
  /**
   * Get conversation history for a session
   * @param sessionId - Unique session identifier (usually userId)
   * @returns Promise<ChatMessage[]> - Conversation history
   */
  getHistory(sessionId: string): Promise<ChatMessage[]>;

  /**
   * Add a message to conversation history
   * @param sessionId - Session identifier
   * @param message - Message to add
   */
  addMessage(sessionId: string, message: ChatMessage): Promise<void>;

  /**
   * Clear conversation history for a session
   * @param sessionId - Session identifier
   */
  clearHistory(sessionId: string): Promise<void>;

  /**
   * Get limited history (last N messages) to manage token budget
   * @param sessionId - Session identifier
   * @param limit - Number of recent messages to return
   * @returns Promise<ChatMessage[]> - Limited conversation history
   */
  getLimitedHistory(sessionId: string, limit: number): Promise<ChatMessage[]>;
}
