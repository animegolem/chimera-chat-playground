// Test script for verifying the large content multiple-send fix
// Copy and paste this into the browser console after loading the extension

// Clear any existing debug logs
if (typeof ContentTestDebugger !== 'undefined') {
  ContentTestDebugger.clearLogs();
}

// Test content from ContentTestFactory
const testContent = `jump to content
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

console.log('Test Content Info:');
console.log('- Character count:', testContent.length);
console.log('- Byte size:', new TextEncoder().encode(testContent).length);
console.log('- Line count:', testContent.split('\\n').length);

console.log('\\n--- Instructions ---');
console.log('1. Paste this content into the Lexical editor');
console.log('2. Press Ctrl+Enter to send');
console.log('3. Check the console for ContentTestDebugger logs');
console.log('4. Look for "handleSend_start" events - there should only be ONE');
console.log('5. If you see multiple "handleSend_start" events, the race condition still exists');
console.log('6. If you see "handleSend_abort_already_sending", the lock is working correctly');

// Function to analyze the logs after sending
window.analyzeSendTest = function() {
  if (typeof ContentTestDebugger === 'undefined') {
    console.error('ContentTestDebugger not available. Make sure the extension is loaded.');
    return;
  }
  
  const logs = ContentTestDebugger.getLogs();
  const analysis = ContentTestDebugger.analyzeEventSequence();
  
  console.log('\\n--- Test Results ---');
  console.log('Total send attempts:', analysis.totalSends);
  console.log('Duplicate sends detected:', analysis.duplicateSends);
  console.log('Timing issues:', analysis.timingIssues ? 'YES ❌' : 'NO ✅');
  
  if (analysis.totalSends === 1 && !analysis.timingIssues) {
    console.log('\\n🎉 SUCCESS: Large content sent only once!');
    console.log('The locking mechanism is working correctly.');
  } else if (analysis.totalSends > 1) {
    console.log('\\n❌ ISSUE: Multiple send attempts detected');
    console.log('The race condition may still exist.');
  }
  
  // Show relevant log entries
  const sendEvents = logs.filter(log => 
    log.event.startsWith('handleSend_') && 
    ['handleSend_start', 'handleSend_abort_already_sending', 'handleSend_lock_acquired'].includes(log.event)
  );
  
  if (sendEvents.length > 0) {
    console.log('\\n--- Send Events ---');
    sendEvents.forEach(event => {
      console.log(`${new Date(event.timestamp).toTimeString()} - ${event.event}`, event.data);
    });
  }
};

console.log('\\nAfter sending, run: analyzeSendTest()');