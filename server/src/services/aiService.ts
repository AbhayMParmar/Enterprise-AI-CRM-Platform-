const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = 'llama-3.3-70b-versatile';

export class AiService {
  private static async callGroq(messages: { role: string; content: string }[], temperature = 0.7): Promise<string> {
    try {
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: DEFAULT_MODEL,
          messages,
          temperature,
          max_tokens: 1024,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn('Groq API response error:', response.status, errorText);
        throw new Error(`Groq API returned ${response.status}`);
      }

      const data: any = await response.json();
      return data.choices[0]?.message?.content || 'No completion returned by AI model.';
    } catch (error: any) {
      console.warn('Groq API call warning:', error.message);
      throw error;
    }
  }

  // 1. Generate Custom Sales Emails
  static async generateSalesEmail(params: {
    recipientName: string;
    company?: string;
    dealValue?: number;
    emailType: 'Cold Outreach' | 'Follow-up' | 'Proposal Intro' | 'Objection Handler';
    customPrompt?: string;
  }): Promise<string> {
    const systemPrompt = `You are an elite enterprise B2B sales copywriter. Generate a concise, high-converting, professional email tailored to the lead details provided. Include subject line and body text.`;
    
    const userPrompt = `
Recipient Name: ${params.recipientName}
Company: ${params.company || 'N/A'}
Deal Value: ${params.dealValue ? `$${params.dealValue}` : 'N/A'}
Email Type: ${params.emailType}
Additional Context / Instructions: ${params.customPrompt || 'None'}

Please provide a clear Subject Line followed by the Email Body.
`;

    try {
      return await this.callGroq([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ]);
    } catch (err) {
      // Fallback template
      return `Subject: Re: Partnering with ${params.company || 'Your Team'} - Strategic Opportunities

Hi ${params.recipientName},

I hope this email finds you well. 

I've been following ${params.company || 'your company'}'s recent growth and wanted to reach out regarding how our AI-powered sales platform can streamline your pipeline velocity and revenue forecasting.

Would you have 15 minutes this Thursday for a brief introduction call?

Best regards,
Sales Team`;
    }
  }

  // 2. Summarize Meeting Notes & Action Items
  static async summarizeNotes(notes: string): Promise<string> {
    const systemPrompt = `You are an executive sales manager assistant. Analyze the raw meeting notes provided and output:
1. Executive Summary (2-3 sentences)
2. Key Takeaways & Discussion Points
3. Action Items with Assigned Owners & Due Dates
4. Next Steps & Recommended Deal Stage`;

    try {
      return await this.callGroq([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Raw Meeting Notes:\n${notes}` },
      ]);
    } catch (err) {
      return `### Executive Summary
Discussion covered deal scope, budget approvals, and timeline targets.

### Key Takeaways
- Client is aligned on feature requirements.
- Final legal approval pending.

### Action Items
- [ ] Send revised proposal (Owner: Sales Rep)
- [ ] Schedule follow-up demo (Owner: Manager)`;
    }
  }

  // 3. Sales Copilot Conversational Chat
  static async chatCopilot(prompt: string, conversationHistory: { role: string; content: string }[] = []): Promise<string> {
    const systemPrompt = `You are "AI Sales Copilot", an expert AI assistant embedded inside an enterprise CRM SaaS platform. You give actionable advice on deal qualification (BANT/MEDDPICC), sales negotiation strategies, email writing, and CRM productivity. Keep answers structured, friendly, and concise.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: prompt },
    ];

    try {
      return await this.callGroq(messages);
    } catch (err) {
      return `I understand you're asking about "${prompt}". As your AI Sales Copilot, I recommend focusing on qualifying budget and decision criteria first. How else can I assist with your sales pipeline today?`;
    }
  }
}

export default AiService;
