import express from 'express'
import {WebSocketServer} from 'ws'
import http from 'http'
import { Telnet } from 'telnet-client'
import Convert from 'ansi-to-html'
import stripAnsi from 'strip-ansi'
const CONVERTER = new Convert({newline:true});

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({server});
const PORT = 9081
const STRIP_CHARS=[0x0A]

const PARAMS = {
    host: '127.0.0.1',
    port: 4000,
    disableLogin: true,
    shellPrompt: null,
    timeout: 10500,
    stripControls: true
}

wss.on('connection', (ws) => {
    console.log('Client Connected - setting up mud connect');
    
    // Helper function to wrap outgoing strings
    const sendToClient = (msg) => {
        let data = {
            type: "command",
            text: stripAnsi(msg.replace(/&nbsp;/g, " ").replace(/\r/g, "\n")),
            html: CONVERTER.toHtml(msg.replace(/</g, "&lt;").replace(/>/g, "&gt;"))
        }
        ws.send(JSON.stringify(data))
    }

    const sendControlToClient = (msg) => {
        let data = {
            type: "control",
            text: msg,
            numClients: wss.clients.size
        }
        ws.send(JSON.stringify(data))
    }

    let mudCon = new Telnet()
    
    mudCon.on('connect', data => {
        sendToClient('Connected')
    })

    mudCon.on('data', data => {
        let sendMsg = ""

        for(const b of data.values()) {
            if(b > 6 && b < 128 && !STRIP_CHARS.includes(b)){
                if(b == 0x09) {
                    sendMsg += '\t'
                } else if (b == 0x20) { 
                    sendMsg += '&nbsp;'
                } else {
                    sendMsg += String.fromCharCode(b)
                }
            }
        }

        sendToClient(sendMsg)
    })

    mudCon.on('timeout', () => {
        // just wait longer
    })

    mudCon.on('close', () => {
        sendToClient('Connect Closed')
        ws.close()
    })

    mudCon.connect(PARAMS)

    ws.on('message', (message) => {
        if(message != '') {
            try{
                let data = JSON.parse(message)
                if(data.type == 'command') {
                    mudCon.send(data.message)
                } else if( data.type == 'control') {
                    if(data.message == 'ping') {
                        sendControlToClient('pong')
                    }
                } else {
                    console.log("Bad Message From Client: " + JSON.stringify(data))
                }
            } catch(e) { console.log("Bad Message From Client: " + message) }
        }
    });

    ws.on('close', () => {
        mudCon.end()
    });
});

server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`)
})
