const http = require('http');

const WebSocket = require('isomorphic-ws')

const requestListener = (req, res) => {
    res.writeHead(200);
    res.end('Hello, World!');

    console.log('Opening Connection to Binance WebSocket')

    const data = {
        method: 'SUBSCRIBE',
        params: [ '!bookTicker' ],
        id: 1
    }

    const ws = new WebSocket('wss://stream.binance.com:9443/ws');

    ws.onopen = () => {
        console.log('Connected to Binance WebSocket');
        ws.send(JSON.stringify(data));
    };

    ws.onclose = () => {
        console.log('disconnected');
    };

    ws.onmessage = (msg) => {
        console.log(msg.data);
    };
}

const server = http.createServer(requestListener);
server.listen(8080);
