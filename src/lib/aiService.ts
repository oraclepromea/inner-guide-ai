// REAL DATA ONLY: Enhanced AI Service for Deep Journal Analysis using OpenRouter API
// This service provides compassionate, spiritual insights with emotional depth analysis
// All mock data has been completely removed to ensure only real analysis is performed

import type { JournalEntry, MoodEntry } from '../types';

// OpenRouter API configuration
const OPENROUTER_API_BASE = 'https://openrouter.ai/api/v1';

interface OpenRouterConfig {
  apiKey: string;
  appName: string;
  siteUrl: string;
}

// Enhanced AI Analysis Response Types for Deep Insights
export interface DeepAIInsight {
  id: string;
  journalEntryId: string;
  primaryEmotion: string;
  intensity: number; // 1-10 scale
  energy: 'very low' | 'low' | 'moderate' | 'high' | 'very high';
  compassionateReflection: string;
  keyInsights: string[];
  reflectionQuestions: string[];
  spiritualQuote: {
    text: string;
    author: string;
    relevance: string;
  };
  themes: string[];
  healingGuidance: string;
  shadowWork: string;
  lightWork: string;
  confidence: number;
  createdAt: string;
  // Metadata linked to original journal entry
  originalEntry: {
    date: string;
    time?: string;
    location?: {
      city: string;
      country: string;
    };
    moonPhase?: string;
    content: string;
  };
}

interface AIInsightResponse {
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
  tone: string;
  emotions: string[];
  keyThemes: string[];
  reflectionPrompts: string[];
  growthAreas: string[];
  strengthsIdentified: string[];
  confidence: number;
}

interface TrendAnalysisResponse {
  moodTrend: 'improving' | 'declining' | 'stable';
  writingFrequency: 'increasing' | 'decreasing' | 'stable';
  emotionalPatterns: Array<{
    pattern: string;
    frequency: number;
    significance: string;
  }>;
  recommendations: Array<{
    category: string;
    action: string;
    reasoning: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  periodicInsights: {
    weeklyPattern: string;
    monthlyTrend: string;
    seasonalObservations: string;
  };
}

class AIService {
  private config: OpenRouterConfig | null = null;
  private isConfigured = false;

  // REAL DATA ONLY: Initialize with actual API configuration
  configure(apiKey: string): void {
    if (!apiKey || apiKey.trim() === '') {
      console.warn('AI Service: No API key provided');
      this.config = null;
      this.isConfigured = false;
      return;
    }

    this.config = {
      apiKey: apiKey.trim(),
      appName: 'Inner Guide AI',
      siteUrl: 'https://inner-guide-ai.app'
    };
    this.isConfigured = true;
    console.log('AI Service: Configured successfully with OpenRouter auto-switch');
  }

  // REAL DATA ONLY: Check if service is properly configured
  isReady(): boolean {
    return this.isConfigured && this.config !== null;
  }

