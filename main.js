/**
 * main.js — Study Board 로컬 서버 (순수 Node.js)
 * 실행: node main.js
 * 외부 패키지 없음 — Node.js 기본 모듈만 사용
 */

const http = require('http');
const fs   = require('fs');
const path = require('path');

const PORT    = 3000;
const DB_FILE = path.join(__dirname, 'board_data.json');

// ── 초기 데이터 ───────────────────────────────
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

// ── DB 헬퍼 ───────────────────────────────────
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
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// ── MIME 타입 ─────────────────────────────────
function getMime(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const map = {
    '.html': 'text/html; charset=utf-8',
    '.js':   'application/javascript',
    '.css':  'text/css',
    '.json': 'application/json',
    '.png':  'image/png',
    '.jpg':  'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg':  'image/svg+xml',
    '.ico':  'image/x-icon'
  };
  return map[ext] || 'application/octet-stream';
}

// ── CORS 헤더 ─────────────────────────────────
function setCORS(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// ── JSON 응답 헬퍼 ────────────────────────────
function sendJSON(res, statusCode, data) {
  setCORS(res);
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

// ── 정적 파일 서빙 ────────────────────────────
function serveStatic(res, filePath) {
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404);
      res.end('Not Found');
      return;
    }
    res.writeHead(200, { 'Content-Type': getMime(filePath) });
    res.end(content);
  });
}

// ── 서버 ─────────────────────────────────────
const server = http.createServer((req, res) => {
  const { method, url } = req;

  // CORS preflight
  if (method === 'OPTIONS') {
    setCORS(res);
    res.writeHead(204);
    res.end();
    return;
  }

  // ── GET /api/board — 데이터 조회 ──────────
  if (method === 'GET' && url === '/api/board') {
    const data = readDB();
    sendJSON(res, 200, data);
    return;
  }

  // ── POST /api/board — 데이터 저장 ─────────
  if (method === 'POST' && url === '/api/board') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        if (!data || !Array.isArray(data.pages)) {
          sendJSON(res, 400, { error: '잘못된 데이터 형식' });
          return;
        }
        writeDB(data);
        sendJSON(res, 200, { success: true });
      } catch (e) {
        sendJSON(res, 500, { error: '데이터 저장 실패' });
      }
    });
    return;
  }

  // ── 정적 파일 서빙 (index.html, 이미지 등) ─
  let filePath = path.join(__dirname, url === '/' ? 'index.html' : url);
  // 경로 탈출 방지
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }
  serveStatic(res, filePath);
});

server.listen(PORT, () => {
  console.log(`✅ Study Board 서버 실행 중: http://localhost:${PORT}`);
  console.log(`   데이터 파일: ${DB_FILE}`);
  console.log(`   종료: Ctrl + C`);
});