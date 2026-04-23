const http = require('http');
const url = require('url');
const qs = require('querystring');

// [핵심] 파일 대신 데이터를 저장할 객체 변수
// 생활코딩의 파일 입출력 로직을 메모리 기반으로 대체합니다.
let boardData = {
  'Welcome': '안녕하세요! 파일 없이 메모리에서 바로 작동하는 게시판입니다.',
  'Nodejs': 'Node.js는 자바스크립트 런타임입니다.'
};

// 학습 게시판 데이터 (제목 -> { desc, category, date })
let studyData = {
  'HTML & CSS 기초': {
    desc: 'HTML 시맨틱 태그, CSS Flexbox와 Grid 레이아웃을 배웠다.\n- display: flex / grid\n- 시맨틱 태그: header, main, section, footer\n- box-sizing: border-box',
    category: 'Web',
    date: new Date().toLocaleDateString('ko-KR')
  },
  'Node.js HTTP 서버': {
    desc: 'Node.js 내장 http 모듈로 서버를 만들고 라우팅하는 법을 배웠다.\n- http.createServer()\n- url.parse()로 경로 파싱\n- querystring으로 POST 데이터 처리',
    category: 'Backend',
    date: new Date().toLocaleDateString('ko-KR')
  }
};

/* ── 학습 게시판 공통 HTML 템플릿 ── */
const CATEGORY_COLORS = {
  'Web':        '#4f46e5',
  'Backend':    '#10b981',
  'JavaScript': '#f59e0b',
  'React':      '#06b6d4',
  'Python':     '#3b82f6',
  'AI':         '#8b5cf6',
  '기타':       '#6b7280'
};

