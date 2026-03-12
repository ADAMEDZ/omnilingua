import { useState, useMemo, useCallback } from 'react';

const WORD_STATUS = {
  NEW: 0,
  LEARNING_1: 1,
  LEARNING_2: 2,
  LEARNING_3: 3,
  LEARNING_4: 4,
  KNOWN: 5,
};

const STATUS_COLORS = {
  0: { bg: '#fef3c7', border: '#f59e0b', label: 'New' },
  1: { bg: '#fce7f3', border: '#ec4899', label: 'Learning 1' },
  2: { bg: '#e0e7ff', border: '#6366f1', label: 'Learning 2' },
  3: { bg: '#d1fae5', border: '#10b981', label: 'Learning 3' },
  4: { bg: '#dbeafe', border: '#3b82f6', label: 'Learning 4' },
  5: { bg: '#f3f4f6', border: '#9ca3af', label: 'Known' },
};

const STATUS_COLORS_CSS = `
  .word-new { background-color: #fef3c7; border-bottom: 2px solid #f59e0b; }
  .word-learning-1 { background-color: #fce7f3; border-bottom: 2px solid #ec4899; }
  .word-learning-2 { background-color: #e0e7ff; border-bottom: 2px solid #6366f1; }
  .word-learning-3 { background-color: #d1fae5; border-bottom: 2px solid #10b981; }
  .word-learning-4 { background-color: #dbeafe; border-bottom: 2px solid #3b82f6; }
  .word-known { background-color: #f3f4f6; border-bottom: 2px solid #9ca3af; }
  .word-unknown { background-color: transparent; border-bottom: 2px solid transparent; }
`;

function parseTextToWords(text) {
  const words = [];
  const tokens = text.split(/(\s+)/);
  let position = 0;

  for (const token of tokens) {
    if (!token.trim()) {
      position += token.length;
      words.push({ 
        text: token, 
        isSpace: true, 
        position 
      });
      continue;
    }

    const cleanWord = token.replace(/[^\p{L}]/gu, '');
    if (cleanWord) {
      words.push({
        text: token,
        cleanWord: cleanWord.toLowerCase(),
        isSpace: false,
        position,
        status: WORD_STATUS.NEW,
        lemma: null,
        pos: null,
        definition: null,
        examples: [],
      });
    } else {
      words.push({ text: token, isSpace: true, position });
    }
    position += token.length;
  }

  return words;
}

