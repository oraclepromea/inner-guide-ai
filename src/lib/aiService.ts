// AI Service for OpenRouter API integration
interface AIAnalysisResult {
  sentiment: {
    score: number;
    label: 'positive' | 'negative' | 'neutral';
    confidence: number;
    emotions: Array<{ name: string; intensity: number }>;
  };
  themes: string[];
  suggestions: string[];
  reflectionPrompts: string[];
  writingPatterns: {
    complexity: 'simple' | 'moderate' | 'complex';
    tone: string;
    keyPhrases: string[];
    wordCount: number;
    readingLevel: string;
    emotionalDepth: number;
    coherence: number;
  };
  personalizedInsights: {
    recommendations: string[];
    trends: string[];
    concerns: string[];
    strengths: string[];
    growthAreas: string[];
  };
  correlations: {
    moodFactors: Array<{ factor: string; impact: number; confidence: number }>;
    timePatterns: Array<{ pattern: string; description: string }>;
    environmentalFactors: Array<{ factor: string; correlation: number }>;
  };
}

interface TrendAnalysis {
  moodTrend: 'improving' | 'declining' | 'stable';
  writingFrequency: 'increasing' | 'decreasing' | 'consistent';
  emotionalPatterns: Array<{ pattern: string; frequency: number; trend: string }>;
  recommendations: Array<{ type: string; priority: 'high' | 'medium' | 'low'; action: string }>;
  predictions: {
    nextWeekMood: { predicted: number; confidence: number };
    stressLevels: { trend: string; factors: string[] };
    wellbeingScore: number;
  };
}

interface WeeklyInsightsReport {
  period: { start: string; end: string };
  summary: {
    totalEntries: number;
    averageMood: number;
    moodStability: number;
    writingConsistency: number;
    dominantEmotions: Array<{ emotion: string; percentage: number }>;
  };
  insights: {
    achievements: string[];
    challenges: string[];
    patterns: string[];
    recommendations: string[];
  };
  goals: {
    suggested: Array<{ goal: string; rationale: string; timeframe: string }>;
    progress: Array<{ area: string; improvement: number; trend: string }>;
  };
}

class AIService {
  private apiKey: string;
  private baseUrl: string;
  private requestTimeout: number = 30000;

  constructor() {
    this.apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    this.baseUrl = import.meta.env.VITE_OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
    
    if (!this.apiKey) {
      console.warn('OpenRouter API key not configured. AI analysis will use enhanced fallback mode.');
    }
  }