function studyTemplateHTML(title, listHTML, bodyHTML, controlHTML) {
  return `
<!DOCTYPE html>
<html>
<head>
  <title>Study Board — ${title}</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; text-decoration: none; }
    body { font-family: 'Pretendard', sans-serif; background: #0f172a; color: #f8fafc; min-height: 100vh; }

    /* ── TOP NAV ── */
    .topnav {
      display: flex; justify-content: space-between; align-items: center;
      padding: 14px 30px;
      background: rgba(15,23,42,0.9);
      border-bottom: 1px solid rgba(255,255,255,0.06);
      position: sticky; top: 0; z-index: 100;
      backdrop-filter: blur(10px);
    }
    .topnav-left { display: flex; align-items: center; gap: 16px; }
    .home-link {
      font-size: 14px; font-weight: 700; color: #4f46e5;
      display: flex; align-items: center; gap: 6px;
    }
    .home-link:hover { color: #818cf8; }
    .breadcrumb { font-size: 12px; color: #475569; }
    .breadcrumb span { color: #94a3b8; }
    .write-btn {
      padding: 8px 18px; background: #4f46e5; color: white;
      border-radius: 8px; font-size: 13px; font-weight: 600;
      border: none; cursor: pointer; transition: background 0.2s;
    }
    .write-btn:hover { background: #4338ca; }

    /* ── LAYOUT ── */
    .layout {
      display: grid;
      grid-template-columns: 240px 1fr;
      gap: 0;
      min-height: calc(100vh - 57px);
    }

    /* ── SIDEBAR ── */
    .sidebar {
      background: #0a111e;
      border-right: 1px solid rgba(255,255,255,0.06);
      padding: 24px 16px;
    }
    .sidebar-title {
      font-size: 10px; letter-spacing: 2px; color: #475569;
      text-transform: uppercase; padding: 0 8px; margin-bottom: 12px;
    }
    .study-list { list-style: none; }
    .study-list li a {
      display: flex; align-items: flex-start; gap: 10px;
      padding: 10px 10px; border-radius: 8px;
      color: #94a3b8; font-size: 13px; line-height: 1.4;
      transition: background 0.15s, color 0.15s;
      cursor: pointer;
    }
    .study-list li a:hover { background: rgba(79,70,229,0.1); color: #f8fafc; }
    .study-list li a.active { background: rgba(79,70,229,0.15); color: #818cf8; }
    .cat-dot {
      width: 8px; height: 8px; border-radius: 50%;
      flex-shrink: 0; margin-top: 4px;
    }
    .study-list-title { flex: 1; }

    .sidebar-section { margin-top: 28px; }
    .cat-filter-title {
      font-size: 10px; letter-spacing: 2px; color: #475569;
      text-transform: uppercase; padding: 0 8px; margin-bottom: 10px;
    }
    .cat-list { list-style: none; }
    .cat-list li a {
      display: flex; align-items: center; gap: 8px;
      padding: 7px 10px; border-radius: 6px;
      font-size: 12px; color: #64748b;
      transition: background 0.15s, color 0.15s;
    }
    .cat-list li a:hover { background: rgba(255,255,255,0.04); color: #94a3b8; }
    .cat-badge {
      display: inline-block; width: 8px; height: 8px; border-radius: 50%;
    }

    /* ── MAIN CONTENT ── */
    .main { padding: 36px 44px; }
    .main h2 { font-size: 26px; font-weight: 700; margin-bottom: 6px; }
    .meta-row {
      display: flex; align-items: center; gap: 10px;
      margin-bottom: 28px; flex-wrap: wrap;
    }
    .cat-chip {
      display: inline-block;
      padding: 3px 10px; border-radius: 100px;
      font-size: 11px; font-weight: 700;
      color: white;
    }
    .date-text { font-size: 12px; color: #475569; }

    .content-body {
      background: #1e293b; border: 1px solid rgba(255,255,255,0.07);
      border-radius: 12px; padding: 28px;
      font-size: 14px; color: #cbd5e1; line-height: 1.9;
      white-space: pre-wrap; min-height: 220px;
    }

    .control-row { display: flex; gap: 10px; margin-bottom: 20px; }
    .btn {
      padding: 8px 18px; border-radius: 8px;
      font-size: 13px; font-weight: 600;
      cursor: pointer; border: none; transition: all 0.2s;
    }
    .btn-primary { background: #4f46e5; color: white; }
    .btn-primary:hover { background: #4338ca; }
    .btn-secondary { background: #334155; color: #f8fafc; }
    .btn-secondary:hover { background: #475569; }
    .btn-danger { background: #ef4444; color: white; }
    .btn-danger:hover { background: #dc2626; }

    /* ── FORM ── */
    .form-card {
      background: #1e293b; border: 1px solid rgba(255,255,255,0.07);
      border-radius: 12px; padding: 28px; max-width: 680px;
    }
    .form-label { font-size: 12px; color: #64748b; margin-bottom: 6px; display: block; letter-spacing: 0.5px; }
    .form-input, .form-select, .form-textarea {
      width: 100%; padding: 11px 14px;
      background: #0f172a; border: 1px solid #334155;
      border-radius: 8px; color: #f8fafc; font-size: 14px;
      font-family: 'Pretendard', sans-serif;
      margin-bottom: 18px; transition: border-color 0.2s;
    }
    .form-input:focus, .form-select:focus, .form-textarea:focus {
      outline: none; border-color: #4f46e5;
    }
    .form-select option { background: #1e293b; }
    .form-textarea { min-height: 200px; resize: vertical; line-height: 1.7; }
    .form-hint { font-size: 11px; color: #475569; margin-top: -14px; margin-bottom: 18px; }

    /* ── EMPTY STATE ── */
    .empty { text-align: center; padding: 80px 40px; color: #475569; }
    .empty-icon { font-size: 48px; margin-bottom: 16px; }
    .empty p { font-size: 15px; margin-bottom: 4px; color: #64748b; }
    .empty small { font-size: 12px; }

    @media (max-width: 700px) {
      .layout { grid-template-columns: 1fr; }
      .sidebar { display: none; }
      .main { padding: 20px 16px; }
    }
  </style>
</head>
<body>
  <nav class="topnav">
    <div class="topnav-left">
      <a href="/" class="home-link">← 홈으로</a>
      <span class="breadcrumb">/ <span>Study Board</span></span>
    </div>
    <a href="/study/create" class="write-btn">+ 새 학습 기록</a>
  </nav>
  <div class="layout">
    <aside class="sidebar">
      <p class="sidebar-title">학습 목록</p>
      ${listHTML}
      <div class="sidebar-section">
        <p class="cat-filter-title">카테고리</p>
        <ul class="cat-list">
          ${Object.entries(CATEGORY_COLORS).map(([cat, color]) =>
            `<li><a href="/study/category?cat=${encodeURIComponent(cat)}"><span class="cat-badge" style="background:${color}"></span>${cat}</a></li>`
          ).join('')}
        </ul>
      </div>
    </aside>
    <main class="main">
      ${controlHTML}
      <h2>${title}</h2>
      ${bodyHTML}
    </main>
  </div>
</body>
</html>`;
}

