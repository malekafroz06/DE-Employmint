import fs from 'fs/promises';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';
import mammoth from 'mammoth';
import { parseResumeProfile } from './resumeProfileParser.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Tesseract downloads eng.traineddata once and keeps it here
const OCR_CACHE_DIR = path.join(__dirname, '../.cache/tesseract');

// Loaded lazily so a missing/broken pdfjs install never takes the server down
let pdfjsPromise = null;
const loadPdfjs = () => {
  if (!pdfjsPromise) pdfjsPromise = import('pdfjs-dist/legacy/build/pdf.mjs');
  return pdfjsPromise;
};

// ── OCR for image-only PDFs (Naukri exports, scans) ─────────────────────────

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const pngChunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
};

// pdf.js decoded image → PNG buffer tesseract can read (kind 1 = 1bpp, 2 = RGB, 3 = RGBA)
const imageToPng = ({ width, height, data, kind }) => {
  const channels = kind === 3 ? 4 : 3;
  const rowLen = width * channels;
  const raw = Buffer.alloc((rowLen + 1) * height);
  for (let y = 0; y < height; y++) {
    const row = y * (rowLen + 1) + 1;
    if (kind === 1) {
      const stride = (width + 7) >> 3;
      for (let x = 0; x < width; x++) {
        const v = (data[y * stride + (x >> 3)] >> (7 - (x & 7))) & 1 ? 255 : 0;
        raw[row + x * 3] = raw[row + x * 3 + 1] = raw[row + x * 3 + 2] = v;
      }
    } else {
      Buffer.from(data.buffer, data.byteOffset + y * rowLen, rowLen).copy(raw, row);
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = channels === 4 ? 6 : 2;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', zlib.deflateSync(raw)),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
};

// Words that overlap vertically → one line, read left to right. Overlap (not
// centre distance) keeps "AJAY CHAVDA" together when the two words use
// different font weights.
const wordsToLines = (words) => {
  const sorted = [...words].sort((a, b) => a.bbox.y0 - b.bbox.y0);
  const lines = [];
  for (const w of sorted) {
    const h = w.bbox.y1 - w.bbox.y0;
    const line = lines.find((l) => {
      const overlap = Math.min(l.y1, w.bbox.y1) - Math.max(l.y0, w.bbox.y0);
      return overlap > Math.min(h, l.y1 - l.y0) * 0.5;
    });
    if (line) {
      line.words.push(w);
      line.y0 = Math.min(line.y0, w.bbox.y0);
      line.y1 = Math.max(line.y1, w.bbox.y1);
    } else lines.push({ y0: w.bbox.y0, y1: w.bbox.y1, words: [w] });
  }
  return lines
    .sort((a, b) => a.y0 - b.y0)
    .map((l) => l.words.sort((a, b) => a.bbox.x0 - b.bbox.x0).map((w) => w.text).join(' '))
    // OCR reads bullet dots as « * + = ¢ or an icon as [\/]; turn them back into a real bullet
    .map((l) => l.replace(/^(?:[«»*+=¢©®~|•·°]|\[\S{0,4}\])\s+(?=\S)/, '• '));
};

// Tesseract reads straight across two-column resumes, mixing both columns on
// one line. Find the vertical gutter between columns from the word boxes and
// emit full-width lines (the name banner) first, then the left column, then the right.
const layoutOcrWords = (words, pageWidth) => {
  const cov = new Array(pageWidth + 1).fill(0);
  words.forEach((w) => { for (let x = Math.max(0, w.bbox.x0); x <= Math.min(pageWidth, w.bbox.x1); x++) cov[x]++; });

  let best = null;
  let start = null;
  const maxCross = Math.max(2, Math.round(words.length * 0.02));
  for (let x = Math.round(pageWidth * 0.2); x <= Math.round(pageWidth * 0.8); x++) {
    if (cov[x] <= maxCross) {
      if (start === null) start = x;
      if (!best || x - start > best.end - best.start) best = { start, end: x };
    } else start = null;
  }
  if (best && best.end - best.start >= 15) {
    const mid = (best.start + best.end) / 2;
    const crosses = words.filter((w) => w.bbox.x0 < best.start && w.bbox.x1 > best.end);
    // Words sharing a row with a gutter-crossing word belong to that full-width
    // row ("AJAY" sits left of the gutter, "CHAVDA" crosses it)
    const onSpanningRow = (w) => crosses.some((c) =>
      Math.min(c.bbox.y1, w.bbox.y1) - Math.max(c.bbox.y0, w.bbox.y0) > Math.min(c.bbox.y1 - c.bbox.y0, w.bbox.y1 - w.bbox.y0) * 0.5);
    const spanning = words.filter((w) => crosses.includes(w) || onSpanningRow(w));
    const left = words.filter((w) => !spanning.includes(w) && w.bbox.x0 < mid);
    const right = words.filter((w) => !spanning.includes(w) && w.bbox.x0 >= mid);
    if (left.length >= words.length * 0.15 && right.length >= words.length * 0.15) {
      return [...wordsToLines(spanning), ...wordsToLines(left), ...wordsToLines(right)].join('\n');
    }
  }
  return wordsToLines(words).join('\n');
};

const ocrPdf = async (buffer) => {
  const pdfjs = await loadPdfjs();
  const { createWorker } = await import('tesseract.js');
  await fs.mkdir(OCR_CACHE_DIR, { recursive: true });
  const doc = await pdfjs.getDocument({ data: new Uint8Array(buffer), isEvalSupported: false, verbosity: 0 }).promise;
  const worker = await createWorker('eng', 1, { cachePath: OCR_CACHE_DIR });
  // Sparse-text mode finds large banner text (the name) that page mode skips
  await worker.setParameters({ tessedit_pageseg_mode: '11' });
  let out = '';
  try {
    for (let p = 1; p <= Math.min(doc.numPages, 5); p++) {
      const page = await doc.getPage(p);
      const ops = await page.getOperatorList();
      for (let i = 0; i < ops.fnArray.length; i++) {
        if (ops.fnArray[i] !== pdfjs.OPS.paintImageXObject) continue;
        const name = ops.argsArray[i][0];
        const objs = name.startsWith('g_') ? page.commonObjs : page.objs;
        const img = await new Promise((resolve) => objs.get(name, resolve));
        // Skip photos / logos — a page scan is big
        if (!img?.data || img.width < 500 || img.height < 500) continue;
        const { data } = await worker.recognize(imageToPng(img), {}, { blocks: true });
        const words = (data.blocks || [])
          .flatMap((b) => b.paragraphs.flatMap((pg) => pg.lines.flatMap((l) => l.words)))
          .filter((w) => w.text.trim() && w.confidence > 30);
        out += layoutOcrWords(words, img.width) + '\n';
      }
    }
  } finally {
    await worker.terminate();
    await doc.destroy();
  }
  return out;
};

// Rebuild text lines from pdf.js text items (items on the same baseline = one line)
const extractPdfText = async (buffer) => {
  const pdfjs = await loadPdfjs();
  const doc = await pdfjs.getDocument({
    data: new Uint8Array(buffer),
    isEvalSupported: false,
    useSystemFonts: true,
    verbosity: 0,
  }).promise;
  let out = '';
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const { items } = await page.getTextContent();
    let lastY = null;
    for (const item of items) {
      const y = item.transform[5];
      if (lastY !== null && Math.abs(y - lastY) > 2) out += '\n';
      else if (lastY !== null && item.str && !out.endsWith(' ')) out += ' ';
      out += item.str;
      lastY = y;
      if (item.hasEOL) { out += '\n'; lastY = null; }
    }
    out += '\n';
  }
  await doc.destroy();
  return out;
};

class ResumeProcessor {
  /**
   * Extract text from PDF, DOC, or DOCX file
   */
  static async extractTextFromFile(filePath, fileType) {
    try {
      const buffer = await fs.readFile(filePath);

      if (fileType === 'pdf') {
        const text = await extractPdfText(buffer);
        // No text layer → the resume is an image (Naukri export / scan), so OCR it
        if (text.replace(/\s/g, '').length >= 50) return text;
        try {
          const ocrText = await ocrPdf(buffer);
          return ocrText.trim() ? ocrText : text;
        } catch (err) {
          console.error('OCR failed:', err.message);
          return text;
        }
      } else if (fileType === 'doc' || fileType === 'docx') {
        const result = await mammoth.extractRawText({ buffer });
        return result.value;
      } else {
        throw new Error(`Unsupported file type: ${fileType}`);
      }
    } catch (error) {
      console.error('Error extracting text:', error);
      // Return empty string instead of throwing error
      return '';
    }
  }

  /**
   * Parse resume text into { parsedData, candidateProfile } — candidateProfile
   * pre-fills the Search Resume "Edit Candidate" screen.
   */
  static parseResumeProfile(text) {
    return parseResumeProfile(text);
  }

  /**
   * Parse resume data from extracted text
   */
  static parseResumeData(text) {
    if (!text || text.trim().length === 0) {
      return {
        name: '',
        email: '',
        phone: '',
        skills: [],
        experience: '',
        education: '',
        summary: ''
      };
    }

    const parsedData = {
      name: this.extractName(text),
      email: this.extractEmail(text),
      phone: this.extractPhone(text),
      skills: this.extractSkills(text),
      experience: this.extractExperience(text),
      education: this.extractEducation(text),
      summary: this.extractSummary(text)
    };

    return parsedData;
  }

  /**
   * Extract name (first line typically contains name)
   */
  static extractName(text) {
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    if (lines.length > 0) {
      const firstLine = lines[0].trim();
      if (firstLine.length < 50 && !firstLine.includes('@') && !/\d{3,}/.test(firstLine)) {
        return firstLine;
      }
    }
    return '';
  }

  /**
   * Extract email address
   */
  static extractEmail(text) {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emails = text.match(emailRegex);
    return emails && emails.length > 0 ? emails[0] : '';
  }

  /**
   * Extract phone number
   */
  static extractPhone(text) {
    const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
    const phones = text.match(phoneRegex);
    return phones && phones.length > 0 ? phones[0] : '';
  }

  /**
   * Extract skills (look for keywords like "Skills", "Technical Skills", etc.)
   */
  static extractSkills(text) {
    const skillsSection = /(?:skills|technical skills|technologies|expertise)[\s:]*([^\n]+(?:\n(?!\n)[^\n]+)*)/i;
    const match = text.match(skillsSection);
    
    if (match && match[1]) {
      const skillsText = match[1];
      const skills = skillsText
        .split(/[,;\n|]/)
        .map(skill => skill.trim())
        .filter(skill => skill.length > 1 && skill.length < 50);
      return [...new Set(skills)].slice(0, 20);
    }
    
    return [];
  }

  /**
   * Extract work experience
   */
  static extractExperience(text) {
    const experienceSection = /(?:experience|work experience|employment|work history)[\s:]*([^\n]+(?:\n(?!\n)[^\n]+)*)/i;
    const match = text.match(experienceSection);
    
    if (match && match[1]) {
      return match[1].substring(0, 500);
    }
    
    return '';
  }

  /**
   * Extract education
   */
  static extractEducation(text) {
    const educationSection = /(?:education|academic|qualification)[\s:]*([^\n]+(?:\n(?!\n)[^\n]+)*)/i;
    const match = text.match(educationSection);
    
    if (match && match[1]) {
      return match[1].substring(0, 500);
    }
    
    return '';
  }

  /**
   * Extract summary/objective
   */
  static extractSummary(text) {
    const summarySection = /(?:summary|objective|profile|about)[\s:]*([^\n]+(?:\n(?!\n)[^\n]+)*)/i;
    const match = text.match(summarySection);
    
    if (match && match[1]) {
      return match[1].substring(0, 300);
    }
    
    return text.substring(0, 200);
  }
}

export default ResumeProcessor;