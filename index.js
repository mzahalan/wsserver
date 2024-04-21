const express = require('express')
const WebSocket = require('ws')
const http = require('http')
const { Telnet } = require('telnet-client') 

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({server});
const PORT = 9081

const PARAMS = {
    host: '127.0.0.1',
    port: 4000,
    disableLogin: true,
    shellPrompt: null,
    timeout: 10500
}

wss.on('connection', (ws) => {
    console.log('Client Connected - setting up mud connect');

    let mudCon = new Telnet()
    
    mudCon.on('connect', data => {
        ws.send('connected')
    })

    mudCon.on('data', data => {
        ws.send(data.toString().trim())
    })

    mudCon.on('timeout', () => {
        // just wait longer
    })

    mudCon.on('close', () => {
        ws.send('connection closed')
        ws.close()
    })

    mudCon.connect(PARAMS)

    ws.on('message', (message) => {
        mudCon.send(message)
    });

    ws.on('close', () => {
        mudCon.close()
    });
});

server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`)
})