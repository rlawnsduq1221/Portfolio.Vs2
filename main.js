/**
 * main.js — Study Board 로컬 서버 (Firebase 대체)
 * 실행: node main.js
 * 필요 패키지: npm install express cors
 */

const express = require('express');
const cors    = require('cors');
const fs      = require('fs');
const path    = require('path');

const app  = express();
const PORT = 3000;

// ── 미들웨어 ──────────────────────────────────
app.use(cors());                          // 브라우저 CORS 허용
app.use(express.json());                  // JSON 바디 파싱
app.use(express.static(__dirname));       // index.html, 이미지 등 정적 파일 제공

// ── 데이터 파일 경로 ──────────────────────────
const DB_FILE = path.join(__dirname, 'board_data.json');

// 초기 데이터 (서버 최초 실행 시 파일이 없을 때 사용)
const INITIAL_DATA = {
  pages: [
    {
      id: 'page_1',
      title: '시작하기',
      emoji: '👋',
      category: '일반',
      content:
        '# Study Board에 오신 걸 환영합니다!\n\n공부한 내용을 자유롭게 정리해보세요.\n\n' +
        '## 마크다운 문법\n\n**굵게** / *기울임* / `인라인 코드`\n\n' +
        '```js\n// 코드 블록\nconsole.log("Hello, Study Board!");\n```\n\n' +
        '## 리스트\n- 항목 1\n- 항목 2\n- 항목 3',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'page_2',
      title: 'JavaScript 핵심 정리',
      emoji: '📝',
      category: 'JavaScript',
      content:
        '# JavaScript 핵심 개념\n\n## 클로저 (Closure)\n\n' +
        '함수가 선언될 당시의 스코프를 기억하는 것.\n\n' +
        '```js\nfunction counter() {\n  let count = 0;\n  return () => ++count;\n}\n' +
        'const inc = counter();\ninc(); // 1\ninc(); // 2\n```\n\n' +
        '## 프로미스 (Promise)\n\n```js\nfetch(url)\n  .then(res => res.json())\n' +
        '  .then(data => console.log(data))\n  .catch(err => console.error(err));\n```',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  categories: ['일반', 'JavaScript', 'React', 'CSS', 'Node.js', '알고리즘']
};

// ── 헬퍼: JSON 파일 읽기 / 쓰기 ──────────────
function readDB() {
  try {
    if (!fs.existsSync(DB_FILE)) return JSON.parse(JSON.stringify(INITIAL_DATA));
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
  } catch (e) {
    console.error('DB 읽기 오류:', e);
    return JSON.parse(JSON.stringify(INITIAL_DATA));
  }
}

function writeDB(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('DB 쓰기 오류:', e);
    throw e;
  }
}

// ── API 라우트 ────────────────────────────────

// GET /api/board — 전체 데이터 조회
app.get('/api/board', (req, res) => {
  try {
    const data = readDB();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: '데이터 로드 실패' });
  }
});

// POST /api/board — 전체 데이터 저장 (Firebase setDoc 대체)
app.post('/api/board', (req, res) => {
  try {
    const data = req.body;
    if (!data || !Array.isArray(data.pages)) {
      return res.status(400).json({ error: '잘못된 데이터 형식' });
    }
    writeDB(data);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: '데이터 저장 실패' });
  }
});

// ── 서버 시작 ─────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ Study Board 서버 실행 중: http://localhost:${PORT}`);
  console.log(`   데이터 파일: ${DB_FILE}`);
  console.log(`   종료: Ctrl + C`);
});