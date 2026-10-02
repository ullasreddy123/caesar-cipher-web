/*
  script.js
  Caesar cipher encrypt / decrypt / crack — client-side port of the Python
  CaesarCipher and FrequencyAnalyzer classes (src/caesar_cipher/cipher.py,
  src/caesar_cipher/analyzer.py). Runs entirely in the browser.
*/

const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWER = "abcdefghijklmnopqrstuvwxyz";
const ALPHABET_SIZE = 26;

const ENGLISH_LETTER_FREQUENCIES = {
  E: 12.70, T: 9.06, A: 8.17, O: 7.51, I: 6.97, N: 6.75, S: 6.33, H: 6.09,
  R: 5.99, D: 4.25, L: 4.03, C: 2.78, U: 2.76, M: 2.41, W: 2.36, F: 2.23,
  G: 2.02, Y: 1.97, P: 1.93, B: 1.29, V: 0.98, K: 0.77, J: 0.15, X: 0.15,
  Q: 0.10, Z: 0.07,
};

function mod(n, m) {
  return ((n % m) + m) % m;
}

class CaesarCipher {
  constructor(key) {
    if (key < -25 || key > 26) {
      throw new Error("Key must be between -25 and 26");
    }
    this.key = mod(key, ALPHABET_SIZE);
  }

  _shiftChar(char, shift) {
    const upperIdx = UPPER.indexOf(char);
    if (upperIdx !== -1) {
      return UPPER[mod(upperIdx + shift, ALPHABET_SIZE)];
    }
    const lowerIdx = LOWER.indexOf(char);
    if (lowerIdx !== -1) {
      return LOWER[mod(lowerIdx + shift, ALPHABET_SIZE)];
    }
    return char;
  }

  encrypt(plaintext) {
    return Array.from(plaintext).map((c) => this._shiftChar(c, this.key)).join("");
  }

  decrypt(ciphertext) {
    return Array.from(ciphertext).map((c) => this._shiftChar(c, -this.key)).join("");
  }

  static crack(ciphertext) {
    const results = [];
    for (let shift = 0; shift < ALPHABET_SIZE; shift++) {
      const cipher = new CaesarCipher(shift);
      results.push([shift, cipher.decrypt(ciphertext)]);
    }
    return results;
  }
}

class FrequencyAnalyzer {
  calculateChiSquared(text) {
    const upper = text.toUpperCase();
    const counts = {};
    let totalLetters = 0;
    for (const ch of upper) {
      if (/[A-Z]/.test(ch)) {
        counts[ch] = (counts[ch] || 0) + 1;
        totalLetters += 1;
      }
    }
    if (totalLetters === 0) return Infinity;

    let chiSquared = 0.0;
    for (const [letter, expectedFreq] of Object.entries(ENGLISH_LETTER_FREQUENCIES)) {
      const observed = counts[letter] || 0;
      const expected = (expectedFreq / 100) * totalLetters;
      if (expected > 0) {
        chiSquared += ((observed - expected) ** 2) / expected;
      }
    }
    return chiSquared;
  }

  scoreText(text) {
    return this.calculateChiSquared(text);
  }

  rankCandidates(candidates) {
    const scored = candidates.map(([shift, text]) => [shift, text, this.scoreText(text)]);
    return scored.sort((a, b) => a[2] - b[2]);
  }
}

/* ---------------------------------------------------------------------- */
/* UI wiring                                                               */
/* ---------------------------------------------------------------------- */

function $(sel, root = document) {
  return root.querySelector(sel);
}

function setActiveTab(name) {
  document.querySelectorAll(".cmd").forEach((btn) => {
    const active = btn.dataset.cmd === name;
    btn.classList.toggle("active", active);
    btn.setAttribute("aria-selected", active ? "true" : "false");
  });
  document.querySelectorAll(".panel").forEach((panel) => {
    panel.classList.toggle("hidden", panel.id !== `panel-${name}`);
  });
}

document.querySelectorAll(".cmd").forEach((btn) => {
  btn.addEventListener("click", () => setActiveTab(btn.dataset.cmd));
});

