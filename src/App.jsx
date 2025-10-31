import { useEffect, useState } from 'react'
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
  const [mode, setMode] = useState('text-to-morse'); // auto-detected
  const [backendOk, setBackendOk] = useState(true);
  const [copiedIn, setCopiedIn] = useState(false);
  const [copiedOut, setCopiedOut] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/health');
        setBackendOk(r.ok);
      } catch {
        setBackendOk(false);
      }
    })();
  }, []);

  function isLikelyMorse(val) {
    if (!val) return false;
    // Only dots, dashes, slashes and whitespace
    if (!/^[.\-\/\s]+$/.test(val)) return false;
    // Check at least one dot or dash
    return /[.\-]/.test(val);
  }

  async function persistPair(plain, morseCode) {
    if (!backendOk) return;
    try {
      await fetch('/api/conversions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: plain, morse: morseCode })
      });
    } catch {
      setBackendOk(false);
    }
  }

  async function handleTextChange(val) {
    setText(val);
    const trimmed = val.trim();
    if (!trimmed) { setMorse(''); return; }
    if (isLikelyMorse(trimmed)) {
      setMode('morse-to-text');
      const out = fromMorse(trimmed);
      setMorse(out);
      setPairs(prev => ({ ...prev, [out]: trimmed }));
      await persistPair(out, trimmed);
    } else {
      setMode('text-to-morse');
      const out = toMorse(trimmed);
      setMorse(out);
      setPairs(prev => ({ ...prev, [trimmed]: out }));
      await persistPair(trimmed, out);
    }
  }

  async function copyToClipboard(value, which) {
    try {
      await navigator.clipboard.writeText(value);
      if (which === 'in') {
        setCopiedIn(true);
        setTimeout(() => setCopiedIn(false), 1200);
      } else if (which === 'out') {
        setCopiedOut(true);
        setTimeout(() => setCopiedOut(false), 1200);
      }
    } catch {}
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
            onChange={(e) => { handleTextChange(e.target.value); }}
            rows={4}
          />
          <button className={`copy-btn ${copiedIn ? 'copied' : ''}`} type="button" onClick={() => copyToClipboard(text, 'in')}>{copiedIn ? 'Copied!' : 'Copy'}</button>
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
          <button className={`copy-btn ${copiedOut ? 'copied' : ''}`} type="button" onClick={() => copyToClipboard(morse, 'out')}>{copiedOut ? 'Copied!' : 'Copy'}</button>
        </div>
      </main>

      <footer className="pastel-footer"> -.-  means k </footer>
    </div>
  )
}

export default App