function studyList(activeId) {
  const keys = Object.keys(studyData);
  if (keys.length === 0) return '<p style="font-size:12px;color:#475569;padding:0 8px;">아직 기록이 없습니다.</p>';
  return `<ul class="study-list">${keys.map(k => {
    const item = studyData[k];
    const color = CATEGORY_COLORS[item.category] || '#6b7280';
    const isActive = k === activeId ? ' active' : '';
    return `<li><a href="/study?id=${encodeURIComponent(k)}" class="${isActive}">
      <span class="cat-dot" style="background:${color}"></span>
      <span class="study-list-title">${k}</span>
    </a></li>`;
  }).join('')}</ul>`;
}

function templateHTML(title, list, body, control) {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <title>Junyeop's Board - ${title}</title>
    <meta charset="utf-8">

  
  <style>
      body { margin: 0; font-family: sans-serif; background: #0f172a; color: #f8fafc; }
      .container { max-width: 800px; margin: 50px auto; padding: 20px; }
      header { border-bottom: 1px solid #1e293b; padding-bottom: 20px; margin-bottom: 30px; }
      h1 a { color: #4f46e5; text-decoration: none; font-size: 28px; }
      ol { padding: 0; list-style: none; display: flex; gap: 10px; margin-bottom: 20px; }
      ol li a { background: #1e293b; color: #cbd5e1; padding: 6px 12px; border-radius: 6px; text-decoration: none; font-size: 14px; border: 1px solid #334155; }
      ol li a:hover { border-color: #4f46e5; }
      .content-box { background: #1e293b; padding: 30px; border-radius: 12px; border: 1px solid #334155; }
      h2 { color: #818cf8; margin-top: 0; }
      p { line-height: 1.8; color: #94a3b8; white-space: pre-wrap; }
      .control { margin-bottom: 20px; display: flex; gap: 10px; }
      .btn { padding: 8px 15px; border-radius: 5px; text-decoration: none; font-size: 13px; font-weight: bold; cursor: pointer; border: none; }
      .btn-primary { background: #4f46e5; color: white; width: 50px; heigth:32px;display:flex;justify-content:center;}
      .btn-secondary { background: #475569; color: white; }
      .btn-danger { background: #ef4444; color: white; }
      input, textarea { width: 100%; padding: 12px; margin-bottom: 15px; border-radius: 6px; border: 1px solid #334155; background: #0f172a; color: white; box-sizing: border-box; }
    </style>
  </head>
  <body>
    <div class="container">
      <header><h1><a href="/">JunYeop's Board</a></h1></header>
      <nav>${list}</nav>
      <div class="control">${control}</div>
      <main class="content-box">
        <h2>${title}</h2>
        <div>${body}</div>
      </main>
    </div>
  </body>
  </html>
  `;
}

function templateList() {
  let list = '<ol>';
  // boardData 객체의 키(제목)들을 순회하며 리스트 생성
  const titles = Object.keys(boardData);
  for (let i = 0; i < titles.length; i++) {
    list += `<li><a href="/?id=${encodeURIComponent(titles[i])}">${titles[i]}</a></li>`;
  }
  list += '</ol>';
  return list;
}

const app = http.createServer(function(request, response) {
  const _url = request.url;
  const queryData = url.parse(_url, true).query;
  const pathname = url.parse(_url, true).pathname;

  if (pathname === '/') {
    // [READ]
    const title = queryData.id || 'Welcome';
    const list = templateList();
    let description = boardData[title] || "존재하지 않는 게시글입니다.";
    let control = `<a href="/create" class="btn btn-primary">글쓰기</a>`;

    if (queryData.id && boardData[queryData.id]) {
      control += `
        <a href="/update?id=${encodeURIComponent(queryData.id)}" class="btn btn-secondary">수정</a>
        <form action="/delete_process" method="post" style="display:inline;">
          <input type="hidden" name="id" value="${queryData.id}">
          <input type="submit" value="삭제" class="btn btn-danger">
        </form>
      `;
    }
    const html = templateHTML(title, list, `<p>${description}</p>`, control);
    response.writeHead(200);
    response.end(html);

  } else if (pathname === '/create') {
    // [CREATE 화면]
    const html = templateHTML('새 글 작성', templateList(), `
      <form action="/create_process" method="post">
        <input type="text" name="title" placeholder="제목">
        <textarea name="description" rows="10" placeholder="내용"></textarea>
        <button type="submit" class="btn btn-primary">저장</button>
      </form>
    `, '');
    response.writeHead(200);
    response.end(html);

  } else if (pathname === '/create_process') {
    // [CREATE 처리]
    let body = '';
    request.on('data', data => body += data);
    request.on('end', () => {
      const post = qs.parse(body);
      boardData[post.title] = post.description; // 변수에 저장
      response.writeHead(302, {Location: `/?id=${encodeURIComponent(post.title)}`});
      response.end();
    });

  } else if (pathname === '/update') {
    // [UPDATE 화면]
    const title = queryData.id;
    const description = boardData[title];
    const html = templateHTML(`수정: ${title}`, templateList(), `
      <form action="/update_process" method="post">
        <input type="hidden" name="id" value="${title}">
        <input type="text" name="title" value="${title}">
        <textarea name="description" rows="10">${description}</textarea>
        <button type="submit" class="btn btn-primary">수정 완료</button>
      </form>
    `, '');
    response.writeHead(200);
    response.end(html);

  } else if (pathname === '/update_process') {
    // [UPDATE 처리]
    let body = '';
    request.on('data', data => body += data);
    request.on('end', () => {
      const post = qs.parse(body);
      delete boardData[post.id]; // 기존 키 삭제
      boardData[post.title] = post.description; // 새 제목과 내용 저장
      response.writeHead(302, {Location: `/?id=${encodeURIComponent(post.title)}`});
      response.end();
    });

  } else if (pathname === '/delete_process') {
    // [DELETE 처리]
    let body = '';
    request.on('data', data => body += data);
    request.on('end', () => {
      const post = qs.parse(body);
      delete boardData[post.id]; // 변수에서 삭제
      response.writeHead(302, {Location: `/`});
      response.end();
    });

  /* ════════════════════════════════
     STUDY BOARD ROUTES
  ════════════════════════════════ */
  } else if (pathname === '/study') {
    // [STUDY READ]
    const keys = Object.keys(studyData);
    const id = queryData.id || keys[0];
    const item = studyData[id];

    if (!item) {
      // 목록이 비어있을 때 빈 상태
      const html = studyTemplateHTML(
        'Study Board',
        studyList(null),
        `<div class="empty">
          <div class="empty-icon">📚</div>
          <p>아직 학습 기록이 없습니다.</p>
          <small>오른쪽 위 "+ 새 학습 기록" 버튼으로 시작해보세요!</small>
        </div>`,
        ''
      );
      response.writeHead(200); response.end(html); return;
    }

    const color = CATEGORY_COLORS[item.category] || '#6b7280';
    const body = `
      <div class="meta-row">
        <span class="cat-chip" style="background:${color}">${item.category}</span>
        <span class="date-text">${item.date}</span>
      </div>
      <div class="content-body">${item.desc}</div>`;
    const control = `
      <div class="control-row">
        <a href="/study/update?id=${encodeURIComponent(id)}" class="btn btn-secondary">✏️ 수정</a>
        <form action="/study/delete_process" method="post" style="display:inline">
          <input type="hidden" name="id" value="${id}">
          <input type="submit" value="🗑️ 삭제" class="btn btn-danger">
        </form>
      </div>`;
    response.writeHead(200);
    response.end(studyTemplateHTML(id, studyList(id), body, control));

  } else if (pathname === '/study/category') {
    // [STUDY CATEGORY FILTER]
    const cat = queryData.cat || '';
    const filtered = Object.entries(studyData).filter(([, v]) => v.category === cat);
    const color = CATEGORY_COLORS[cat] || '#6b7280';
    const body = filtered.length === 0
      ? `<div class="empty"><div class="empty-icon">🔍</div><p>'${cat}' 카테고리에 기록이 없습니다.</p></div>`
      : `<div style="display:grid;gap:14px;margin-top:10px;">
          ${filtered.map(([k, v]) => `
            <a href="/study?id=${encodeURIComponent(k)}" style="display:block;background:#1e293b;border:1px solid rgba(255,255,255,0.07);border-radius:10px;padding:18px;color:#f8fafc;transition:border-color 0.2s;" onmouseover="this.style.borderColor='#4f46e5'" onmouseout="this.style.borderColor='rgba(255,255,255,0.07)'">
              <div style="font-weight:700;margin-bottom:6px;">${k}</div>
              <div style="font-size:12px;color:#64748b;">${v.date}</div>
            </a>`).join('')}
        </div>`;
    response.writeHead(200);
    response.end(studyTemplateHTML(
      `카테고리: ${cat}`,
      studyList(null),
      `<div class="meta-row"><span class="cat-chip" style="background:${color}">${cat}</span><span class="date-text">${filtered.length}개의 기록</span></div>${body}`,
      ''
    ));

  } else if (pathname === '/study/create') {
    // [STUDY CREATE 화면]
    const catOptions = Object.keys(CATEGORY_COLORS).map(c =>
      `<option value="${c}">${c}</option>`).join('');
    const body = `
      <div class="form-card">
        <form action="/study/create_process" method="post">
          <label class="form-label">제목</label>
          <input class="form-input" type="text" name="title" placeholder="예) JavaScript 클로저 개념 정리" required>
          <label class="form-label">카테고리</label>
          <select class="form-select" name="category">${catOptions}</select>
          <label class="form-label">학습 내용</label>
          <p class="form-hint">배운 내용, 핵심 개념, 코드 예시 등을 자유롭게 적어보세요.</p>
          <textarea class="form-textarea" name="desc" placeholder="오늘 배운 내용을 정리해보세요..."></textarea>
          <button type="submit" class="btn btn-primary">💾 저장하기</button>
        </form>
      </div>`;
    response.writeHead(200);
    response.end(studyTemplateHTML('새 학습 기록', studyList(null), body, ''));

  } else if (pathname === '/study/create_process') {
    // [STUDY CREATE 처리]
    let body = '';
    request.on('data', d => body += d);
    request.on('end', () => {
      const post = qs.parse(body);
      const title = post.title.trim();
      studyData[title] = {
        desc: post.desc,
        category: post.category || '기타',
        date: new Date().toLocaleDateString('ko-KR')
      };
      response.writeHead(302, { Location: `/study?id=${encodeURIComponent(title)}` });
      response.end();
    });

  } else if (pathname === '/study/update') {
    // [STUDY UPDATE 화면]
    const id = queryData.id;
    const item = studyData[id];
    if (!item) { response.writeHead(302, { Location: '/study' }); response.end(); return; }
    const catOptions = Object.keys(CATEGORY_COLORS).map(c =>
      `<option value="${c}" ${c === item.category ? 'selected' : ''}>${c}</option>`).join('');
    const body = `
      <div class="form-card">
        <form action="/study/update_process" method="post">
          <input type="hidden" name="id" value="${id}">
          <label class="form-label">제목</label>
          <input class="form-input" type="text" name="title" value="${id}" required>
          <label class="form-label">카테고리</label>
          <select class="form-select" name="category">${catOptions}</select>
          <label class="form-label">학습 내용</label>
          <textarea class="form-textarea" name="desc">${item.desc}</textarea>
          <button type="submit" class="btn btn-primary">✅ 수정 완료</button>
        </form>
      </div>`;
    response.writeHead(200);
    response.end(studyTemplateHTML(`수정: ${id}`, studyList(id), body, ''));

  } else if (pathname === '/study/update_process') {
    // [STUDY UPDATE 처리]
    let body = '';
    request.on('data', d => body += d);
    request.on('end', () => {
      const post = qs.parse(body);
      delete studyData[post.id];
      studyData[post.title.trim()] = {
        desc: post.desc,
        category: post.category || '기타',
        date: new Date().toLocaleDateString('ko-KR')
      };
      response.writeHead(302, { Location: `/study?id=${encodeURIComponent(post.title.trim())}` });
      response.end();
    });

  } else if (pathname === '/study/delete_process') {
    // [STUDY DELETE 처리]
    let body = '';
    request.on('data', d => body += d);
    request.on('end', () => {
      const post = qs.parse(body);
      delete studyData[post.id];
      response.writeHead(302, { Location: '/study' });
      response.end();
    });

  } else {
    response.writeHead(404);
    response.end('Not Found');
  }
});

const port = process.env.PORT || 3000; // Render에서 주는 포트 사용, 없으면 3000 사용
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});