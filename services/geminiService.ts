

import { GoogleGenAI } from "@google/genai";

class GeminiService {
  private ai: GoogleGenAI | null = null;
  private isDisabled: boolean = false;

  constructor() {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.warn("API_KEY environment variable not set. Gemini features will be disabled.");
      this.isDisabled = true;
    } else {
      this.ai = new GoogleGenAI({ apiKey });
    }
  }

  public async suggestPixMessage(amount: string | undefined, recipient: string): Promise<string> {
    if (this.isDisabled || !this.ai) {
        return `Pagamento para ${recipient}`;
    }
    
    try {
      const prompt = `Crie uma mensagem curta e amigável para um pagamento PIX. O valor é ${amount ? `de R$${amount}` : 'a ser definido'} e o recebedor é "${recipient}". A mensagem deve ser informal, ter no máximo 60 caracteres e não usar acentos. Exemplo: "Pgto. para ${recipient}"`;
      
      const response = await this.ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: prompt,
      });

      const text = response.text.trim().replace(/"/g, ''); // Remove quotes from response
      return text;
    } catch (error) {
      console.error("Error calling Gemini API:", error);
      // Fallback message in case of API error
      return `Pagamento para ${recipient}`;
    }
  }
}

export const geminiService = new GeminiService();