function clampKeyInput(input, min, max) {
  let v = parseInt(input.value, 10);
  if (Number.isNaN(v)) v = 0;
  v = Math.max(min, Math.min(max, v));
  input.value = v;
  return v;
}

/* --- Encrypt ------------------------------------------------------------ */

const encryptInput = $("#encrypt-input");
const encryptKey = $("#encrypt-key");
const encryptKeySlider = $("#encrypt-key-slider");
const encryptOutput = $("#encrypt-output");

function runEncrypt() {
  const key = clampKeyInput(encryptKey, -25, 26);
  encryptKeySlider.value = mod(key, ALPHABET_SIZE);
  try {
    const cipher = new CaesarCipher(key);
    const result = cipher.encrypt(encryptInput.value);
    encryptOutput.textContent = result || " ";
  } catch (e) {
    encryptOutput.textContent = `Error: ${e.message}`;
  }
}

encryptKeySlider.addEventListener("input", () => {
  encryptKey.value = encryptKeySlider.value;
});
$("#encrypt-run").addEventListener("click", runEncrypt);
encryptInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) runEncrypt();
});

/* --- Decrypt ------------------------------------------------------------ */

const decryptInput = $("#decrypt-input");
const decryptKey = $("#decrypt-key");
const decryptKeySlider = $("#decrypt-key-slider");
const decryptOutput = $("#decrypt-output");

function runDecrypt() {
  const key = clampKeyInput(decryptKey, -25, 26);
  decryptKeySlider.value = mod(key, ALPHABET_SIZE);
  try {
    const cipher = new CaesarCipher(key);
    const result = cipher.decrypt(decryptInput.value);
    decryptOutput.textContent = result || " ";
  } catch (e) {
    decryptOutput.textContent = `Error: ${e.message}`;
  }
}

decryptKeySlider.addEventListener("input", () => {
  decryptKey.value = decryptKeySlider.value;
});
$("#decrypt-run").addEventListener("click", runDecrypt);
decryptInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) runDecrypt();
});

/* --- Crack ---------------------------------------------------------------*/

const crackInput = $("#crack-input");
const crackShowAll = $("#crack-show-all");
const crackTbody = $("#crack-tbody");
const crackBestWrap = $("#crack-best-wrap");
const crackBestShift = $("#crack-best-shift");
const crackBestOutput = $("#crack-best-output");

function runCrack() {
  const text = crackInput.value;
  crackTbody.innerHTML = "";
  crackBestWrap.classList.add("hidden");

  if (!text.trim()) return;

  const candidates = CaesarCipher.crack(text);
  const analyzer = new FrequencyAnalyzer();
  const ranked = analyzer.rankCandidates(candidates);

  const top = 5;
  const displayCount = crackShowAll.checked ? ranked.length : Math.min(top, ranked.length);

  for (let i = 0; i < displayCount; i++) {
    const [shift, textResult, score] = ranked[i];
    const tr = document.createElement("tr");
    if (i === 0) tr.classList.add("best-row");
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${shift}</td>
      <td>${score === Infinity ? "inf" : score.toFixed(2)}</td>
      <td>${escapeHtml(textResult.slice(0, 80))}</td>
    `;
    crackTbody.appendChild(tr);
  }

  crackBestShift.textContent = ranked[0][0];
  crackBestOutput.textContent = ranked[0][1] || " ";
  crackBestWrap.classList.remove("hidden");
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

$("#crack-run").addEventListener("click", runCrack);
crackInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) runCrack();
});

/* --- Copy buttons -------------------------------------------------------- */

document.querySelectorAll(".copy-btn").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const target = document.getElementById(btn.dataset.copyTarget);
    const text = target ? target.textContent : "";
    try {
      await navigator.clipboard.writeText(text);
      const original = btn.textContent;
      btn.textContent = "copied";
      setTimeout(() => { btn.textContent = original; }, 1200);
    } catch (e) {
      /* clipboard unavailable — no-op */
    }
  });
});

/* --- Initial state ----------------------------------------------------------*/

encryptInput.value = "THE EAGLE LANDS AT MIDNIGHT";
