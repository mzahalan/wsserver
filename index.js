import cors from 'cors'
import http from 'http'
import express from 'express'
import mudsocket from './mudsocket.js'

// TODO - CORS is currently setup in a wide-open
//        mode. Production should probably limit origins.
const app = express();
app.use(cors());

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
