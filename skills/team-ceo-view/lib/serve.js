// The one-shot local server.
const fs = require('fs');

// One page, one answer: the server lives until the first decisions block arrives.
// The random path keeps other local pages from posting to it.
function serve(page, decisionsFile, shareFile, { open }) {
  const http = require('http');
  const token = require('crypto').randomBytes(12).toString('hex');
  const server = http.createServer((req, res) => {
    if (req.method === 'GET' && req.url === `/${token}/`) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
      return res.end(page);
    }
    if (req.method === 'POST' && req.url === `/${token}/decisions`) {
      let body = '';
      req.setEncoding('utf8');
      req.on('data', chunk => { body += chunk; if (body.length > 1e6) req.destroy(); });
      req.on('end', () => {
        const share = body.startsWith('CEO SHARE');
        if (!share && !body.startsWith('CEO DECISIONS')) { res.writeHead(400); return res.end('not a decisions block'); }
        // A share hands the gate to someone else: its choices so far become the share page's --preset.
        fs.writeFileSync(share ? shareFile : decisionsFile, body + '\n');
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('ok', () => {
          console.log(share ? `share requested, choices saved to ${shareFile}\n\n${body}` : `decisions saved to ${decisionsFile}\n\n${body}`);
          server.close();
          server.closeAllConnections?.();
        });
      });
      return;
    }
    res.writeHead(404);
    res.end();
  });
  server.listen(0, '127.0.0.1', () => {
    const url = `http://127.0.0.1:${server.address().port}/${token}/`;
    console.log(`serving ${url} (waiting for Send to Claude)`);
    if (!open) return;
    const { spawn } = require('child_process');
    const [cmd, cmdArgs] = process.platform === 'darwin' ? ['open', [url]]
      : process.platform === 'win32' ? ['cmd', ['/c', 'start', '', url]]
      : ['xdg-open', [url]];
    spawn(cmd, cmdArgs, { stdio: 'ignore', detached: true })
      .on('error', () => console.log('could not open a browser: open the URL above'))
      .unref();
  });
}

module.exports = { serve };
