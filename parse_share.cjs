const fs = require('fs');

const filePath = 'C:\\Users\\ihyeo\\.gemini\\antigravity\\brain\\cdf26eb8-f856-4cc7-abc4-0bd63ef3cd7c\\.system_generated\\steps\\1135\\content.md';
const content = fs.readFileSync(filePath, 'utf8');

// Find all 6-character or 5-character rpc identifiers
const rpcMatches = content.match(/data-id="[^"]+"/g) || [];
console.log('Data IDs in html:', rpcMatches);

// Search for share or url mentions
const shareMentions = content.match(/[^"'\s]*kb3nGO8zEmDt[^"'\s]*/g) || [];
console.log('Share mentions:', shareMentions);

// Search for SNlM0e (the session token often used in Bard batchexecute)
const snlm0e = content.match(/"SNlM0e":"([^"]+)"/);
console.log('SNlM0e:', snlm0e ? snlm0e[1] : 'null');

const fdrfje = content.match(/"FdrFJe":"([^"]+)"/);
console.log('FdrFJe:', fdrfje ? fdrfje[1] : 'null');
