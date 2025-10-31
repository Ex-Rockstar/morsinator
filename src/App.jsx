import { useState } from 'react'
import './App.css'

const MORSE_MAP = {
  'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.',
  'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..',
  'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.',
  'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
  'Y': '-.--', 'Z': '--..',
  '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-',
  '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.',
  '.': '.-.-.-', ',': '--..--', '?': '..--..', "'": '.----.', '!': '-.-.--',
  '/': '-..-.', '(': '-.--.', ')': '-.--.-', '&': '.-...', ':': '---...',
  ';': '-.-.-.', '=': '-...-', '+': '.-.-.', '-': '-....-', '_': '..--.-',
  '"': '.-..-.', '$': '...-..-', '@': '.--.-.',
};

const MORSE_REVERSE = Object.fromEntries(
  Object.entries(MORSE_MAP).map(([k, v]) => [v, k])
);

function toMorse(input) {
  return input
    .split(/\s+/)
    .map(word => word
      .split('')
      .map(ch => {
        const key = ch.toUpperCase();
        return MORSE_MAP[key] ?? ch; // keep unknown chars
      })
      .join(' ')
    )
    .join(' / ');
}

function fromMorse(input) {
  // Normalize: allow '/', ' / ', or triple spaces for word gaps
  const normalized = input.trim().replace(/\s{3,}/g, ' / ');
  return normalized
    .split(/\s*\/\s*/)
    .map(word => word
      .trim()
      .split(/\s+/)
      .map(code => MORSE_REVERSE[code] ?? code)
      .join('')
    )
    .join(' ');
}

function App() {
  const [text, setText] = useState('');
  const [morse, setMorse] = useState('');
  const [pairs, setPairs] = useState({});
  const [mode, setMode] = useState('text-to-morse'); // or 'morse-to-text'

  async function handleConvert() {
    const trimmed = text.trim();
    const out = toMorse(trimmed);
    setMorse(out);
    if (trimmed) {
      setPairs(prev => ({ ...prev, [trimmed]: out }));
      try {
        await fetch('/api/conversions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: trimmed, morse: out })
        });
      } catch (e) {
        // swallow network errors in UI
      }
    }
  }

  async function handleReverse() {
    const morseIn = text.trim();
    const plain = fromMorse(morseIn);
    setMorse(plain);
    if (morseIn) {
      setPairs(prev => ({ ...prev, [plain]: morseIn }));
      try {
        await fetch('/api/conversions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: plain, morse: morseIn })
        });
      } catch {}
    }
  }

   return (
     <div className="pastel-shell">
       <header className="pastel-header">
        <h1 className="pastel-title">{mode === 'text-to-morse' ? 'Morsinator' : 'Reversinator'}</h1>
        <p className="pastel-subtitle">{mode === 'text-to-morse' ? 'Text → Morse' : 'Morse → Text'}</p>
      </header>

       <main className="panel">
         <div className="field">
          <label htmlFor="input" className="label">{mode === 'text-to-morse' ? 'Input (Text)' : 'Input (Morse)'}</label>
          <textarea
            id="input"
            className="input"
            placeholder={mode === 'text-to-morse' ? 'Type your text here...' : 'Type Morse here (use space between letters, / between words)'}
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
          />
        </div>

        <div className="actions">
          <button className="btn" onClick={() => { setMode('text-to-morse'); handleConvert(); }}>Morse</button>
          <button className="btn soft" onClick={() => { setMode('morse-to-text'); handleReverse(); }}>Reverse</button>
        </div>

        <div className="field">
          <label htmlFor="output" className="label">{mode === 'text-to-morse' ? 'Output (Morse)' : 'Output (Text)'}</label>
          <textarea
            id="output"
            className="output"
            value={morse}
            readOnly
            rows={4}
          />
        </div>
       </main>

       <footer className="pastel-footer"> -.-  means k </footer>
     </div>
   )
 }

export default App
