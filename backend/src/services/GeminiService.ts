import axios from 'axios';

export interface GenerateAnswerResponse {
  answer: string;
  tokensUsed?: number;
}

/**
 * Service for interacting with Google's Gemini API
 */
export class GeminiService {
  private apiKey: string;
  private model = 'gemini-2.5-flash'; // Using the latest available model
  private apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    if (!apiKey) {
      console.warn('⚠️ GeminiService initialized without API key');
    } else {
      console.log(`✅ GeminiService initialized with ${this.model}`);
    }
  }

  /**
   * Check if service is properly configured
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * Generate answer using Gemini based on context and query
   */
  async generateAnswer(
    query: string,
    context: string[],
    temperature: number = 0.7
  ): Promise<GenerateAnswerResponse> {
    if (!this.apiKey) {
      throw new Error('Gemini API key not configured');
    }

    try {
      // Build the prompt with context
      const prompt = this.buildPrompt(query, context);

      console.log(`🤖 Calling Gemini API with ${context.length} context chunks...`);

      // Call Gemini API
      const response = await axios.post(
        `${this.apiUrl}/${this.model}:generateContent?key=${this.apiKey}`,
        {
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
          safetySettings: [
            {
              category: 'HARM_CATEGORY_HARASSMENT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            },
            {
              category: 'HARM_CATEGORY_HATE_SPEECH',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            },
            {
              category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            },
            {
              category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            }
          ]
        },
        {
          timeout: 30000,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      // Extract answer from response
      const candidates = response.data.candidates;
      if (!candidates || candidates.length === 0) {
        throw new Error('No response generated from Gemini');
      }

      const answer = candidates[0].content.parts[0].text;
      
      console.log(`✅ Generated answer (${answer.length} characters)`);

      return {
        answer,
        tokensUsed: response.data.usageMetadata?.totalTokenCount
      };

    } catch (error: any) {
      console.error('❌ Error calling Gemini API:', error.response?.data || error.message);
      
      if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      } else if (error.response?.status === 400) {
        throw new Error('Invalid request to Gemini API. Check your context length.');
      } else if (error.response?.status === 403) {
        throw new Error('Invalid Gemini API key or API not enabled.');
      }
      
      throw new Error(`Failed to generate answer: ${error.message}`);
    }
  }

  /**
   * Build prompt with context and query
   */
  private buildPrompt(query: string, context: string[]): string {
    const contextText = context
      .map((chunk, index) => `[${index + 1}] ${chunk}`)
      .join('\n\n');

    return `You are a helpful AI assistant that answers questions based on provided context from documents.

CONTEXT FROM DOCUMENTS:
${contextText}

QUESTION: ${query}

INSTRUCTIONS:
- Answer the question based ONLY on the information provided in the context above
- Be concise but comprehensive
- If the context doesn't contain enough information to answer the question, say so clearly
- If you reference specific information, mention which context chunk it came from (e.g., "According to [1]...")
- Use a professional and helpful tone

ANSWER:`;
  }

  /**
   * Get service status
   */
  getServiceInfo() {
    return {
      configured: this.isConfigured(),
      model: this.model,
      apiUrl: this.apiUrl
    };
  }
}
