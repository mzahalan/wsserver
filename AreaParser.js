import fs from 'fs'
import readline from 'readline'


const AREA_DIR = "../rom24-quickmud/area/"
const AREA_EXT = ".are"
const AREA_LIST = "area.lst"

const EXCLUDE_LIST = ["social.are", "rom.are", "group.are", "help.are"]

const HEADERS = ["#AREA", "#MOBILES", "#OBJECTS", "#ROOMS", "#RESETS", "#SHOPS", "#SPECIALS", '#HELPS', '#SOCIALS']

function parseAreaBlock(area) {
    // AREA Section
    area.filename = area['#AREA'][0].replace('~', '')
    area.name = area['#AREA'][1].replace('~', '')

    // This is the hard part...
    // syntax: { ALL|x-y|x y } <creator> <description>
    let line = area['#AREA'][2]
    let afterRange = line.split(/\} */g)[1]
    area.range = line.replace(afterRange, '').replace('-', ' ').replace('{ ', '{').replace(' }', '}').trim()
    area.creator = afterRange.split(' ')[0]
    area.description = afterRange.replace(area.creator, '').replace('~', '').trim()

    let vNums = area['#AREA'][3].split(' ')
    area.vnumMin = parseInt(vNums[0])
    area.vnumMax = parseInt(vNums[1])
    if(area['#AREA'].length > 4) {
        console.log(`PARSING ERROR: ${area.filename} - too many lines in AREA section`)
    }
}

// db.c load_rooms()
function parseRoomsBlock(area) {
    // the first line is #<vnum>
    // the last line is S
    area.rooms = []
    if(!area['#ROOMS'] || area['#ROOMS'].length == 0) {
        return
    }

    let lines = area['#ROOMS']
    let i = 0
    while(i != lines.length) {
        let line = lines[i].trim()

        // END OF #ROOMS
        if('#0' == line) {
            return
        }

        // Skip Empty Lines
        if('' == line) {
            i++
            continue
        }

        // Room Start
        let room = {}
        
        // Scan to Start of Room (#XXXX)
        if(! /^#\d+$/.test(line)) {
            console.log(`PARSING ERROR: ${area.name} :: Expected Room #VNUM but found :: ${line}`)
            return
        }

        room.vnum = parseInt(lines[i].trim().replace("#", ''))
        i++

        room.title = lines[i].replace('~','').trim()
        i++

        // It might be more efficient to get (startIndex, endIndex) then do a subarray().join('\n)
        room.description = ''
        while('~' != lines[i].trim()) {
            room.description = room.description.concat(lines[i].trim(), '\n')
            i++
        }
        i++

        // Flags: <area_number> <flags> <sector type>
        // sector types: merc.h ~1322
        let flags = lines[i].split(' ')
        if(flags.length != 3) {
            console.log(`PARSING ERROR: ${area.name} :: Room: ${room.vnum} :: bad flags`)
            return
        }
        room.sector_type = flags[2].trim()
        room.flags = flags[1]
        i++

        let unparsed = []
        room.extra = []
        room.exits = []
        room.healRate = 100
        room.manaRate = 100

        while('S' != lines[i].trim()) {
            if('E' == lines[i].trim()) {
                i++
                let extra = {}
                extra.keywords = lines[i].replace('~', '')
                extra.description = ''
                i++
                while('~' != lines[i].trim()) {
                    extra.description = extra.description + lines[i]
                    if(lines[i].trim().endsWith('~')) {
                        break
                    }
                    i++
                }
                i++
                room.extra.push(extra)
            } else if (/^D[0-5]$/.test(lines[i].trim())) {
                let exit = {}
                exit.direction = lines[i]
                i++

                exit.description = ''
                while('~' != lines[i].trim()) {
                    exit.description = exit.description + lines[i]
                    if(lines[i].trim().endsWith('~')) {
                        break
                    }
                    i++
                }
                i++

                exit.keyword = ''
                while('~' != lines[i].trim()) {
                    exit.keyword = exit.keyword + lines[i]
                    if(lines[i].trim().endsWith('~')) {
                        break
                    }
                    i++
                }
                i++
                let roomInfo = lines[i].trim().split(/\s+/)
                exit.locks = roomInfo[0]
                exit.keys = roomInfo[1]
                exit.destination = parseInt(roomInfo[2])
                room.exits.push(exit)
                i++
            } else if (lines[i].startsWith('H')) {
                let l = lines[i].trim().split(/\s+/)
                room.healRate = parseInt(l[1])
                if(l.length == 4 && l[2] == 'M') {
                    room.manaRate = parseInt(l[3])
                }
                i++
            } else if (lines[i].startsWith('O')) {
                // This is to set the owner of a room... I'm just ignoring it for now.
                i++
            } 
            else {
                unparsed.push(lines[i].trim())
                i++
                if(i >= lines.length) {
                    console.log(`PARSING ERROR: ${area.name} :: Room: ${room.vnum} :: Missing S`)
                }
            }
        }
        i++
        if(unparsed.length > 0) {
            console.log("ERROR Parsing Room, Unhandled content: " + unparsed)
        }
        area.rooms.push(room)
    }
}

