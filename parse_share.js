const fs = require('fs');

const filePath = 'C:\\Users\\ihyeo\\.gemini\\antigravity\\brain\\cdf26eb8-f856-4cc7-abc4-0bd63ef3cd7c\\.system_generated\\steps\\1109\\content.md';
const content = fs.readFileSync(filePath, 'utf8');

console.log('Total content length:', content.length);

// Search for WIZ_global_data or AF_initDataCallback
const regex = /AF_initDataCallback\s*\(\s*\{[\s\S]*?data:\s*(\[[\s\S]*?\])\s*\}\s*\);/g;
let match;
let count = 0;

while ((match = regex.exec(content)) !== null) {
  count++;
  try {
    const rawData = match[1];
    // Find all string tokens inside
    const strMatches = rawData.match(/"(?:[^"\\]|\\.)*"/g) || [];
    for (const strToken of strMatches) {
      const unescaped = JSON.parse(strToken);
      if (unescaped && unescaped.length > 30) {
        if (/[\uac00-\ud7a3]/.test(unescaped) || unescaped.includes('DOM') || unescaped.includes('EROS') || unescaped.toLowerCase().includes('formula') || unescaped.includes('수식') || unescaped.includes('페이즈')) {
          console.log(`\n=== FOUND ITEM in Block ${count} ===`);
          console.log(unescaped);
          console.log('='.repeat(50));
        }
      }
    }
  } catch (e) {
    console.error('Parse error:', e.message);
  }
}

// Also check raw string regex
const rawKorean = content.match(/[\uac00-\ud7a3\w\s\.,\-\+\=\(\)\{\}\[\]\*\/\^\%\$\#\@\!:\\\n]{50,}/g) || [];
console.log('Total raw Korean candidate matches:', rawKorean.length);
for (const k of rawKorean.slice(0, 10)) {
  if (/[\uac00-\ud7a3]/.test(k)) {
    console.log('--- RAW MATCH ---');
    console.log(k.slice(0, 500));
  }
}
