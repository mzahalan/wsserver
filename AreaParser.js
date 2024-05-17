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

    area.vnums = area['#AREA'][3].split(' ')
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

        room.vnum = lines[i].trim().replace("#", '')
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

        room.unparsed = []

        while('S' != lines[i].trim()) {
            room.unparsed.push(lines[i].trim())
            i++
            if(i >= lines.length) {
                console.log(`PARSING ERROR: ${area.name} :: Room: ${room.vnum} :: Missing S`)
            }
        }
        i++

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

async function parseAreas() {
    console.log("parsing area list")
    const file = readline.createInterface({
        input: fs.createReadStream(AREA_DIR.concat(AREA_LIST)),
        terminal: false
    })

    for await (const line of file){
        if(line.endsWith(AREA_EXT)) {
            if(EXCLUDE_LIST.includes(line)) {
                console.log("    SKIPPING: " + line)
                continue
            }

            process.stdout.write(`  ${line}`)
            areas.push(await parseArea(line))
            process.stdout.write(' \u001b[32m\u2713\u001b[0m\n')
        }      
    }
    return areas  
}

export { parseAreas, parseArea }