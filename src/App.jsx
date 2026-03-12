import { useState, useCallback } from 'react';
import InteractiveReader, { WORD_STATUS } from './components/InteractiveReader';

const SAMPLE_TEXT = `The quick brown fox jumps over the lazy dog. This is a simple pangram that contains every letter of the English alphabet at least once. Language learning requires consistent practice and exposure to comprehensible input.`;

const SAMPLE_KNOWN_WORDS = {
  the: { status: WORD_STATUS.KNOWN, lemma: 'the', pos: 'determiner' },
  is: { status: WORD_STATUS.LEARNING_3, lemma: 'be', pos: 'verb' },
  a: { status: WORD_STATUS.LEARNING_2, lemma: 'a', pos: 'determiner' },
  to: { status: WORD_STATUS.LEARNING_1, lemma: 'to', pos: 'preposition' },
  and: { status: WORD_STATUS.KNOWN, lemma: 'and', pos: 'conjunction' },
};

function App() {
  const [knownWords, setKnownWords] = useState(SAMPLE_KNOWN_WORDS);

  const handleWordClick = useCallback((word) => {
    console.log('Clicked word:', word);
  }, []);

  const handleStatusChange = useCallback((word, newStatus) => {
    setKnownWords((prev) => ({
      ...prev,
      [word]: {
        ...prev[word],
        status: newStatus,
      },
    }));
  }, []);

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 20px' }}>
      <header style={{ marginBottom: '40px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '36px', marginBottom: '8px', fontFamily: 'system-ui' }}>
          OmniLingua Reader
        </h1>
        <p style={{ color: '#666', fontFamily: 'system-ui' }}>
          Open-source language immersion platform
        </p>
      </header>

      <InteractiveReader
        text={SAMPLE_TEXT}
        knownWords={knownWords}
        onWordClick={handleWordClick}
      />

      <footer style={{ marginTop: '60px', padding: '20px', borderTop: '1px solid #e5e7eb', fontFamily: 'system-ui', fontSize: '14px', color: '#666' }}>
        <p>
          <strong>Color Legend:</strong><br/>
          <span style={{ color: '#f59e0b' }}>●</span> New (0) - 
          <span style={{ color: '#ec4899' }}>●</span> Learning 1-4 - 
          <span style={{ color: '#9ca3af' }}>●</span> Known (5)
        </p>
        <p style={{ marginTop: '8px' }}>
          Click any word to see its definition and change its status.
        </p>
      </footer>
    </div>
  );
}

export default App;
