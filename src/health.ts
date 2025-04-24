import * as http from 'http';

const server = http.createServer((req, res) => {
  res.statusCode = req.url == '/health' ? 200 : 404;
  res.end();
});

server.listen(8000);