function WordPopup({ word, position, onClose, onStatusChange }) {
  if (!word) return null;

  const handleStatusClick = (newStatus) => {
    onStatusChange(word.cleanWord, newStatus);
  };

  return (
    <div
      className="word-popup"
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        backgroundColor: 'white',
        border: `2px solid ${STATUS_COLORS[word.status]?.border || '#ccc'}`,
        borderRadius: '8px',
        padding: '12px',
        minWidth: '280px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        zIndex: 1000,
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          fontSize: '18px',
          color: '#666',
        }}
      >
        ×
      </button>

      <div style={{ marginBottom: '12px' }}>
        <span style={{ fontSize: '24px', fontWeight: '600', marginRight: '8px' }}>
          {word.cleanWord}
        </span>
        {word.lemma && (
          <span style={{ color: '#666', fontSize: '14px' }}>({word.lemma})</span>
        )}
      </div>

      {word.pos && (
        <span
          style={{
            display: 'inline-block',
            backgroundColor: '#e5e7eb',
            borderRadius: '4px',
            padding: '2px 8px',
            fontSize: '12px',
            marginBottom: '8px',
          }}
        >
          {word.pos}
        </span>
      )}

      {word.definition && (
        <div style={{ marginTop: '8px', marginBottom: '8px' }}>
          <strong>Definition:</strong>
          <p style={{ margin: '4px 0', color: '#374151' }}>{word.definition}</p>
        </div>
      )}

      {word.examples && word.examples.length > 0 && (
        <div style={{ marginTop: '8px' }}>
          <strong>Examples:</strong>
          {word.examples.slice(0, 2).map((ex, i) => (
            <p key={i} style={{ margin: '4px 0', fontStyle: 'italic', color: '#6b7280', fontSize: '14px' }}>
              "{ex}"
            </p>
          ))}
        </div>
      )}

      <div style={{ marginTop: '12px', borderTop: '1px solid #e5e7eb', paddingTop: '12px' }}>
        <strong style={{ fontSize: '12px', color: '#6b7280' }}>CHANGE STATUS:</strong>
        <div style={{ display: 'flex', gap: '4px', marginTop: '6px', flexWrap: 'wrap' }}>
          {[0, 1, 2, 3, 4, 5].map((status) => (
            <button
              key={status}
              onClick={() => handleStatusClick(status)}
              style={{
                padding: '4px 8px',
                fontSize: '11px',
                border: `2px solid ${STATUS_COLORS[status].border}`,
                backgroundColor: word.status === status ? STATUS_COLORS[status].bg : 'white',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: word.status === status ? '600' : '400',
              }}
            >
              {STATUS_COLORS[status].label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function InteractiveReader({ 
  text, 
  knownWords = {}, 
  onWordClick,
  audioTimestamp = null 
}) {
  const [selectedWord, setSelectedWord] = useState(null);
  const [popupPosition, setPopupPosition] = useState(null);

  const words = useMemo(() => parseTextToWords(text), [text]);

  const enrichedWords = useMemo(() => {
    return words.map((w) => {
      if (w.isSpace) return w;
      const status = knownWords[w.cleanWord]?.status ?? WORD_STATUS.NEW;
      return {
        ...w,
        status,
        lemma: knownWords[w.cleanWord]?.lemma || null,
        pos: knownWords[w.cleanWord]?.pos || null,
        definition: knownWords[w.cleanWord]?.definition || null,
        examples: knownWords[w.cleanWord]?.examples || [],
      };
    });
  }, [words, knownWords]);

  const handleWordClick = useCallback((word, event) => {
    if (word.isSpace) return;
    
    const rect = event.target.getBoundingClientRect();
    setPopupPosition({ x: rect.left, y: rect.bottom + 8 });
    setSelectedWord(word);
    
    if (onWordClick) {
      onWordClick(word.cleanWord);
    }
  }, [onWordClick]);

  const handleClosePopup = useCallback(() => {
    setSelectedWord(null);
    setPopupPosition(null);
  }, []);

  const handleStatusChange = useCallback((cleanWord, newStatus) => {
    setSelectedWord((prev) => 
      prev ? { ...prev, status: newStatus } : null
    );
  }, []);

  const getStatusClass = (status) => {
    if (status === WORD_STATUS.NEW) return 'word-new';
    if (status >= WORD_STATUS.LEARNING_1 && status <= WORD_STATUS.LEARNING_4) {
      return `word-learning-${status}`;
    }
    if (status === WORD_STATUS.KNOWN) return 'word-known';
    return 'word-unknown';
  };

  const stats = useMemo(() => {
    const counts = { new: 0, learning: 0, known: 0, total: 0 };
    enrichedWords.forEach((w) => {
      if (!w.isSpace) {
        counts.total++;
        if (w.status === WORD_STATUS.NEW) counts.new++;
        else if (w.status === WORD_STATUS.KNOWN) counts.known++;
        else counts.learning++;
      }
    });
    return counts;
  }, [enrichedWords]);

  return (
    <div className="interactive-reader" style={{ fontFamily: 'Georgia, serif', lineHeight: '2.2', fontSize: '20px' }}>
      <style>{STATUS_COLORS_CSS}</style>
      
      <div className="reader-stats" style={{ 
        marginBottom: '20px', 
        padding: '12px', 
        backgroundColor: '#f9fafb', 
        borderRadius: '8px',
        display: 'flex',
        gap: '16px',
        fontSize: '14px',
        fontFamily: 'system-ui, sans-serif',
      }}>
        <span style={{ color: '#f59e0b' }}>● New: {stats.new}</span>
        <span style={{ color: '#6366f1' }}>● Learning: {stats.learning}</span>
        <span style={{ color: '#9ca3af' }}>● Known: {stats.known}</span>
        <span>• Total: {stats.total}</span>
      </div>

      <div className="reader-content" style={{ padding: '20px' }}>
        {enrichedWords.map((word, index) => (
          <span
            key={index}
            onClick={(e) => handleWordClick(word, e)}
            className={word.isSpace ? '' : getStatusClass(word.status)}
            style={{
              cursor: word.isSpace ? 'default' : 'pointer',
              padding: word.isSpace ? '0' : '2px 0',
              borderRadius: '2px',
              transition: 'background-color 0.15s ease',
              ...(audioTimestamp && !word.isSpace && {
                backgroundColor: Math.abs(word.position - audioTimestamp) < 50 ? '#fef08a' : undefined,
              }),
            }}
          >
            {word.text}
          </span>
        ))}
      </div>

      {selectedWord && popupPosition && (
        <WordPopup
          word={selectedWord}
          position={popupPosition}
          onClose={handleClosePopup}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}

export default InteractiveReader;
export { WORD_STATUS, STATUS_COLORS, InteractiveReader };
