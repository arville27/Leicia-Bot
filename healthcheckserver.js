const http = require('http');

class HealthCheckServer {
    constructor(port) {
        this.port = port || 3030;
        this.server = http.createServer((req, res) => {
            res.setHeader('Content-Type', 'application/json');
            if (req.method !== 'GET') {
                res.statusCode = 405;
                res.end(
                    JSON.stringify({
                        error: `${http.STATUS_CODES[405]}`,
                    })
                );
            } else {
                res.statusCode = 200;
                if (req.url === '/health') {
                    res.end(JSON.stringify({ status: 'OK' }));
                } else {
                    res.statusCode = 405;
                    res.end(JSON.stringify({ error: `${http.STATUS_CODES[404]}` }));
                }
            }

            res.on('error', (err) => {
                console.error('Health check API server error');
                console.error(err);
            });
        });
    }

    start() {
        this.server.listen(this.port, () => {
            console.log(`Health check API server is up and listening on port ${this.port}`);
        });
    }
}

module.exports = { HealthCheckServer };
