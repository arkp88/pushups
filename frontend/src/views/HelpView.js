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
          <li><strong>Delete Sets:</strong> Uploaders can delete sets they uploaded if they want - they are only deleted from this site, not from the B612 Drive.</li>
          <li><strong>Modes:</strong> I have intentionally not loaded a large number of files out of the box, keeping limited free storage in mind - I would recommend only adding sets as you play them and not a very large number (100s or more) up front. But don't worry about deleting files after you play them, leave them on for others and for yourself to retry, we will revisit the policy if space becomes an issue.</li>
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

      <div style={{marginTop: '30px'}}>
        <h3 style={{color: '#667eea', marginBottom: '15px'}}>👥 Join B612!</h3>
        <ul style={{lineHeight: '1.8', color: '#666', marginLeft: '20px'}}>
          <li>I would likely not have made this effort without the inspiration (and the content!) from the B612 Friendlies group, one of the most welcoming quizzing communities around.</li>
          <li>This site is meant as a fun way to try mimir sets yourself OR for doing pushups if you are a <italic>serious-minded quizzer</italic>. But nothing beats playing in a group, so if you aren't a member, I encourage you to join the group and to set and play friendlies! </li>
          <li>Have fun!</li>
        </ul>
      </div>

      <div style={{marginTop: '40px', padding: '20px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '12px', color: 'white'}}>
        <h3 style={{marginBottom: '15px', fontSize: '18px'}}>💬 Feedback & Feature Requests</h3>
        <p style={{lineHeight: '1.6', marginBottom: '15px'}}>
          Have suggestions or found a bug? 
        </p>
        <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
          <div>
            <strong>📧 Email:</strong>{' '}
            <a href="mailto:araouf88@gmail.com" style={{color: 'white', textDecoration: 'underline'}}>
              araouf88@gmail.com
            </a>
          </div>
          <div>
            <strong>💬 WhatsApp:</strong> If you know where to find me.
          </div>
        </div>
      </div>
    </div>
  );
}

export default HelpView;
