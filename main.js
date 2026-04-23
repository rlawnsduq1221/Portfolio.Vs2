const http = require('http');
const url = require('url');
const qs = require('querystring');

// [핵심] 파일 대신 데이터를 저장할 객체 변수
// 생활코딩의 파일 입출력 로직을 메모리 기반으로 대체합니다.
let boardData = {

  'Welcome': '안녕하세요! 파일 없이 메모리에서 바로 작동하는 게시판입니다.',
  'Nodejs': 'Node.js는 자바스크립트 런타임입니다.'
};

function templateHTML(title, list, body, control) {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <title>Junyeop's Board - ${title}</title>
    <meta charset="utf-8">

  
  <style>
          
* { box-sizing: border-box; margin: 0; padding: 0; text-decoration: none;}

body { 
  font-family: 'Pretendard', sans-serif; 
  background: #0f172a; 
  color: #f8fafc; 
  line-height: 1.6;
}

.container { 
  max-width: 800px; 
  margin: 50px auto; 
  padding: 20px; 
}

/* 2. 반응형 헤더 영역 */
header { 
  border-bottom: 1px solid #1e293b; 
  padding: 20px 30px; 
  margin-bottom: 30px; 
}

/* h1과 h3를 나란히 배치하는 컨테이너 */
header > div {
  display: flex;
  justify-content: space-around;
  flex-direction: row;
  align-items: baseline; /* 글자 아래 기준선을 맞춤 */
  gap: 15px;             /* 요소 간 간격 */
  flex-wrap: wrap;       /* 화면이 좁으면 줄바꿈 */
}

h1 { margin: 0; }
h1 a { 
  color: #4f46e5; 
  text-decoration: none; 
  font-size: 28px; 
  font-weight: bold;
}

/* 'Return' 문구 스타일링 */
h3 {
  margin: 0; 
  font-size: 14px; 
  color: #94a3b8; 
  font-weight: normal;
}

/* 3. 목록 및 콘텐츠 박스 */
ol { 
  padding: 0; 
  list-style: none; 
  display: flex; 
  gap: 10px; 
  margin-bottom: 20px; 
  overflow-x: auto; /* 목록이 길어지면 가로 스크롤 */
}

ol li a { 
  background: #1e293b; 
  color: #cbd5e1; 
  padding: 6px 12px; 
  border-radius: 6px; 
  text-decoration: none; 
  font-size: 14px; 
  border: 1px solid #334155; 
  white-space: nowrap;
}

ol li a:hover { border-color: #4f46e5; }

.content-box { 
  background: #1e293b; 
  padding: 30px; 
  border-radius: 12px; 
  border: 1px solid #334155; 
}

h2 { color: #818cf8; margin-top: 0; }

p { line-height: 1.8; color: #94a3b8; white-space: pre-wrap; }

/* 4. 버튼 및 폼 요소 */
.control { margin-bottom: 20px; display: flex; gap: 10px; }

.btn { 
  padding: 8px 15px; 
  border-radius: 5px; 
  text-decoration: none; 
  font-size: 13px; 
  font-weight: bold; 
  cursor: pointer; 
  border: none; 
}

.btn-primary { 
  background: #4f46e5; 
  color: white; 
  height: 32px; 
  display: flex; 
  align-items: center; 
  justify-content: center;
}

.btn-secondary { background: #475569; color: white; }
.btn-danger { background: #ef4444; color: white; }

input, textarea { 
  width: 100%; 
  padding: 12px; 
  margin-bottom: 15px; 
  border-radius: 6px; 
  border: 1px solid #334155; 
  background: #0f172a; 
  color: white; 
  box-sizing: border-box; 
}

/* 5. 모바일 반응형 미디어 쿼리 */
@media (max-width: 600px) {
  header > div {
    flex-direction: column; /* 세로로 배치 */
    align-items: flex-start;
    gap: 5px;
  }
  
  h1 a { font-size: 22px; }
  
  .container { margin: 20px auto; }
  
  .btn { width: 100%; } /* 모바일에서 버튼을 가로로 꽉 채움 */
}
    </style>
  </head>
  <body>
    <div class="container">
      <header>
        <div><h1><a href="/">JunYeop's Board</a></h1>
            <a href="https://portfolio-vs2-lime.vercel.app"><h3>Return to original page</h3></a>
        </div>
    </header> 

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

  } else {
    response.writeHead(404);
    response.end('Not Found');
  }
});

const port = process.env.PORT || 3000; // Render에서 주는 포트 사용, 없으면 3000 사용
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});