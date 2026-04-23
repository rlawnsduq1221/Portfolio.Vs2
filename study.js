const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'studies.json');

// 초기 데이터 파일 생성
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
}

// 공통 응답 헤더 설정 함수 (CORS 허용)
const setHeaders = (res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', 'application/json');
};

const server = http.createServer((req, res) => {
    setHeaders(res);

    // 브라우저의 사전 요청(OPTIONS) 처리
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    const { method, url } = req;

    // --- 라우팅 시작 ---

    // 1. GET /api/studies : 목록 조회
    if (method === 'GET' && url === '/api/studies') {
        const data = fs.readFileSync(DATA_FILE, 'utf-8');
        res.writeHead(200);
        res.end(data);
    } 

    // 2. POST /api/studies : 새 기록 추가
    else if (method === 'POST' && url === '/api/studies') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            const studies = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
            const newStudy = JSON.parse(body);
            studies.unshift(newStudy);
            fs.writeFileSync(DATA_FILE, JSON.stringify(studies, null, 2));
            res.writeHead(201);
            res.end(JSON.stringify(newStudy));
        });
    }

    // 3. PUT /api/studies/:id : 기록 수정
    else if (method === 'PUT' && url.startsWith('/api/studies/')) {
        const id = url.split('/').pop();
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            let studies = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
            const updatedItem = JSON.parse(body);
            studies = studies.map(s => s.id === id ? updatedItem : s);
            fs.writeFileSync(DATA_FILE, JSON.stringify(studies, null, 2));
            res.writeHead(200);
            res.end(JSON.stringify(updatedItem));
        });
    }

    // 4. DELETE /api/studies/:id : 기록 삭제
    else if (method === 'DELETE' && url.startsWith('/api/studies/')) {
        const id = url.split('/').pop();
        let studies = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
        studies = studies.filter(s => s.id !== id);
        fs.writeFileSync(DATA_FILE, JSON.stringify(studies, null, 2));
        res.writeHead(200);
        res.end(JSON.stringify({ success: true }));
    }

    // 경로가 없을 때
    else {
        res.writeHead(404);
        res.end(JSON.stringify({ message: "Not Found" }));
    }
});

server.listen(PORT, () => {
    console.log(`🚀 순수 Node.js 서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});