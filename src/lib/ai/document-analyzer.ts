import Anthropic from '@anthropic-ai/sdk'

export interface ExtractedEvent {
  date: string // ISO date string
  time?: string
  description: string
  entities: string[] // People, places, organizations
  confidence: number // 0.0 to 1.0
}

export interface DocumentAnalysis {
  summary: string
  category: 'LEGAL' | 'MEDICAL' | 'FINANCIAL' | 'PERSONAL' | 'OTHER'
  events: ExtractedEvent[]
  keyEntities: {
    people: string[]
    organizations: string[]
    locations: string[]
    dates: string[]
  }
}

export class DocumentAnalyzer {
  private client: Anthropic
  private model: string

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY

    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required')
    }

    this.client = new Anthropic({ apiKey })
    this.model = process.env.ANTHROPIC_MODEL || 'claude-3-haiku-20240307'
  }

  /**
   * Analyze a document and extract structured information
   */
  async analyzeDocument(text: string, filename: string): Promise<DocumentAnalysis> {
    const prompt = `You are a document analysis AI. Analyze the following document and extract structured information.

Document Name: ${filename}
Document Text:
${text.substring(0, 10000)} // Limit to first 10k chars

Please analyze this document and provide:
1. A brief summary (2-3 sentences)
2. The document category (LEGAL, MEDICAL, FINANCIAL, PERSONAL, or OTHER)
3. All significant events mentioned with dates, times, and descriptions
4. Key entities (people, organizations, locations)

Format your response as JSON with this structure:
{
  "summary": "Brief summary here",
  "category": "LEGAL|MEDICAL|FINANCIAL|PERSONAL|OTHER",
  "events": [
    {
      "date": "YYYY-MM-DD",
      "time": "HH:MM" (optional),
      "description": "What happened",
      "entities": ["person/place/org involved"],
      "confidence": 0.0-1.0
    }
  ],
  "keyEntities": {
    "people": ["names"],
    "organizations": ["org names"],
    "locations": ["places"],
    "dates": ["important dates"]
  }
}

Only include events with specific dates. Estimate confidence based on how explicit the information is.`

    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      })

      const content = response.content[0]
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude')
      }

      // Extract JSON from response
      const jsonMatch = content.text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('Could not parse JSON from Claude response')
      }

      const analysis: DocumentAnalysis = JSON.parse(jsonMatch[0])
      return analysis
    } catch (error) {
      console.error('Document analysis error:', error)
      // Return default analysis on error
      return {
        summary: 'Could not analyze document',
        category: 'OTHER',
        events: [],
        keyEntities: {
          people: [],
          organizations: [],
          locations: [],
          dates: [],
        },
      }
    }
  }

  /**
   * Extract events from text (simplified extraction)
   */
  async extractEvents(text: string): Promise<ExtractedEvent[]> {
    const analysis = await this.analyzeDocument(text, 'document.txt')
    return analysis.events
  }

  /**
   * Categorize a document based on its content
   */
  async categorizeDocument(text: string): Promise<'LEGAL' | 'MEDICAL' | 'FINANCIAL' | 'PERSONAL' | 'OTHER'> {
    const analysis = await this.analyzeDocument(text, 'document.txt')
    return analysis.category
  }
}

export const documentAnalyzer = new DocumentAnalyzer()
