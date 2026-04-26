const http = require('http');
const fs   = require('fs');
const path = require('path');
const url  = require('url');

// ── 데이터 저장 경로 ─────────────────────────────
const DATA_DIR  = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'notes.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

const INITIAL = {
  pages: [
    {
      id: 'page_1',
      title: '시작하기',
      emoji: '👋',
      category: '일반',
      content: '# Study Board에 오신 걸 환영합니다!\n\n공부한 내용을 자유롭게 정리해보세요.\n\n## 마크다운 문법\n\n**굵게** / *기울임* / `인라인 코드`\n\n```js\n// 코드 블록\nconsole.log("Hello, Study Board!");\n```\n\n## 리스트\n- 항목 1\n- 항목 2\n- 항목 3',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'page_2',
      title: 'JavaScript 핵심 정리',
      emoji: '📝',
      category: 'JavaScript',
      content: '# JavaScript 핵심 개념\n\n## 클로저 (Closure)\n\n함수가 선언될 당시의 스코프를 기억하는 것.\n\n```js\nfunction counter() {\n  let count = 0;\n  return () => ++count;\n}\nconst inc = counter();\ninc(); // 1\ninc(); // 2\n```\n\n## 프로미스 (Promise)\n\n```js\nfetch(url)\n  .then(res => res.json())\n  .then(data => console.log(data))\n  .catch(err => console.error(err));\n```',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  categories: ['일반', 'JavaScript', 'React', 'CSS', 'Node.js', '알고리즘']
};

if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(INITIAL, null, 2), 'utf-8');
}

function readData()      { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8')); }
function writeData(data) { fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8'); }
function genId()         { return 'page_' + Date.now(); }

// ── JSON 응답 헬퍼 ────────────────────────────────
function jsonRes(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(body));
}

// ── 요청 바디 파싱 ────────────────────────────────
function getBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try { resolve(JSON.parse(body)); }
      catch { resolve({}); }
    });
    req.on('error', reject);
  });
}

// ── 서버 ─────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  const parsed   = url.parse(req.url, true);
  const pathname = parsed.pathname;
  const method   = req.method;

  // CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    return res.end();
  }

  // ── GET /api/pages ─────────────────────────────
  // 전체 페이지 + 카테고리 목록 반환
  if (method === 'GET' && pathname === '/api/pages') {
    return jsonRes(res, 200, readData());
  }

  // ── GET /api/pages/:id ─────────────────────────
  // 단일 페이지 반환
  const pageMatch = pathname.match(/^\/api\/pages\/(.+)$/);
  if (method === 'GET' && pageMatch) {
    const data = readData();
    const page = data.pages.find(p => p.id === pageMatch[1]);
    if (!page) return jsonRes(res, 404, { error: 'Not found' });
    return jsonRes(res, 200, page);
  }

  // ── POST /api/pages ────────────────────────────
  // 새 페이지 생성
  if (method === 'POST' && pathname === '/api/pages') {
    const body = await getBody(req);
    const data = readData();

    // 새 카테고리 자동 추가
    if (body.category && !data.categories.includes(body.category)) {
      data.categories.push(body.category);
    }

    const newPage = {
      id:        genId(),
      title:     (body.title || '제목 없음').trim(),
      emoji:     (body.emoji || '📄').trim(),
      category:  body.category || '일반',
      content:   body.content || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    data.pages.push(newPage);
    writeData(data);
    console.log(`[생성] ${newPage.title}`);
    return jsonRes(res, 201, newPage);
  }

  // ── PUT /api/pages/:id ─────────────────────────
  // 페이지 수정
  if (method === 'PUT' && pageMatch) {
    const body = await getBody(req);
    const data = readData();
    const idx  = data.pages.findIndex(p => p.id === pageMatch[1]);
    if (idx === -1) return jsonRes(res, 404, { error: 'Not found' });

    // 새 카테고리 자동 추가
    if (body.category && !data.categories.includes(body.category)) {
      data.categories.push(body.category);
    }

    data.pages[idx] = {
      ...data.pages[idx],
      title:     (body.title || data.pages[idx].title).trim(),
      emoji:     (body.emoji || data.pages[idx].emoji).trim(),
      category:  body.category || data.pages[idx].category,
      content:   body.content ?? data.pages[idx].content,
      updatedAt: new Date().toISOString()
    };
    writeData(data);
    console.log(`[수정] ${data.pages[idx].title}`);
    return jsonRes(res, 200, data.pages[idx]);
  }

  // ── DELETE /api/pages/:id ──────────────────────
  // 페이지 삭제
  if (method === 'DELETE' && pageMatch) {
    const data  = readData();
    const before = data.pages.length;
    data.pages   = data.pages.filter(p => p.id !== pageMatch[1]);
    if (data.pages.length === before) return jsonRes(res, 404, { error: 'Not found' });
    writeData(data);
    console.log(`[삭제] id: ${pageMatch[1]}`);
    return jsonRes(res, 200, { success: true });
  }

  // ── 404 ───────────────────────────────────────
  jsonRes(res, 404, { error: 'Not Found' });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log('');
  console.log('╔═══════════════════════════════════════╗');
  console.log('║   📚  Study Board 서버 실행 중!        ║');
  console.log('╠═══════════════════════════════════════╣');
  console.log(`║   API  → http://localhost:${PORT}/api    ║`);
  console.log('║   데이터 → data/notes.json 에 저장      ║');
  console.log('╚═══════════════════════════════════════╝');
  console.log('');
  console.log('   study.html 을 브라우저에서 열어주세요.');
  console.log('   (index.html의 Study Board 버튼 클릭)');
  console.log('');
});