  async analyzeJournalEntry(content: string, historicalEntries: any[] = [], userContext: any = {}): Promise<AIAnalysisResult> {
    // If no API key, use enhanced mock analysis
    if (!this.apiKey) {
      return this.getEnhancedMockAnalysis(content, historicalEntries, userContext);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.requestTimeout);

    try {
      const systemPrompt = this.buildSystemPrompt();
      const userPrompt = this.buildUserPrompt(content, historicalEntries, userContext);

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Inner Guide AI'
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: 'anthropic/claude-3-haiku',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.7,
          max_tokens: 3000
        })
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0]?.message?.content;
      
      if (!aiResponse) {
        throw new Error('No response from AI');
      }

      // Parse the JSON response with better error handling
      let analysis: AIAnalysisResult;
      try {
        // Clean the response to ensure valid JSON
        const cleanedResponse = this.cleanJsonResponse(aiResponse);
        analysis = JSON.parse(cleanedResponse);
      } catch (parseError) {
        console.warn('Failed to parse AI response as JSON, using enhanced fallback');
        return this.getEnhancedMockAnalysis(content, historicalEntries, userContext);
      }
      
      // Validate and enhance the response
      return this.validateAndEnhanceAnalysis(analysis, content, historicalEntries, userContext);

    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('AI analysis timeout');
      } else {
        console.error('AI analysis failed:', error);
      }
      
      return this.getEnhancedMockAnalysis(content, historicalEntries, userContext);
    }
  }

  async analyzeTrends(journalEntries: any[], moodEntries: any[], timeframe: 'week' | 'month' | 'quarter' = 'month'): Promise<TrendAnalysis> {
    if (!this.apiKey) {
      return this.getAdvancedMockTrendAnalysis(journalEntries, moodEntries, timeframe);
    }

    try {
      const analysisData = this.prepareDataForTrendAnalysis(journalEntries, moodEntries, timeframe);
      
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Inner Guide AI'
        },
        body: JSON.stringify({
          model: 'anthropic/claude-3-sonnet',
          messages: [
            {
              role: 'system',
              content: this.buildTrendAnalysisPrompt()
            },
            {
              role: 'user',
              content: `Analyze trends in this ${timeframe} period data: ${JSON.stringify(analysisData)}`
            }
          ],
          temperature: 0.6,
          max_tokens: 2500
        })
      });

      const data = await response.json();
      const analysis = JSON.parse(this.cleanJsonResponse(data.choices[0]?.message?.content || '{}'));
      
      return this.enhanceTrendAnalysis(analysis, journalEntries, moodEntries);
    } catch (error) {
      console.error('Trend analysis failed:', error);
      return this.getAdvancedMockTrendAnalysis(journalEntries, moodEntries, timeframe);
    }
  }

  async generateWeeklyReport(journalEntries: any[], moodEntries: any[], weekStart: Date): Promise<WeeklyInsightsReport> {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    const weekData = this.filterDataByWeek(journalEntries, moodEntries, weekStart, weekEnd);
    
    if (!this.apiKey) {
      return this.getMockWeeklyReport(weekData, weekStart, weekEnd);
    }

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Inner Guide AI'
        },
        body: JSON.stringify({
          model: 'anthropic/claude-3-sonnet',
          messages: [
            {
              role: 'system',
              content: this.buildWeeklyReportPrompt()
            },
            {
              role: 'user',
              content: `Generate a comprehensive weekly insights report for this data: ${JSON.stringify(weekData)}`
            }
          ],
          temperature: 0.7,
          max_tokens: 3500
        })
      });

      const data = await response.json();
      const report = JSON.parse(this.cleanJsonResponse(data.choices[0]?.message?.content || '{}'));
      
      return this.enhanceWeeklyReport(report, weekData, weekStart, weekEnd);
    } catch (error) {
      console.error('Weekly report generation failed:', error);
      return this.getMockWeeklyReport(weekData, weekStart, weekEnd);
    }
  }

  private buildSystemPrompt(): string {
    return `You are an advanced AI assistant specialized in comprehensive psychological and emotional analysis of journal entries. You have expertise in:

1. Sentiment analysis and emotion detection
2. Psychological pattern recognition
3. Cognitive behavioral analysis
4. Personal growth coaching
5. Mental health awareness

Analyze journal entries with deep empathy, psychological insight, and actionable guidance. Always prioritize the user's mental health and well-being.

Return ONLY a valid JSON response with this exact structure:
{
  "sentiment": {
    "score": <number between -1 and 1>,
    "label": "positive|negative|neutral",
    "confidence": <0-1>,
    "emotions": [{"name": "<emotion>", "intensity": <0-1>}]
  },
  "themes": ["<theme1>", "<theme2>", ...],
  "suggestions": ["<suggestion1>", "<suggestion2>", ...],
  "reflectionPrompts": ["<prompt1>", "<prompt2>", ...],
  "writingPatterns": {
    "complexity": "simple|moderate|complex",
    "tone": "<tone description>",
    "keyPhrases": ["<phrase1>", "<phrase2>", ...],
    "wordCount": <number>,
    "readingLevel": "<level>",
    "emotionalDepth": <0-1>,
    "coherence": <0-1>
  },
  "personalizedInsights": {
    "recommendations": ["<rec1>", "<rec2>", ...],
    "trends": ["<trend1>", "<trend2>", ...],
    "concerns": ["<concern1>", "<concern2>", ...],
    "strengths": ["<strength1>", "<strength2>", ...],
    "growthAreas": ["<area1>", "<area2>", ...]
  },
  "correlations": {
    "moodFactors": [{"factor": "<factor>", "impact": <-1 to 1>, "confidence": <0-1>}],
    "timePatterns": [{"pattern": "<pattern>", "description": "<desc>"}],
    "environmentalFactors": [{"factor": "<factor>", "correlation": <-1 to 1>}]
  }
}`;
  }

  private buildUserPrompt(content: string, historicalEntries: any[], userContext: any): string {
    return `Analyze this journal entry: "${content}"

${historicalEntries.length > 0 ? `
Recent historical context (last ${historicalEntries.length} entries):
${historicalEntries.slice(0, 5).map((entry, i) => 
  `Entry ${i + 1} (${entry.date}): ${entry.content.substring(0, 150)}...${entry.mood ? ` [Mood: ${entry.mood}/5]` : ''}`
).join('\n')}
` : ''}

${userContext.currentMood ? `Current mood: ${userContext.currentMood}/5` : ''}
${userContext.recentPatterns ? `Recent patterns: ${userContext.recentPatterns.join(', ')}` : ''}

Provide deep, empathetic analysis focusing on emotional intelligence, personal growth opportunities, and actionable insights.`;
  }

  private buildTrendAnalysisPrompt(): string {
    return `You are an expert data analyst specializing in psychological trends and behavioral patterns. Analyze journal and mood data to identify meaningful trends, predict future patterns, and provide actionable recommendations.

Return ONLY valid JSON with this structure:
{
  "moodTrend": "improving|declining|stable",
  "writingFrequency": "increasing|decreasing|consistent",
  "emotionalPatterns": [{"pattern": "<pattern>", "frequency": <0-1>, "trend": "<trend>"}],
  "recommendations": [{"type": "<type>", "priority": "high|medium|low", "action": "<action>"}],
  "predictions": {
    "nextWeekMood": {"predicted": <1-5>, "confidence": <0-1>},
    "stressLevels": {"trend": "<trend>", "factors": ["<factor1>", "<factor2>"]},
    "wellbeingScore": <0-100>
  }
}`;
  }

  private buildWeeklyReportPrompt(): string {
    return `Generate a comprehensive weekly insights report based on journal and mood data. Focus on achievements, growth, patterns, and actionable goals for the coming week.

Return ONLY valid JSON with this structure:
{
  "period": {"start": "<date>", "end": "<date>"},
  "summary": {
    "totalEntries": <number>,
    "averageMood": <1-5>,
    "moodStability": <0-1>,
    "writingConsistency": <0-1>,
    "dominantEmotions": [{"emotion": "<emotion>", "percentage": <0-100>}]
  },
  "insights": {
    "achievements": ["<achievement1>", "<achievement2>"],
    "challenges": ["<challenge1>", "<challenge2>"],
    "patterns": ["<pattern1>", "<pattern2>"],
    "recommendations": ["<rec1>", "<rec2>"]
  },
  "goals": {
    "suggested": [{"goal": "<goal>", "rationale": "<rationale>", "timeframe": "<timeframe>"}],
    "progress": [{"area": "<area>", "improvement": <0-100>, "trend": "<trend>"}]
  }
}`;
  }

  private cleanJsonResponse(response: string): string {
    // Remove markdown code blocks if present
    let cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    // Remove any text before the first { and after the last }
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }
    
    return cleaned;
  }

  private validateAndEnhanceAnalysis(analysis: any, content: string, historicalEntries: any[], userContext: any): AIAnalysisResult {
    const wordCount = content.split(' ').length;
    
    return {
      sentiment: {
        score: analysis.sentiment?.score || 0,
        label: analysis.sentiment?.label || 'neutral',
        confidence: analysis.sentiment?.confidence || 0.5,
        emotions: analysis.sentiment?.emotions || this.detectEmotions(content)
      },
      themes: analysis.themes || this.extractThemes(content),
      suggestions: analysis.suggestions || this.generateSuggestions(content, analysis.sentiment?.label),
      reflectionPrompts: analysis.reflectionPrompts || this.generateReflectionPrompts(content, analysis.sentiment?.emotions),
      writingPatterns: {
        complexity: analysis.writingPatterns?.complexity || this.assessComplexity(content),
        tone: analysis.writingPatterns?.tone || this.detectTone(content),
        keyPhrases: analysis.writingPatterns?.keyPhrases || this.extractKeyPhrases(content),
        wordCount,
        readingLevel: analysis.writingPatterns?.readingLevel || this.assessReadingLevel(content),
        emotionalDepth: analysis.writingPatterns?.emotionalDepth || this.calculateEmotionalDepth(analysis.sentiment?.emotions),
        coherence: analysis.writingPatterns?.coherence || this.calculateCoherence(content)
      },
      personalizedInsights: this.generateAdvancedPersonalizedInsights(content, historicalEntries, userContext),
      correlations: analysis.correlations || this.analyzeCorrelations(content, historicalEntries)
    };
  }

  private getEnhancedMockAnalysis(content: string, historicalEntries: any[], userContext: any = {}): AIAnalysisResult {
    const wordCount = content.split(' ').length;
    const emotions = this.detectEmotions(content);
    const sentiment = this.calculateSentiment(content, emotions);
    const correlations = this.analyzeCorrelations(content, historicalEntries);
    
    return {
      sentiment: {
        ...sentiment,
        emotions
      },
      themes: this.extractThemes(content),
      suggestions: this.generateSuggestions(content, sentiment.label),
      reflectionPrompts: this.generateReflectionPrompts(content, emotions),
      writingPatterns: {
        complexity: this.assessComplexity(content),
        tone: this.detectTone(content),
        keyPhrases: this.extractKeyPhrases(content),
        wordCount,
        readingLevel: this.assessReadingLevel(content),
        emotionalDepth: this.calculateEmotionalDepth(emotions),
        coherence: this.calculateCoherence(content)
      },
      personalizedInsights: this.generateAdvancedPersonalizedInsights(content, historicalEntries, userContext),
      correlations
    };
  }

  private getMockWeeklyReport(weekData: any, weekStart: Date, weekEnd: Date): WeeklyInsightsReport {
    const { journalEntries, moodEntries } = weekData;
    const avgMood = moodEntries.length > 0 
      ? moodEntries.reduce((sum: number, entry: any) => sum + entry.mood, 0) / moodEntries.length 
      : 3;
    
    const moodStability = this.calculateMoodStability(moodEntries.map((e: any) => e.mood));
    const writingConsistency = journalEntries.length / 7; // Entries per day
    
    // Analyze dominant emotions
    const allEmotions = journalEntries.flatMap((entry: any) => this.detectEmotions(entry.content));
    const emotionCounts = new Map();
    allEmotions.forEach((emotion: any) => {
      emotionCounts.set(emotion.name, (emotionCounts.get(emotion.name) || 0) + 1);
    });
    
    const totalEmotions = allEmotions.length;
    const dominantEmotions = Array.from(emotionCounts.entries())
      .map(([emotion, count]) => ({ emotion, percentage: Math.round((count / totalEmotions) * 100) }))
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 3);

    return {
      period: {
        start: weekStart.toISOString().split('T')[0],
        end: weekEnd.toISOString().split('T')[0]
      },
      summary: {
        totalEntries: journalEntries.length,
        averageMood: Math.round(avgMood * 10) / 10,
        moodStability: Math.round(moodStability * 100) / 100,
        writingConsistency: Math.round(writingConsistency * 100) / 100,
        dominantEmotions: dominantEmotions.length > 0 ? dominantEmotions : [{ emotion: 'Neutral', percentage: 100 }]
      },
      insights: {
        achievements: this.generateWeeklyAchievements(journalEntries, avgMood),
        challenges: this.identifyWeeklyChallenges(journalEntries, avgMood),
        patterns: this.identifyWeeklyPatterns(journalEntries, moodEntries),
        recommendations: this.generateWeeklyRecommendations(avgMood, moodStability, writingConsistency)
      },
      goals: {
        suggested: this.generateSuggestedGoals(journalEntries, avgMood),
        progress: this.analyzeProgressAreas(journalEntries, moodEntries)
      }
    };
  }

  private generateWeeklyAchievements(journalEntries: any[], avgMood: number): string[] {
    const achievements = [];
    
    if (journalEntries.length >= 5) {
      achievements.push('Maintained consistent journaling practice');
    }
    
    if (avgMood >= 3.5) {
      achievements.push('Sustained positive mood throughout the week');
    }
    
    if (journalEntries.some((entry: any) => entry.content.toLowerCase().includes('grateful'))) {
      achievements.push('Practiced gratitude and positive reflection');
    }
    
    if (journalEntries.some((entry: any) => 
      ['exercise', 'workout', 'walk', 'run'].some(word => entry.content.toLowerCase().includes(word))
    )) {
      achievements.push('Engaged in physical activity');
    }
    
    if (journalEntries.some((entry: any) => 
      ['friend', 'family', 'social'].some(word => entry.content.toLowerCase().includes(word))
    )) {
      achievements.push('Maintained social connections');
    }

    return achievements.length > 0 ? achievements : ['Completed another week of self-reflection'];
  }

  private identifyWeeklyChallenges(journalEntries: any[], avgMood: number): string[] {
    const challenges = [];
    
    if (avgMood < 2.5) {
      challenges.push('Low mood patterns that may need attention');
    }
    
    if (journalEntries.length < 3) {
      challenges.push('Inconsistent journaling practice');
    }
    
    const stressKeywords = ['stress', 'anxious', 'overwhelmed', 'worried'];
    if (journalEntries.some((entry: any) => 
      stressKeywords.some(word => entry.content.toLowerCase().includes(word))
    )) {
      challenges.push('Elevated stress or anxiety levels');
    }
    
    if (journalEntries.some((entry: any) => entry.content.toLowerCase().includes('sleep'))) {
      challenges.push('Sleep-related concerns');
    }

    return challenges.length > 0 ? challenges : ['No significant challenges identified'];
  }

  private identifyWeeklyPatterns(journalEntries: any[], moodEntries: any[]): string[] {
    const patterns = [];
    
    // Day of week patterns
    const dayMoods = new Map();
    moodEntries.forEach((entry: any) => {
      const day = new Date(entry.createdAt).getDay();
      const existing = dayMoods.get(day) || [];
      existing.push(entry.mood);
      dayMoods.set(day, existing);
    });

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    let bestDay = '';
    let bestMood = 0;

    for (let [day, moods] of dayMoods.entries()) {
      const avg = moods.reduce((a: number, b: number) => a + b, 0) / moods.length;
      if (avg > bestMood) {
        bestMood = avg;
        bestDay = dayNames[day];
      }
    }

    if (bestDay) {
      patterns.push(`${bestDay}s tend to be your best mood days`);
    }

    // Writing time patterns
    const morningEntries = journalEntries.filter((entry: any) => {
      const hour = new Date(entry.createdAt).getHours();
      return hour >= 6 && hour < 12;
    });

    if (morningEntries.length > journalEntries.length * 0.6) {
      patterns.push('You prefer morning journaling sessions');
    }

    return patterns.length > 0 ? patterns : ['Continue tracking to identify patterns'];
  }

  private generateWeeklyRecommendations(avgMood: number, moodStability: number, writingConsistency: number): string[] {
    const recommendations = [];

    if (avgMood < 3) {
      recommendations.push('Consider incorporating mood-boosting activities into your routine');
    }

    if (moodStability < 0.7) {
      recommendations.push('Focus on maintaining consistent daily routines for mood stability');
    }

    if (writingConsistency < 0.5) {
      recommendations.push('Try to establish a regular journaling schedule');
    }

    if (avgMood >= 4 && moodStability >= 0.8) {
      recommendations.push('Great work! Continue your current wellness practices');
    }

    return recommendations.length > 0 ? recommendations : ['Keep up the great work with your journaling practice'];
  }

  private generateSuggestedGoals(journalEntries: any[], avgMood: number) {
    const goals = [];

    if (journalEntries.length < 20) {
      goals.push({
        goal: 'Write 30 journal entries',
        rationale: 'Building a consistent writing habit improves self-awareness',
        timeframe: '1 month'
      });
    }

    if (avgMood < 3.5) {
      goals.push({
        goal: 'Improve average mood to 4+',
        rationale: 'Focus on identifying and implementing mood-boosting activities',
        timeframe: '2 weeks'
      });
    }

    goals.push({
      goal: 'Practice gratitude daily',
      rationale: 'Gratitude exercises have been shown to improve overall wellbeing',
      timeframe: '1 week'
    });

    return goals;
  }

  private analyzeProgressAreas(journalEntries: any[], moodEntries: any[]) {
    return [
      {
        area: 'Writing Consistency',
        improvement: Math.min((journalEntries.length / 30) * 100, 100),
        trend: journalEntries.length > 15 ? 'improving' : 'developing'
      },
      {
        area: 'Mood Awareness',
        improvement: Math.min((moodEntries.length / 30) * 100, 100),
        trend: moodEntries.length > 20 ? 'strong' : 'building'
      },
      {
        area: 'Self-Reflection',
        improvement: 75,
        trend: 'steady'
      }
    ];
  }

  private calculateSentiment(_content: string, emotions: Array<{ name: string; intensity: number }>) {
    const avgIntensity = emotions.length > 0 
      ? emotions.reduce((sum, emotion) => sum + emotion.intensity, 0) / emotions.length 
      : 0.5;

    let label: 'positive' | 'negative' | 'neutral' = 'neutral';
    if (avgIntensity > 0.6) label = 'positive';
    else if (avgIntensity < 0.4) label = 'negative';

    return {
      score: (avgIntensity - 0.5) * 2, // Scale to -1 to 1
      label,
      confidence: Math.min(emotions.length / 5, 1)
    };
  }

  private generateReflectionPrompts(_content: string, emotions: Array<{ name: string; intensity: number }>): string[] {
    const prompts = [
      "What emotions stood out most in today's writing?",
      "How might you build on the positive aspects of your day?",
      "What would you like to do differently tomorrow?",
      "What patterns do you notice in your thoughts and feelings?",
      "How has your perspective on this situation changed?"
    ];

    // Select prompts based on emotional content
    const selectedPrompts = [];
    if (emotions.some(e => e.intensity > 0.7)) {
      selectedPrompts.push("What triggered your strongest emotions today?");
    }
    if (emotions.some(e => e.name.toLowerCase().includes('joy') || e.name.toLowerCase().includes('happy'))) {
      selectedPrompts.push("How can you recreate more moments like this?");
    }

    return selectedPrompts.length > 0 ? selectedPrompts : prompts.slice(0, 3);
  }

  private generateAdvancedPersonalizedInsights(content: string, historicalEntries: any[], _userContext: any) {
    const insights = {
      recommendations: [] as string[],
      trends: [] as string[],
      concerns: [] as string[],
      strengths: [] as string[],
      growthAreas: [] as string[]
    };

    // Analyze historical patterns
    if (historicalEntries.length > 0) {
      const recentMoods = historicalEntries.slice(0, 7).map((e: any) => e.mood).filter(Boolean);
      if (recentMoods.length > 2) {
        const avgMood = recentMoods.reduce((a: number, b: number) => a + b, 0) / recentMoods.length;
        if (avgMood > 3.5) {
          insights.trends.push('Consistently positive mood patterns');
          insights.strengths.push('Strong emotional resilience');
        } else if (avgMood < 2.5) {
          insights.concerns.push('Recent mood challenges');
          insights.recommendations.push('Consider professional support if mood difficulties persist');
        }
      }
    }

    // Content-based insights
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('progress') || lowerContent.includes('achievement')) {
      insights.strengths.push('Self-awareness of personal progress');
    }
    
    if (lowerContent.includes('grateful') || lowerContent.includes('thankful')) {
      insights.strengths.push('Practicing gratitude');
    }
    
    if (lowerContent.includes('stress') || lowerContent.includes('overwhelmed')) {
      insights.growthAreas.push('Stress management techniques');
      insights.recommendations.push('Explore mindfulness or relaxation practices');
    }
    
    if (lowerContent.includes('goal') || lowerContent.includes('plan')) {
      insights.strengths.push('Forward-thinking and goal-oriented mindset');
    }

    // Default insights if none found
    if (insights.recommendations.length === 0) {
      insights.recommendations.push('Continue regular self-reflection through journaling');
    }
    
    if (insights.strengths.length === 0) {
      insights.strengths.push('Commitment to self-awareness through journaling');
    }
    
    if (insights.growthAreas.length === 0) {
      insights.growthAreas.push('Deeper emotional exploration in future entries');
    }

    return insights;
  }

  private analyzeCorrelations(_content: string, _historicalEntries: any[]) {
    return {
      moodFactors: [
        { factor: 'Writing frequency', impact: 0.6, confidence: 0.8 },
        { factor: 'Sleep quality', impact: 0.7, confidence: 0.7 }
      ],
      timePatterns: [
        { pattern: 'Morning writing', description: 'Higher mood scores in morning entries' }
      ],
      environmentalFactors: [
        { factor: 'Weather', correlation: 0.3 }
      ]
    };
  }

  private calculateMoodStability(moods: number[]): number {
    if (moods.length < 2) return 0.5;
    
    const mean = moods.reduce((a: number, b: number) => a + b, 0) / moods.length;
    const variance = moods.reduce((sum: number, mood: number) => sum + Math.pow(mood - mean, 2), 0) / moods.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Normalize standard deviation to 0-1 scale (assuming max possible std dev is ~2)
    return Math.max(0, 1 - (standardDeviation / 2));
  }

  private getAdvancedMockTrendAnalysis(journalEntries: any[], moodEntries: any[], timeframe: string): TrendAnalysis {
    const recentMoods = moodEntries.slice(0, 14);
    const olderMoods = moodEntries.slice(14, 28);
    
    let moodTrend: 'improving' | 'declining' | 'stable' = 'stable';
    
    if (recentMoods.length > 0 && olderMoods.length > 0) {
      const recentAvg = recentMoods.reduce((sum: number, entry: any) => sum + entry.mood, 0) / recentMoods.length;
      const olderAvg = olderMoods.reduce((sum: number, entry: any) => sum + entry.mood, 0) / olderMoods.length;
      
      if (recentAvg > olderAvg + 0.3) moodTrend = 'improving';
      else if (recentAvg < olderAvg - 0.3) moodTrend = 'declining';
    }
    
    const recentEntries = journalEntries.slice(0, timeframe === 'week' ? 7 : 30);
    const olderEntries = journalEntries.slice(timeframe === 'week' ? 7 : 30, timeframe === 'week' ? 14 : 60);
    
    let writingFrequency: 'increasing' | 'decreasing' | 'consistent' = 'consistent';
    if (recentEntries.length > olderEntries.length * 1.2) writingFrequency = 'increasing';
    else if (recentEntries.length < olderEntries.length * 0.8) writingFrequency = 'decreasing';

    return {
      moodTrend,
      writingFrequency,
      emotionalPatterns: [
        { pattern: 'Morning positivity', frequency: 0.7, trend: 'stable' },
        { pattern: 'Stress response', frequency: 0.3, trend: 'decreasing' }
      ],
      recommendations: [
        { type: 'wellness', priority: 'high', action: 'Maintain current positive practices' },
        { type: 'growth', priority: 'medium', action: 'Explore new self-care activities' }
      ],
      predictions: {
        nextWeekMood: { predicted: 3.8, confidence: 0.75 },
        stressLevels: { trend: 'stable', factors: ['work', 'sleep'] },
        wellbeingScore: 78
      }
    };
  }

  private assessReadingLevel(content: string): string {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = content.split(' ').filter(w => w.trim().length > 0);
    const avgWordsPerSentence = words.length / sentences.length;
    
    if (avgWordsPerSentence < 10) return 'Elementary';
    if (avgWordsPerSentence < 15) return 'Middle School';
    if (avgWordsPerSentence < 20) return 'High School';
    return 'College';
  }

  // Helper methods for content analysis
  private detectEmotions(content: string): Array<{ name: string; intensity: number }> {
    const emotionKeywords = {
      joy: ['happy', 'joy', 'excited', 'delighted', 'cheerful', 'elated'],
      sadness: ['sad', 'depressed', 'down', 'melancholy', 'sorrow', 'grief'],
      anger: ['angry', 'mad', 'furious', 'irritated', 'annoyed', 'rage'],
      fear: ['afraid', 'scared', 'anxious', 'worried', 'nervous', 'terrified'],
      love: ['love', 'affection', 'adore', 'cherish', 'care', 'devoted'],
      surprise: ['surprised', 'amazed', 'shocked', 'astonished', 'stunned'],
      disgust: ['disgusted', 'revolted', 'repulsed', 'sickened'],
      trust: ['trust', 'confident', 'secure', 'faithful', 'reliable'],
      anticipation: ['excited', 'eager', 'hopeful', 'optimistic', 'looking forward']
    };

    const emotions = [];
    const lowerContent = content.toLowerCase();

    for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
      const matches = keywords.filter(keyword => lowerContent.includes(keyword));
      if (matches.length > 0) {
        const intensity = Math.min(matches.length / keywords.length + 0.2, 1);
        emotions.push({ name: emotion, intensity });
      }
    }

    return emotions.length > 0 ? emotions : [{ name: 'neutral', intensity: 0.5 }];
  }

  private extractThemes(content: string): string[] {
    const themes = [];
    const lowerContent = content.toLowerCase();

    const themeKeywords = {
      'Work & Career': ['work', 'job', 'career', 'office', 'boss', 'colleague', 'meeting', 'project'],
      'Relationships': ['friend', 'family', 'partner', 'relationship', 'love', 'social', 'connect'],
      'Health & Wellness': ['health', 'exercise', 'sleep', 'tired', 'energy', 'wellness', 'medical'],
      'Personal Growth': ['learn', 'grow', 'improve', 'goal', 'progress', 'achievement', 'skill'],
      'Stress & Challenges': ['stress', 'challenge', 'difficult', 'problem', 'struggle', 'overwhelmed'],
      'Gratitude & Positivity': ['grateful', 'thankful', 'blessed', 'appreciate', 'positive', 'happy'],
      'Creativity & Hobbies': ['creative', 'art', 'music', 'hobby', 'paint', 'write', 'craft'],
      'Travel & Adventure': ['travel', 'trip', 'vacation', 'explore', 'adventure', 'journey']
    };

    for (const [theme, keywords] of Object.entries(themeKeywords)) {
      if (keywords.some(keyword => lowerContent.includes(keyword))) {
        themes.push(theme);
      }
    }

    return themes.length > 0 ? themes : ['Daily Life'];
  }

  private generateSuggestions(content: string, sentiment: string): string[] {
    const suggestions = [];
    const lowerContent = content.toLowerCase();

    if (sentiment === 'negative') {
      suggestions.push('Consider practicing mindfulness or meditation to help process these feelings');
      suggestions.push('Reach out to a trusted friend or family member for support');
      suggestions.push('Try engaging in a physical activity to help improve your mood');
    } else if (sentiment === 'positive') {
      suggestions.push('Reflect on what contributed to these positive feelings');
      suggestions.push('Consider how you might recreate this experience in the future');
      suggestions.push('Share your positive energy with others around you');
    }

    if (lowerContent.includes('stress') || lowerContent.includes('overwhelmed')) {
      suggestions.push('Break down large tasks into smaller, manageable steps');
      suggestions.push('Practice deep breathing exercises when feeling overwhelmed');
    }

    if (lowerContent.includes('goal') || lowerContent.includes('plan')) {
      suggestions.push('Write down specific action steps to achieve your goals');
      suggestions.push('Set a timeline for your goals to maintain momentum');
    }

    return suggestions.length > 0 ? suggestions : ['Continue journaling regularly to maintain self-awareness'];
  }

  private assessComplexity(content: string): 'simple' | 'moderate' | 'complex' {
    const words = content.split(' ').filter(w => w.trim().length > 0);
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgWordsPerSentence = words.length / sentences.length;
    const longWords = words.filter(word => word.length > 6).length;
    const complexityScore = (avgWordsPerSentence * 0.7) + (longWords / words.length * 30);

    if (complexityScore < 10) return 'simple';
    if (complexityScore < 20) return 'moderate';
    return 'complex';
  }

  private detectTone(content: string): string {
    const lowerContent = content.toLowerCase();
    
    const toneKeywords = {
      optimistic: ['hope', 'positive', 'bright', 'confident', 'excited'],
      pessimistic: ['hopeless', 'negative', 'dark', 'doubt', 'worried'],
      reflective: ['think', 'consider', 'reflect', 'ponder', 'contemplate'],
      grateful: ['grateful', 'thankful', 'blessed', 'appreciate'],
      concerned: ['concerned', 'worried', 'anxious', 'troubled'],
      determined: ['determined', 'focused', 'committed', 'resolved']
    };

    for (const [tone, keywords] of Object.entries(toneKeywords)) {
      if (keywords.some(keyword => lowerContent.includes(keyword))) {
        return tone;
      }
    }

    return 'neutral';
  }

  private extractKeyPhrases(content: string): string[] {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const phrases = [];

    for (const sentence of sentences.slice(0, 3)) {
      const words = sentence.trim().split(' ');
      if (words.length >= 3) {
        // Extract meaningful 3-word phrases
        for (let i = 0; i <= words.length - 3; i++) {
          const phrase = words.slice(i, i + 3).join(' ').toLowerCase();
          if (!phrase.includes('the') && !phrase.includes('and') && !phrase.includes('but')) {
            phrases.push(phrase);
          }
        }
      }
    }

    return phrases.slice(0, 5);
  }

  private calculateEmotionalDepth(emotions: Array<{ name: string; intensity: number }>): number {
    if (emotions.length === 0) return 0.3;
    
    const avgIntensity = emotions.reduce((sum, emotion) => sum + emotion.intensity, 0) / emotions.length;
    const varietyScore = Math.min(emotions.length / 5, 1);
    
    return (avgIntensity * 0.7) + (varietyScore * 0.3);
  }

  private calculateCoherence(content: string): number {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length < 2) return 0.5;

    // Simple coherence metric based on sentence length consistency
    const sentenceLengths = sentences.map(s => s.split(' ').length);
    const avgLength = sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length;
    const variance = sentenceLengths.reduce((sum, len) => sum + Math.pow(len - avgLength, 2), 0) / sentenceLengths.length;
    
    return Math.max(0.3, 1 - (Math.sqrt(variance) / avgLength));
  }

  private prepareDataForTrendAnalysis(journalEntries: any[], moodEntries: any[], timeframe: string) {
    const days = timeframe === 'week' ? 7 : timeframe === 'month' ? 30 : 90;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return {
      journalEntries: journalEntries.filter(entry => new Date(entry.createdAt) >= cutoffDate),
      moodEntries: moodEntries.filter(entry => new Date(entry.createdAt) >= cutoffDate),
      timeframe,
      analysisDate: new Date().toISOString()
    };
  }

  private enhanceTrendAnalysis(analysis: any, _journalEntries: any[], moodEntries: any[]): TrendAnalysis {
    // Enhance the analysis with additional calculations
    const recentMoods = moodEntries.slice(0, 7);
    const avgMood = recentMoods.length > 0 
      ? recentMoods.reduce((sum: number, entry: any) => sum + entry.mood, 0) / recentMoods.length 
      : 3;

    return {
      moodTrend: analysis.moodTrend || (avgMood > 3.5 ? 'improving' : avgMood < 2.5 ? 'declining' : 'stable'),
      writingFrequency: analysis.writingFrequency || 'consistent',
      emotionalPatterns: analysis.emotionalPatterns || [],
      recommendations: analysis.recommendations || [],
      predictions: {
        nextWeekMood: { predicted: Math.min(avgMood + 0.2, 5), confidence: 0.7 },
        stressLevels: { trend: 'stable', factors: ['work', 'sleep'] },
        wellbeingScore: Math.round(avgMood * 20)
      }
    };
  }

  private filterDataByWeek(journalEntries: any[], moodEntries: any[], weekStart: Date, weekEnd: Date) {
    return {
      journalEntries: journalEntries.filter(entry => {
        const entryDate = new Date(entry.createdAt);
        return entryDate >= weekStart && entryDate <= weekEnd;
      }),
      moodEntries: moodEntries.filter(entry => {
        const entryDate = new Date(entry.createdAt);
        return entryDate >= weekStart && entryDate <= weekEnd;
      })
    };
  }

  private enhanceWeeklyReport(report: any, weekData: any, weekStart: Date, weekEnd: Date): WeeklyInsightsReport {
    // If the report is incomplete, use our mock data as fallback
    if (!report.summary || !report.insights) {
      return this.getMockWeeklyReport(weekData, weekStart, weekEnd);
    }

    return {
      period: {
        start: weekStart.toISOString().split('T')[0],
        end: weekEnd.toISOString().split('T')[0]
      },
      summary: {
        totalEntries: report.summary.totalEntries || weekData.journalEntries.length,
        averageMood: report.summary.averageMood || 3,
        moodStability: report.summary.moodStability || 0.7,
        writingConsistency: report.summary.writingConsistency || 0.5,
        dominantEmotions: report.summary.dominantEmotions || [{ emotion: 'Neutral', percentage: 100 }]
      },
      insights: {
        achievements: report.insights.achievements || [],
        challenges: report.insights.challenges || [],
        patterns: report.insights.patterns || [],
        recommendations: report.insights.recommendations || []
      },
      goals: {
        suggested: report.goals?.suggested || [],
        progress: report.goals?.progress || []
      }
    };
  }
}

export const aiService = new AIService();

// Helper function for other components to use
export const analyzeJournalEntry = (content: string, historicalEntries: any[] = []) => {
  return aiService.analyzeJournalEntry(content, historicalEntries);
};

export const analyzeTrends = (journalEntries: any[], moodEntries: any[]) => {
  return aiService.analyzeTrends(journalEntries, moodEntries);
};