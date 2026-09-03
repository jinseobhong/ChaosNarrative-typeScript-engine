import dotenv from 'dotenv';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Anthropic from '@anthropic-ai/sdk';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const geminiKey = process.env.GEMINI_API_KEY || '';
const anthropicKey = process.env.ANTHROPIC_API_KEY || '';
const workspaceId = process.env.ANTHROPIC_WORKSPACE_ID || '';

console.log('====================================================');
console.log('          API 키 정밀 진단 테스트');
console.log('====================================================\n');

// 1. Test Gemini
console.log('[1] Google Gemini API 테스트 중...');
console.log(`- 입력된 키 접두사: ${geminiKey ? geminiKey.substring(0, 7) + '...' : '(없음)'}`);
console.log(`- 키 길이: ${geminiKey.length}자`);

if (!geminiKey.startsWith('AIzaSy')) {
  console.log('❌ [경고] Google AI Studio의 표준 API 키는 반드시 "AIzaSy"로 시작해야 합니다.');
  console.log('   현재 입력된 "AQ.Ab8..."는 Google Cloud OAuth 토큰으로, AI Studio API에서 거부됩니다.\n');
} else {
  try {
    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const res = await model.generateContent('ping');
    console.log('✅ Google Gemini API 연결 성공! 응답:', (await res.response).text().trim());
  } catch (err) {
    console.log('❌ Google Gemini API 오류:', err.message);
  }
}

// 2. Test Anthropic Claude
console.log('\n[2] Anthropic Claude API 테스트 중...');
console.log(`- 입력된 키 접두사: ${anthropicKey ? anthropicKey.substring(0, 15) + '...' : '(없음)'}`);
console.log(`- 키 끝부분: ...${anthropicKey ? anthropicKey.substring(anthropicKey.length - 6) : ''}`);
console.log(`- 키 길이: ${anthropicKey.length}자`);
console.log(`- 워크스페이스 ID: ${workspaceId || '(미설정)'}`);

try {
  const defaultHeaders = {};
  if (workspaceId) {
    defaultHeaders['anthropic-workspace-id'] = workspaceId.trim();
  }

  const anthropic = new Anthropic({
    apiKey: anthropicKey.trim(),
    defaultHeaders: Object.keys(defaultHeaders).length > 0 ? defaultHeaders : undefined,
  });

  const res = await anthropic.messages.create({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 20,
    messages: [{ role: 'user', content: 'hello' }],
  });

  console.log('✅ Anthropic Claude API 연결 성공! 응답:', res.content[0].text.trim());
} catch (err) {
  console.log('❌ Anthropic Claude API 오류:', err.status, err.message);
}

console.log('\n====================================================');