  // REAL DATA ONLY: Make actual API request to OpenRouter with auto-switch
  private async makeAPIRequest(messages: any[], maxTokens: number = 1000): Promise<any> {
    if (!this.isReady() || !this.config) {
      throw new Error('AI Service not configured. Please set up OpenRouter API key.');
    }

    try {
      console.log('Making API request with OpenRouter auto-switch');
      
      const response = await fetch(`${OPENROUTER_API_BASE}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': this.config.siteUrl,
          'X-Title': this.config.appName,
        },
        body: JSON.stringify({
          // Let OpenRouter auto-switch to the best available model
          model: 'openrouter/auto',
          messages,
          max_tokens: maxTokens,
          temperature: 0.7,
          top_p: 0.9,
          // Prefer free models when available
          route: 'fallback'
        }),
      });

      console.log(`API Response Status: ${response.status}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('OpenRouter API Error:', errorData);
        throw new Error(`OpenRouter API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      console.log('API Response received successfully');
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid response format from OpenRouter API');
      }

      return data.choices[0].message.content;
    } catch (error) {
      console.error('AI Service API Request Failed:', error);
      throw error;
    }
  }

  // Helper method to clean API responses that may contain markdown
  private cleanJsonResponse(responseText: string): string {
    let cleaned = responseText.trim();
    
    // Remove markdown code blocks
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    // Remove any remaining backticks
    cleaned = cleaned.replace(/^`+|`+$/g, '').trim();
    
    return cleaned;
  }

  // REAL DATA ONLY: Generate deep, compassionate AI insights
  async generateDeepInsight(entry: JournalEntry, userName: string = 'Friend'): Promise<DeepAIInsight | null> {
    console.log('🔄 AIService.generateDeepInsight called with:', {
      entryId: entry.id,
      contentLength: entry.content?.length,
      isReady: this.isReady()
    });

    if (!this.isReady()) {
      console.warn('❌ AI Service: Not configured, skipping deep insight generation');
      return null;
    }

    if (!entry.content || entry.content.trim().length < 20) {
      console.warn('❌ AI Service: Entry content too short for meaningful deep analysis');
      return null;
    }

    try {
      console.log('🤖 Starting deep insight generation...');
      const prompt = `As a compassionate spiritual guide and depth psychologist, provide a deep, healing analysis of this journal entry. Write with warmth, wisdom, and genuine care.

Journal Entry Details:
Date: ${entry.date}
Time: ${entry.time || 'Not specified'}
Location: ${entry.location ? `${entry.location.city}, ${entry.location.country}` : 'Not specified'}
Moon Phase: ${entry.moonPhase || 'Unknown'}

Entry Content:
"${entry.content}"

Please provide a JSON response with:
1. primaryEmotion: The core emotion detected (e.g., "frustration", "grief", "joy", "anxiety", etc.)
2. intensity: Emotional intensity from 1-10
3. energy: Energy level ("very low", "low", "moderate", "high", "very high")
4. compassionateReflection: A warm, understanding 200-300 word reflection addressing the person directly as "${userName}". Include psychological insights, spiritual wisdom, and validation of their experience. Reference shadow work and integration when appropriate.
5. keyInsights: Array of 3-4 profound insights about their psychological patterns or spiritual journey
6. reflectionQuestions: Array of 3 deep questions for self-exploration
7. spiritualQuote: Object with "text", "author", and "relevance" - choose a quote that deeply resonates with their current state
8. themes: Array of 2-4 core themes (e.g., "money obsession", "search for purpose", "inner conflict")
9. healingGuidance: A paragraph of specific healing advice
10. shadowWork: Insight into shadow aspects being revealed
11. lightWork: Encouragement about positive qualities and potential
12. confidence: Analysis confidence (0-1)

Focus on:
- Jungian psychology and individuation
- Spiritual growth and meaning-making
- Compassionate understanding of human struggle
- Integration of shadow and light aspects
- Practical wisdom for healing

Return only valid JSON, no other text.`;

      const messages = [
        {
          role: 'system',
          content: 'You are a wise, compassionate spiritual guide and depth psychologist. You understand the human soul deeply and offer healing insights with warmth and wisdom. You integrate psychological understanding with spiritual wisdom, drawing from various traditions while remaining grounded and practical. Your analysis is profound yet accessible, always offered with love and understanding.'
        },
        {
          role: 'user',
          content: prompt
        }
      ];

      console.log('📤 Making API request to OpenRouter...');
      const response = await this.makeAPIRequest(messages, 2500);
      console.log('📥 Received response from OpenRouter:', response.substring(0, 200) + '...');
      
      try {
        const cleanedResponse = this.cleanJsonResponse(response);
        console.log('🧹 Cleaned response for parsing...');
        
        const analysisResult = JSON.parse(cleanedResponse);
        console.log('✅ Successfully parsed JSON response');
        
        // Validate and structure the response
        const deepInsight: DeepAIInsight = {
          id: crypto.randomUUID(),
          journalEntryId: entry.id?.toString() || '',
          primaryEmotion: analysisResult.primaryEmotion || 'contemplation',
          intensity: Math.min(10, Math.max(1, analysisResult.intensity || 5)),
          energy: analysisResult.energy || 'moderate',
          compassionateReflection: analysisResult.compassionateReflection || '',
          keyInsights: Array.isArray(analysisResult.keyInsights) ? analysisResult.keyInsights : [],
          reflectionQuestions: Array.isArray(analysisResult.reflectionQuestions) ? analysisResult.reflectionQuestions : [],
          spiritualQuote: {
            text: analysisResult.spiritualQuote?.text || "The wound is the place where the Light enters you.",
            author: analysisResult.spiritualQuote?.author || "Rumi",
            relevance: analysisResult.spiritualQuote?.relevance || "This speaks to finding meaning in struggle."
          },
          themes: Array.isArray(analysisResult.themes) ? analysisResult.themes : [],
          healingGuidance: analysisResult.healingGuidance || '',
          shadowWork: analysisResult.shadowWork || '',
          lightWork: analysisResult.lightWork || '',
          confidence: typeof analysisResult.confidence === 'number' ? analysisResult.confidence : 0.7,
          createdAt: new Date().toISOString(),
          originalEntry: {
            date: entry.date,
            time: entry.time,
            location: entry.location,
            moonPhase: entry.moonPhase,
            content: entry.content
          }
        };

        console.log('✅ Deep insight created successfully:', deepInsight.id);
        return deepInsight;
      } catch (parseError) {
        console.error('❌ AI Service: Failed to parse deep insight response:', parseError);
        console.error('❌ Raw response was:', response);
        return null;
      }
    } catch (error) {
      console.error('❌ AI Service: Deep insight generation failed:', error);
      return null;
    }
  }

  // REAL DATA ONLY: Analyze journal entry with actual AI
  async analyzeEntry(entry: JournalEntry): Promise<AIInsightResponse | null> {
    if (!this.isReady()) {
      console.warn('AI Service: Not configured, skipping analysis');
      return null;
    }

    if (!entry.content || entry.content.trim().length < 10) {
      console.warn('AI Service: Entry content too short for meaningful analysis');
      return null;
    }

    try {
      const prompt = `Analyze this journal entry and provide insights in JSON format:

Journal Entry:
"${entry.content}"

Date: ${entry.date}
Location: ${entry.location || 'Not specified'}
Moon Phase: ${entry.moonPhase || 'Unknown'}

Please analyze and return a JSON object with:
- sentiment: "positive", "negative", "neutral", or "mixed"
- tone: brief description of the emotional tone
- emotions: array of emotions detected (max 5)
- keyThemes: main themes or topics (max 3)
- reflectionPrompts: thoughtful questions for self-reflection (max 3)
- growthAreas: areas for potential personal growth (max 2)
- strengthsIdentified: positive qualities or behaviors noted (max 2)
- confidence: confidence level in analysis (0-1)

Return only valid JSON, no other text.`;

      const messages = [
        {
          role: 'system',
          content: 'You are an expert journal analyst specializing in emotional intelligence and personal growth. Provide accurate, helpful insights based solely on the content provided. Return only valid JSON responses.'
        },
        {
          role: 'user',
          content: prompt
        }
      ];

      const response = await this.makeAPIRequest(messages, 800);
      
      try {
        const cleanedResponse = this.cleanJsonResponse(response);
        const analysisResult = JSON.parse(cleanedResponse);
        
        // Validate the response structure
        if (!analysisResult.sentiment || !analysisResult.tone) {
          throw new Error('Invalid analysis response structure');
        }

        return {
          sentiment: analysisResult.sentiment,
          tone: analysisResult.tone,
          emotions: Array.isArray(analysisResult.emotions) ? analysisResult.emotions : [],
          keyThemes: Array.isArray(analysisResult.keyThemes) ? analysisResult.keyThemes : [],
          reflectionPrompts: Array.isArray(analysisResult.reflectionPrompts) ? analysisResult.reflectionPrompts : [],
          growthAreas: Array.isArray(analysisResult.growthAreas) ? analysisResult.growthAreas : [],
          strengthsIdentified: Array.isArray(analysisResult.strengthsIdentified) ? analysisResult.strengthsIdentified : [],
          confidence: typeof analysisResult.confidence === 'number' ? analysisResult.confidence : 0.5
        };
      } catch (parseError) {
        console.error('AI Service: Failed to parse analysis response:', parseError);
        return null;
      }
    } catch (error) {
      console.error('AI Service: Entry analysis failed:', error);
      return null;
    }
  }

  // REAL DATA ONLY: Analyze trends with actual AI
  async analyzeTrends(
    journalEntries: JournalEntry[], 
    moodEntries: MoodEntry[], 
    period: 'week' | 'month' | 'quarter' = 'month'
  ): Promise<TrendAnalysisResponse | null> {
    if (!this.isReady()) {
      console.warn('AI Service: Not configured, skipping trend analysis');
      return null;
    }

    if (journalEntries.length === 0 && moodEntries.length === 0) {
      console.warn('AI Service: No data available for trend analysis');
      return null;
    }

    // Filter entries based on period
    const now = new Date();
    const periodDays = period === 'week' ? 7 : period === 'month' ? 30 : 90;
    const cutoffDate = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);

    const recentJournalEntries = journalEntries.filter(entry => 
      new Date(entry.createdAt) >= cutoffDate
    );
    const recentMoodEntries = moodEntries.filter(entry => 
      new Date(entry.createdAt) >= cutoffDate
    );

    if (recentJournalEntries.length === 0 && recentMoodEntries.length === 0) {
      console.warn(`AI Service: No recent data available for ${period} trend analysis`);
      return null;
    }

    try {
      // Prepare data summary for AI analysis
      const journalSummary = recentJournalEntries.map(entry => ({
        date: entry.date,
        wordCount: entry.content.split(' ').length,
        contentPreview: entry.content.substring(0, 200) + (entry.content.length > 200 ? '...' : ''),
        location: entry.location,
        moonPhase: entry.moonPhase
      }));

      const moodSummary = recentMoodEntries.map(entry => ({
        date: entry.date,
        mood: entry.mood,
        notes: entry.notes || ''
      }));

      const prompt = `Analyze these journal and mood tracking patterns over the last ${period} and provide insights in JSON format:

Journal Entries (${recentJournalEntries.length} total):
${JSON.stringify(journalSummary, null, 2)}

Mood Entries (${recentMoodEntries.length} total):
${JSON.stringify(moodSummary, null, 2)}

Analysis Period: ${period} (${periodDays} days)

Please analyze patterns and return a JSON object with:
- moodTrend: "improving", "declining", or "stable"
- writingFrequency: "increasing", "decreasing", or "stable" 
- emotionalPatterns: array of objects with pattern, frequency, significance
- recommendations: array of objects with category, action, reasoning, priority
- periodicInsights: object with weeklyPattern, monthlyTrend, seasonalObservations

Focus on actual patterns in the data provided. Return only valid JSON, no other text.`;

      const messages = [
        {
          role: 'system',
          content: 'You are an expert data analyst specializing in psychological patterns and personal development trends. Analyze only the provided data and give actionable insights. Return only valid JSON responses.'
        },
        {
          role: 'user',
          content: prompt
        }
      ];

      const response = await this.makeAPIRequest(messages, 1200);
      
      try {
        const trendResult = JSON.parse(response);
        
        // Validate and structure the response
        return {
          moodTrend: trendResult.moodTrend || 'stable',
          writingFrequency: trendResult.writingFrequency || 'stable',
          emotionalPatterns: Array.isArray(trendResult.emotionalPatterns) ? trendResult.emotionalPatterns : [],
          recommendations: Array.isArray(trendResult.recommendations) ? trendResult.recommendations : [],
          periodicInsights: {
            weeklyPattern: trendResult.periodicInsights?.weeklyPattern || 'No clear weekly pattern detected',
            monthlyTrend: trendResult.periodicInsights?.monthlyTrend || 'Insufficient data for monthly trend',
            seasonalObservations: trendResult.periodicInsights?.seasonalObservations || 'No seasonal patterns identified'
          }
        };
      } catch (parseError) {
        console.error('AI Service: Failed to parse trend analysis response:', parseError);
        return null;
      }
    } catch (error) {
      console.error('AI Service: Trend analysis failed:', error);
      return null;
    }
  }

  // REAL DATA ONLY: Generate reflection prompts based on actual content
  async generateReflectionPrompts(entries: JournalEntry[]): Promise<string[] | null> {
    if (!this.isReady()) {
      console.warn('AI Service: Not configured, skipping reflection prompt generation');
      return null;
    }

    if (entries.length === 0) {
      console.warn('AI Service: No entries available for reflection prompt generation');
      return null;
    }

    try {
      const recentEntries = entries.slice(0, 5); // Use last 5 entries
      const contentSummary = recentEntries.map(entry => ({
        date: entry.date,
        preview: entry.content.substring(0, 150) + (entry.content.length > 150 ? '...' : '')
      }));

      const prompt = `Based on these recent journal entries, generate 3-5 thoughtful reflection prompts that would help with personal growth and self-discovery:

Recent Entries:
${JSON.stringify(contentSummary, null, 2)}

Generate prompts that:
- Encourage deeper self-reflection
- Build on themes from the entries
- Promote personal growth
- Are specific and actionable

Return as a JSON array of strings. Return only valid JSON, no other text.`;

      const messages = [
        {
          role: 'system',
          content: 'You are a skilled therapist and personal development coach. Create thoughtful, specific reflection prompts based on the journal content provided.'
        },
        {
          role: 'user',
          content: prompt
        }
      ];

      const response = await this.makeAPIRequest(messages, 600);
      
      try {
        const prompts = JSON.parse(response);
        return Array.isArray(prompts) ? prompts : null;
      } catch (parseError) {
        console.error('AI Service: Failed to parse reflection prompts response:', parseError);
        return null;
      }
    } catch (error) {
      console.error('AI Service: Reflection prompt generation failed:', error);
      return null;
    }
  }

  // REAL DATA ONLY: Get configuration status
  getConfigurationStatus(): { configured: boolean; model?: string } {
    return {
      configured: this.isConfigured,
      model: this.isConfigured ? 'OpenRouter Auto-Switch' : undefined
    };
  }

  // REAL DATA ONLY: Clear configuration
  clearConfiguration(): void {
    this.config = null;
    this.isConfigured = false;
    console.log('AI Service: Configuration cleared');
  }
}

// Export singleton instance - REAL DATA ONLY
export const aiService = new AIService();

// REAL DATA ONLY: Note about mock data removal
console.log('🚫 MOCK DATA REMOVED: AI Service now only uses real OpenRouter API responses');
console.log('🔑 Configure OpenRouter API key in settings to enable AI analysis');
console.log('📊 All analysis is performed on actual user data only');