function parseMobsBlock(area) {

}

function parseObjectsBlock(area) {

}

function parseShopsBlock(area) {

}

function parseResetsBlock(area) {

}

function parseSpecialsBlock(area) {

}

function parseHelps(area) {

}

function parseSocials(area) {

}

function areaToObject(area) {
    parseAreaBlock(area)
    parseRoomsBlock(area)
    parseMobsBlock(area)
    parseObjectsBlock(area)
    parseShopsBlock(area)
    parseResetsBlock(area)
    parseSpecialsBlock(area)
    parseHelps(area)
    parseSocials(area)

    // After we parse the raw text into the object
    // we can delete it.
    delete area['#AREA']
    delete area['#MOBILES']
    delete area['#OBJECTS']
    delete area['#ROOMS']
    delete area['#RESETS']
    delete area['#SHOPS']
    delete area['#SPECIALS']
}

async function parseArea(areaFile) {
    const file = readline.createInterface({
        input: fs.createReadStream(AREA_DIR.concat(areaFile)),
        output: process.stdout,
        terminal: false
    })

    let key = null
    let area = {}

    for await (const newLine of file) {
        try {
            let line = newLine.trim()
            
            // Skip empty lines:
            if(line == "") { 
                continue
            }

            // Look for a Header to start a new content block
            if(HEADERS.includes(line)) {
                key = line
                area[key] = []
                continue
            }

            // Check Text outside content block.
            if(!key) {
                console.log('Invalid text outside content block ' + areaFile)
                continue
            }

            // Add to the content block.
            if(! area[key]) {
                console.log("Invalid State in " + areaFile)
                console.log("Missing Key: " + key)
                continue
            }

            area[key].push(line)
        } catch(e) {
            console.log("Error Parsing file: " + areaFile)
            console.log(e)
        }
    }

    areaToObject(area)
    return area
}

let areas = []
function findAreaFromRoom(areas, vnum) {
    for(const area of areas) {
        if(area.vnumMin <= vnum && area.vnumMax >= vnum)
            return area.name
    }
}
async function parseAreas() {
    console.log("parsing area list")
    const file = readline.createInterface({
        input: fs.createReadStream(AREA_DIR.concat(AREA_LIST)),
        terminal: false
    })

    for await (const line of file){
        if(line.endsWith(AREA_EXT)) {
            process.stdout.write(`  ${line}`)
            if(EXCLUDE_LIST.includes(line)) {
                process.stdout.write(' \u001b[33mSkipped\u001b[0m\n')
                continue
            }

            areas.push(await parseArea(line))
            process.stdout.write(' \u001b[32m\u2713\u001b[0m\n')
        }      
    }

    // Build Connections
    for(const area of areas) {
        area.connections = []
        for(const room of area.rooms) {
            for(const exit of room.exits) {
                if(exit.destination != -1 && exit.destination < area.vnumMin || exit.destination > area.vnumMax) {
                    let destArea = findAreaFromRoom(areas, exit.destination)
                    if(!area.connections.includes(destArea)) {
                        area.connections.push(destArea)
                    }
                    //console.log(`Found a Connection: ${area.name}::${room.vnum} connects to: ${destArea}::${exit.destination}`)
                }
            }
        }
    }
    return areas  
}

export { parseAreas, parseArea }