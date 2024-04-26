import { Telnet } from 'telnet-client'
import readline from 'node:readline'

const r1 = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

const connection = new Telnet()
const params = {
    host: '127.0.0.1',
    port: 4000,
    disableLogin: true,
    shellPrompt: null,
    timeout: 10500,
}


connection.on('connect', data => {
    console.log('connected')
})

connection.on('data', data => {
    console.log(data)
    r1.question(data.toString(), outBuf => {
        if(outBuf.trim() != 'q') {
            connection.send(outBuf)
        }
    })
})
connection.on('timeout', () => {
    console.log('socket timeout')
})

connection.on('close', () => {
    console.log('socket closed')
})

connection.connect(params)



