import React from 'react';

function HelpView() {
  return (
    <div className="container">
      <h2>How to Use Pushups</h2>
      
      <div style={{marginTop: '30px'}}>
        <h3 style={{color: '#667eea', marginBottom: '15px'}}>📚 Getting Started</h3>
        <ul style={{lineHeight: '1.8', color: '#666', marginLeft: '20px'}}>
          <li><strong>Browse Sets:</strong> Browse/Search among available question sets to play what you want. You can play specific sets or at random. </li>
          <li><strong>Add Sets:</strong> Add new sets you want to play to the library either from your device or from B612 Drive. Currently supporting only mimir format TSV files.</li>
          <li><strong>Delete Sets:</strong> Uploaders can delete sets they uploaded if they want- they are only deleted from the site, not from the B612 Drive.</li>
          <li><strong>Modes:</strong> I have intentionally not loaded a large number of files from B612 or elsewhere to keep storage in mind. The site is running on a 500 MB Base free tier on Supabase - I would recommend only adding sets as you play them and not a very large number (100s or more) up front. But don't worry about deleting files after you play them, leave them on for others and for yourself to retry, we will revisit the policy if space becomes an issue.</li>
        </ul>
      </div>

      <div style={{marginTop: '30px'}}>
        <h3 style={{color: '#667eea', marginBottom: '15px'}}>🎯 User Tips</h3>
        <ul style={{lineHeight: '1.8', color: '#666', marginLeft: '20px'}}>
          <li><strong>Flashcard Mode:</strong> Click anywhere on the card to flip between question and answer</li>
          <li><strong>Self-Assessment:</strong> Mark yourself "Got it right" or "Missed it" for tracking. Your stats are visible only to you.</li>
          <li><strong>Resume Later:</strong> Your progress is saved - you can come back anytime</li>
          <li><strong>Missed Questions:</strong> Questions marked as missed are added to review mode</li>
          <li><strong>Bookmarked Questions:</strong> Bookmark feature allows you to tag questions to review later.</li>
        </ul>
      </div>

      <div style={{marginTop: '30px'}}>
        <h3 style={{color: '#667eea', marginBottom: '15px'}}>🔍 Search & Filter</h3>
        <ul style={{lineHeight: '1.8', color: '#666', marginLeft: '20px'}}>
          <li>Search sets by name or tags in the Browse Sets tab</li>
          <li>Use Random Mode filters: All, Unattempted, or Missed questions only</li>
        </ul>
      </div>

      <div style={{marginTop: '30px'}}>
        <h3 style={{color: '#667eea', marginBottom: '15px'}}>📊 Tracking Progress</h3>
        <ul style={{lineHeight: '1.8', color: '#666', marginLeft: '20px'}}>
          <li>View your stats anytime in the Stats tab</li>
          <li>Each set shows a progress bar for questions attempted</li>
          <li>Accuracy percentage updates as you play more</li>
        </ul>
      </div>

      <div style={{marginTop: '30px', padding: '20px', background: '#f9fafb', borderRadius: '8px'}}>
        <h3 style={{color: '#667eea', marginBottom: '10px'}}>💡 Pro Tip</h3>
        <p style={{color: '#666', lineHeight: '1.6', margin: 0}}>
          Tag your uploaded sets with categories (like "Art", "History", "Films") if applicable to easily filter and find them later. 
          All users can see all sets uploaded.
        </p>
      </div>
    </div>
  );
}

export default HelpView;
