const http = require('http');
const { stdLog } = require('./utils/Utility');

class HealthCheckServer {
    constructor(port, client) {
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
                    if (!client.isDatabaseConnected) {
                        res.statusCode = 500;
                        res.end(JSON.stringify({ status: 'ERROR', message: 'Cannot connect to database' }));
                    } else {
                        res.end(JSON.stringify({ status: 'OK', message: 'Healthy' }));
                    }
                } else {
                    res.statusCode = 404;
                    res.end(JSON.stringify({ error: `${http.STATUS_CODES[404]}` }));
                }
            }

            res.on('error', (err) => {
                stdLog(2, {
                    extra: 'Health check API server error',
                    err: err,
                });
            });
        });
    }

    start() {
        this.server.listen(this.port, () => {
            stdLog(0, {
                extra: `Health check API server is up and listening on port ${this.port}`,
            });
        });
    }
}

module.exports = { HealthCheckServer };
