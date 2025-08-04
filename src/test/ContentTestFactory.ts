/**
 * Test factory for generating large content payloads to test edge cases
 * and performance issues with message sending
 */

export class ContentTestFactory {
  // The actual Reddit content that caused the triple-send issue
  static readonly LARGE_REDDIT_CONTENT = `jump to content
My Subreddits
-Dashboard-home-popular-All-Random-Users-Friends-Mod-Modqueue-Saved-edit
|
add shortcuts from the my subreddits menu at left or click the button by the subreddit name, drag and drop to sort
reddit.com LocalLLaMA

    commentsother discussions (1)

servernode (6,756·38,294)|messages|notifications|chat messages|mod messages|

    preferences|

|logout
this post was submitted on 16 Apr 2025
444 points (97% upvoted)
shortlink:
Submit a new link
Submit a new text post
Get an ad-free experience with special benefits, and directly support Reddit.
LocalLLaMA
Use subreddit style
leave+dashboard+shortcut
509,675 readers

674 users here now
Show my flair on this subreddit. It looks like:
servernode

r/LocalLLaMA

A subreddit to discuss about Llama, the family of large language models created by Meta AI.

Subreddit rules

Search by flair

+Discussion

+Tutorial | Guide

+New Model

+News

+Resources

+Other
created by [deleted]a community for 2 years
MODERATORS

    HOLUPREDICTIONS
     
    about moderation team »

account activity

444

IBM Granite 3.3 ModelsNew Model (huggingface.co)

submitted 3 months ago by suitable_cowboy
 

    Announcement Post
    3.3 Speech Model

    195 commentssharesavereportcrosspost

all 195 commentsnavigate by
 subscribe
sorted by: top
formatting help
content policy

[+]
ibm
 
276 points 3 months ago (102 children)

[+]
Bakoro
 
67 points 3 months ago (22 children)

[–]
ApprehensiveAd3629
 
47 points 3 months ago 

Yeah I like granite models(gpu poor here) Lets test now

    permalink embedsave reportreply

[–]
Foreign-Beginning-49
 
llama.cpp 34 points 3 months ago* 

Best option For gpu poor even on compute constrained devices. Kudos to IBM for not leaving the masses out of the LLM game.

IBM Granite 3.3 Speech performs well compared to Whisper-large-v3, outperforming on some evaluations we did with common ASR benchmarks. This is an example of very long content that might cause performance issues or race conditions in message sending. The content continues with many more comments and discussions about AI models, benchmarks, and technical details that create a substantial payload for testing edge cases in our messaging system.`;

  /**
   * Generate content of specific byte size
   */
  static generateContentBySize(
    targetBytes: number,
    type: 'plain' | 'markdown' | 'mixed' = 'plain'
  ): string {
    const baseText = this.getBaseText(type);
    const baseSize = new TextEncoder().encode(baseText).length;

    if (baseSize >= targetBytes) {
      return baseText.substring(
        0,
        Math.floor((targetBytes * baseText.length) / baseSize)
      );
    }

    const repetitions = Math.ceil(targetBytes / baseSize);
    let content = '';

    for (let i = 0; i < repetitions; i++) {
      content += baseText + '\n\n';
      if (new TextEncoder().encode(content).length >= targetBytes) break;
    }

    return content.substring(
      0,
      Math.floor(
        (targetBytes * content.length) /
          new TextEncoder().encode(content).length
      )
    );
  }

  /**
   * Generate test content with specific characteristics
   */
  static generateTestContent(
    size: 'small' | 'medium' | 'large' | 'huge',
    type: 'plain' | 'markdown' | 'mixed' = 'mixed'
  ): string {
    const sizeMap = {
      small: 500, // 500 bytes
      medium: 5000, // 5KB
      large: 50000, // 50KB
      huge: 200000, // 200KB
    };

    return this.generateContentBySize(sizeMap[size], type);
  }

