import http from 'http'
import express from 'express'
import mudsocket from './mudsocket.js'

const app = express();
const server = http.createServer(app);

// Attach API handling
import routes from './api/routes.js'
app.use("/api", routes)

// Attach Websocket handling
mudsocket(server)

// Parse the Area files
import { parseAreas } from './AreaParser.js';
app.set('mud_areas', await parseAreas())

// GO GO GO
const PORT = 9081
server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`)
})
