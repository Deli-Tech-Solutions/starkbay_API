import { Injectable } from '@nestjs/common';

interface ModerationResult {
  approved: boolean;
  confidence: number;
  reasons: string[];
}

@Injectable()
export class ModerationService {
  private bannedWords = [
    'spam',
    'fake',
    'scam',
    'horrible',
    'worst',
    'terrible',
    // Add more banned words as needed
  ];

  private suspiciousPatterns = [
    /(.)\1{4,}/g, // Repeated characters
    /^.{0,10}$/, // Too short
    /[A-Z]{5,}/g, // All caps
  ];

  async moderateContent(
    title: string,
    content: string,
  ): Promise<ModerationResult> {
    const fullText = `${title} ${content}`.toLowerCase();
    const reasons: string[] = [];
    let confidence = 1.0;

    // Check for banned words
    const foundBannedWords = this.bannedWords.filter((word) =>
      fullText.includes(word.toLowerCase()),
    );

    if (foundBannedWords.length > 0) {
      reasons.push(`Contains banned words: ${foundBannedWords.join(', ')}`);
      confidence -= 0.3;
    }

    // Check for suspicious patterns
    const suspiciousMatches = this.suspiciousPatterns.some((pattern) =>
      pattern.test(fullText),
    );

    if (suspiciousMatches) {
      reasons.push('Contains suspicious patterns');
      confidence -= 0.2;
    }

    // Check length
    if (content.length < 20) {
      reasons.push('Content too short');
      confidence -= 0.1;
    }

    // Simple sentiment analysis (placeholder)
    const negativeWords = ['bad', 'awful', 'hate', 'disgusting'];
    const negativeCount = negativeWords.filter((word) =>
      fullText.includes(word),
    ).length;

    if (negativeCount > 2) {
      reasons.push('Potentially negative sentiment');
      confidence -= 0.15;
    }

    return {
      approved: confidence > 0.6,
      confidence,
      reasons,
    };
  }
}