  /**
   * Get size information about content
   */
  static getContentInfo(content: string): {
    charCount: number;
    byteSize: number;
    lineCount: number;
    wordCount: number;
  } {
    return {
      charCount: content.length,
      byteSize: new TextEncoder().encode(content).length,
      lineCount: content.split('\n').length,
      wordCount: content.split(/\s+/).filter((word) => word.length > 0).length,
    };
  }

  /**
   * Create test cases for different scenarios
   */
  static createTestCases(): Array<{
    name: string;
    content: string;
    expectedBehavior: string;
  }> {
    return [
      {
        name: 'Normal message',
        content: 'This is a normal sized message for testing.',
        expectedBehavior: 'Should send once immediately',
      },
      {
        name: 'Medium content',
        content: this.generateTestContent('medium', 'mixed'),
        expectedBehavior: 'Should send once with slight delay',
      },
      {
        name: 'Large content',
        content: this.generateTestContent('large', 'mixed'),
        expectedBehavior: 'Should send once with noticeable delay',
      },
      {
        name: 'Huge content',
        content: this.generateTestContent('huge', 'plain'),
        expectedBehavior: 'Should send once with significant delay',
      },
      {
        name: 'Reddit content (original bug)',
        content: this.LARGE_REDDIT_CONTENT,
        expectedBehavior: 'Should send once (was sending 3x before fix)',
      },
    ];
  }

  private static getBaseText(type: 'plain' | 'markdown' | 'mixed'): string {
    switch (type) {
      case 'plain':
        return 'This is plain text content for testing large payloads. It contains no special formatting and should be processed quickly by the editor. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';

      case 'markdown':
        return `# Markdown Test Content

## This is a test heading

This is **bold text** and this is *italic text*. Here's some \`inline code\` and a [link](https://example.com).

\`\`\`javascript
function testCode() {
  console.log("Testing code blocks");
  return true;
}
\`\`\`

> This is a blockquote with important information.

- List item 1
- List item 2  
- List item 3

1. Numbered item 1
2. Numbered item 2
3. Numbered item 3`;

      case 'mixed':
        return `# Mixed Content Test

This content mixes **markdown formatting** with plain text to test various parsing scenarios.

Here's some code:
\`\`\`typescript
interface TestCase {
  name: string;
  content: string;
  size: number;
}
\`\`\`

> Important: This content is designed to test edge cases in message handling.

Regular paragraph with *emphasis* and \`code spans\`. The content includes various formatting elements to ensure our editor handles complex content correctly during large payload scenarios.

- **Performance testing**
- *Race condition detection*  
- \`State management verification\``;
    }
  }
}

/**
 * Debug utilities for testing content sending
 */
export class ContentTestDebugger {
  private static logs: Array<{
    timestamp: number;
    event: string;
    data: any;
  }> = [];

  static log(event: string, data?: any): void {
    this.logs.push({
      timestamp: Date.now(),
      event,
      data,
    });
    console.log(`[ContentTest] ${event}`, data);
  }

  static getLogs(): typeof ContentTestDebugger.logs {
    return [...this.logs];
  }

  static clearLogs(): void {
    this.logs = [];
  }

  static getLogsSince(timestamp: number): typeof ContentTestDebugger.logs {
    return this.logs.filter((log) => log.timestamp >= timestamp);
  }

  static analyzeEventSequence(): {
    duplicateSends: number;
    totalSends: number;
    timingIssues: boolean;
  } {
    const sendEvents = this.logs.filter(
      (log) => log.event === 'handleSend_start'
    );
    const sendCount = sendEvents.length;

    // Check for rapid successive sends (within 100ms)
    let duplicates = 0;
    for (let i = 1; i < sendEvents.length; i++) {
      if (sendEvents[i].timestamp - sendEvents[i - 1].timestamp < 100) {
        duplicates++;
      }
    }

    return {
      duplicateSends: duplicates,
      totalSends: sendCount,
      timingIssues: duplicates > 0,
    };
  }
}
