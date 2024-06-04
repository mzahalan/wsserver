import fs from 'fs'
import readline from 'readline'

const AREA_DIR = "../rom24-quickmud/area/"
const AREA_EXT = ".are"
const AREA_LIST = "area.lst"

const EXCLUDE_LIST = ["social.are", "rom.are", "group.are", "help.are"]
const DIRECTION_MAP = {"D0":"N", "D1":"E", "D2":"S", "D3":"W", "D4":"U", "D5":"D"}
const HEADERS = ["#AREA", "#MOBILES", "#OBJECTS", "#ROOMS", "#RESETS", "#SHOPS", "#SPECIALS", '#HELPS', '#SOCIALS']

// This is the best class ever created in javascript by anybody.
class Iterator {
    constructor(lines) {
        this.lines = lines
        this.pos = 0
    }
    isAtVnum() {
        return /^#\d+$/.test(this.peek())
    }
    hasNext() {
        return this.lines.length > this.pos
    }
    peek() {
        return this.lines[this.pos].trim()
    }
    next() {
        return this.lines[this.pos++].trim()
    }
    nextVnum() {
        return parseInt(this.next().replace('#', ''))
    }
    splitNext() {
        return this.next().split(/\s+/)
    }
    readString() {
        let myString = ''
        let newLine = ''
        while(this.hasNext() && ((newLine = this.next()) != '~' )) {
            myString = myString + ' ' + newLine
            if(myString.endsWith('~')) {
                myString = myString.slice(0,-1)
                break
            }
        }
        return myString.trim()
    }
    readWord() {
        let lineArray = this.lines[this.pos].trim().split("")
        let buffer = []

        let endChar = lineArray.shift()
        let char = ''

        if(endChar != '"' && endChar != "'"){
            char = endChar
            endChar = ' '
        } else {
            char = lineArray.shift()
        }

        while(char != endChar) {
            buffer.push(char)
            if(lineArray.length == 0) {
                break
            }
            char = lineArray.shift()
        }

        this.lines[this.pos] = lineArray.join("")
        return buffer.join("")
    }
    readFlags() {
        let lineArray = this.lines[this.pos].trim().split("")
        let buffer = []
        let char = lineArray.shift()
        while(char != ' ') {
            buffer.push(char)
            if(lineArray.length == 0) {
                break
            }
            char = lineArray.shift()
        }
        this.lines[this.pos] = lineArray.join("")
        return buffer.join("") 
    }
    readNumber() {
        return parseInt(this.readFlags())
    }
}

function parseAreaBlock(block) {
    if(!block || block.length == 0) {
        return {}
    }
    let area = {}
    let it = new Iterator(block)

    area.filename = it.readString()
    area.name = it.readString()

    // This is the hard part...
    // syntax: { ALL|x-y|x y } <creator> <description>
    let line = it.next()
    let afterRange = line.split(/\} */g)[1]
    area.range = line.replace(afterRange, '').replace('-', ' ').replace('{{','{').replace('{ ', '{').replace(' }', '}').trim()
    area.creator = afterRange.split(' ')[0]
    area.description = afterRange.replace(area.creator, '').replace('~', '').trim()

    let vNums = it.splitNext()
    area.vnumMin = parseInt(vNums[0])
    area.vnumMax = parseInt(vNums[1])

    return area
}

// db.c load_rooms()
function parseRoomsBlock(block) {
    if(!block || block.length == 0) {
        return []
    }

    let rooms = []
    let it = new Iterator(block)

    while(it.hasNext() && '#0' != it.peek()) {

        // Skip Empty Lines
        if('' == it.peek()) {
            it.next()
            continue
        }

        // Room Start
        let room = {}
        
        // Scan to Start of Room (#XXXX)
        if(!it.isAtVnum()) {
            console.log(`PARSING ERROR: ${area.name} :: Expected Room #VNUM but found :: ${line}`)
            return
        }

        room.vnum = parseInt(it.next().replace("#", ''))
        room.title = it.readString()
        room.description = it.readString()

        // Flags: <area_number> <flags> <sector type>
        // sector types: merc.h ~1322
        let flags = it.splitNext()
        if(flags.length != 3) {
            console.log(`PARSING ERROR: ${area.name} :: Room: ${room.vnum} :: bad flags`)
            return rooms
        }
        room.sector_type = flags[2].trim()
        room.flags = flags[1]

        let unparsed = []
        room.extra = []
        room.exits = []
        room.healRate = 100
        room.manaRate = 100

        while('S' != it.peek()) {
            if('E' == it.peek()) {
                it.next()
                let extra = {}
                //extra.keywords = it.next().replace('~', '')
                extra.keywords = it.readString()
                extra.description = it.readString()
                room.extra.push(extra)

            } else if (/^D[0-5]$/.test(it.peek())) {
                let exit = {}
                exit.direction = DIRECTION_MAP[it.next()]
                exit.description = it.readString()
                exit.keyword = it.readString()

                let roomInfo = it.splitNext()
                exit.locks = roomInfo[0]
                exit.keys = roomInfo[1]
                exit.destination = parseInt(roomInfo[2])
                room.exits.push(exit)

            } else if (it.peek().startsWith('H')) {
                let l = it.splitNext()
                room.healRate = parseInt(l[1])
                if(l.length == 4 && l[2] == 'M') {
                    room.manaRate = parseInt(l[3])
                }
            } else if (it.peek().startsWith('O')) {
                // This is to set the owner of a room... I'm just ignoring it for now.
                it.next()
            } 
            else {
                unparsed.push(it.next())
                if(!it.hasNext()) {
                    console.log(`PARSING ERROR: ${area.name} :: Room: ${room.vnum} :: Missing S`)
                }
            }
        }
        it.next()
        if(unparsed.length > 0) {
            console.log("ERROR Parsing Room, Unhandled content: " + unparsed)
        }
        rooms.push(room)
    }
    return rooms
}

function parseMobsBlock(block) {
    if(!block || block.length == 0) {
        return []
    }

    let mobs = []
    let it = new Iterator(block)

    while(it.hasNext() && '#0' != it.peek()) {
        if('' == it.peek()) {
            it.next()
            continue
        }

        // First Line of a Mob.
        let mob = {}
        mob.vnum = parseInt(it.next().replace('#', ''))
        mob.keywords = it.readString().replace('oldstyle ', '')
        mob.shortDescription = it.readString()
        mob.longDescription = it.readString()
        mob.description = it.readString()
        mob.race = it.readString()

        // act affect alignment group
        let parts = it.splitNext()
        mob.act = parts[0]
        mob.affect = parts[1]
        mob.alignment = parseInt(parts[2])
        mob.group = parseInt(parts[3])

        //Level Hitroll HitDice ManaDice DamageDice DamageType
        parts = it.splitNext()
        mob.level = parseInt(parts[0])
        mob.hitRoll = parseInt(parts[1])
        mob.hitDice = parts[2]
        mob.manaDice = parts[3]
        mob.damDice = parts[4]
        mob.damType = parts[5]

        //Armor Classes: Pierce, Bash, Slash, Exotic
        parts = it.splitNext().map(p => parseInt(p))
        mob.armorClass = {
            "pierce" : parts[0],
            "bash"   : parts[1],
            "slash"  : parts[2],
            "exotic" : parts[3]
        }

        //Flags: OFF, IMM, RES, VULN
        parts = it.splitNext()
        mob.offFlags = parts[0]
        mob.immFlags = parts[1]
        mob.resFlags = parts[2]
        mob.vulnFlags = parts[3]

        //Start Position | Default Position | Gender | Wealth
        parts = it.splitNext()
        mob.startPosition = parts[0]
        mob.defaultPostion = parts[1]
        mob.gender = parts[2]
        mob.wealth = parseInt(parts[3])

        //Form | Parts | Size | Material
        parts = it.splitNext()
        mob.size = parts[2]

        mob.unparsed = []
        while(!it.isAtVnum()) {

            // Skip the flags for body parts.
            if(it.peek().startsWith("F par")) {
                it.next()
                continue
            }

            //console.log(`Unparsed data for mob: ${mob.keywords} :: ${it.peek()}`)
            mob.unparsed.push(it.next())
        }

        mobs.push(mob)
    }
    return mobs
}

function parseObjectsBlock(block) {
    if(!block || block.length == 0) {
        return []
    }

    let objects = []
    let it = new Iterator(block)

    while(it.hasNext() && '#0' != it.peek()) {
        if('' == it.peek()) {
            it.next()
            continue
        }

        if(!it.isAtVnum()) {
            console.log('ERROR - Object Data outside VNUM')
        }

        let mudObject = {}
        objects.push(mudObject)
        mudObject.vum = it.nextVnum()
        mudObject.unparsed = []

        mudObject.name = it.readString()
        mudObject.shortDescription = it.readString()
        mudObject.description = it.readString() 
        mudObject.material = it.readString()

        //Type | Flags | Wear Flags
        let parts = it.splitNext()
        mudObject.type = parts[0]
        mudObject.flags = parts[1]
        mudObject.wearFlags = parts[2]

        // The next bits depend on the Object Type
        if(mudObject.type == 'weapon') {
            mudObject.weaponType = it.readWord()
            mudObject.hitRoll = it.readNumber()
            mudObject.damRoll = it.readNumber()
            mudObject.attackType = it.readWord()
            mudObject.weaponFlags = it.readFlags()
            it.next()
        } else if (['potion', 'pill', 'scroll'].includes(mudObject.type)) {
            mudObject.affLevel = it.readNumber()
            mudObject.aff0 = it.readWord()
            mudObject.aff1 = it.readWord()
            mudObject.aff2 = it.readWord()
            mudObject.aff3 = it.readWord()
            it.next()
        } else if (mudObject.type == 'container') {
            //50 0 0 5 100
            mudObject.maxWeight = it.readNumber()
            mudObject.state = it.readFlags()
            mudObject.val2 = it.readNumber()
            mudObject.maxItemWeight = it.readNumber()
            mudObject.weightMultiplier = it.readNumber()
            it.next()
        } else if(mudObject.type == 'drink' || mudObject.type == 'fountain') {
            //300 300 'beer' 0 0 
            mudObject.capacity = it.readNumber()
            mudObject.capacityNote = "If you set the capacity to 0, it won't decrement the amount remaining (ie: it's bottomless)"
            mudObject.amountRemaining = it.readNumber()
            mudObject.liquid = it.readWord()
            mudObject.isPoison = it.readNumber()
            mudObject.val4 = it.readNumber()
            it.next()  
        } else {
            // TODO: WANDS db2.c ~454
            mudObject.hardString = it.next()
        }


        //Level | Weight | Cost | Condition
        parts = it.splitNext()
        mudObject.level = parseInt(parts[0])
        mudObject.weight = parseInt(parts[1])
        mudObject.cost = parseInt(parts[2])
        mudObject.condition = parts[3]

        // The Unparsed Stuff (The As, Fs, and Es)
        mudObject.affects = []
        mudObject.extras = []
        while(it.hasNext() && !it.isAtVnum()) {
            if('E' == it.peek()) {
                it.next()
                mudObject.extras.push({
                    "keyword" : it.readString(),
                    "description": it.readString()
                })
            } else if('A' == it.peek()) {
                it.next()
                parts = it.splitNext()
                mudObject.affects.push({
                    'location' : parts[0],
                    'modifier' : parts[1]
                })
            } else {
                mudObject.unparsed.push(it.next())
            }
            
        }
    }
    return objects
}

function parseShopsBlock(block) {
    if(!block || block.length == 0) {
        return []
    }

    let shops = []
    let it = new Iterator(block)

    while(it.hasNext() && '0' != it.peek()) {
        if('' == it.peek()) {
            it.next()
            continue
        }

        let parts = it.splitNext().slice(0,10).map(p => parseInt(p))
        shops.push({
            "keeper"     : parts[0],
            "buyType"    : [parts[1], parts[2], parts[3], parts[4], parts[5]],
            "profitBuy"  : parts[6],
            "profitSell" : parts[7],
            "hourOpen"   : parts[8],
            "hourClosed" : parts[9]
        })
    }
    return shops
}

function parseResetsBlock(block) {
    if(!block || block.length == 0) {
        return []
    }
    
    let resets = []
    let it = new Iterator(block)
    while(it.hasNext() && 'S' != it.peek() ) {
        if('' == it.peek()) {
            continue
        }

        let reset = {}
        resets.push(reset)
        reset.command = it.readFlags()
        it.readNumber()

/*
 *   'M': read a mobile 
 *   'O': read an object
 *   'P': put object in object
 *   'G': give object to mobile
 *   'E': equip object to mobile
 *   'D': set state of door
 *   'R': randomize room exits
 */
        if(reset.command == 'M') {
            reset.MobVnum   = it.readNumber()
            reset.maxCount  = it.readNumber()
            reset.RoomVnum  = it.readNumber()
            reset.roomCount = it.readNumber()
        } else if(reset.command == 'O') {
            reset.ObjVnum   = it.readNumber()
            reset.arg2      = it.readNumber()
            reset.RoomVnum  = it.readNumber()
        } else {
            reset.arg1 = it.readNumber()
            reset.arg2 = it.readNumber()
            
            if(reset.command == 'G' || reset.command == 'R') {
                reset.arg3 = 0
            } else {
                reset.arg3 = it.readNumber()
            }
            if(reset.command == 'P' || reset.command == 'M') {
                reset.arg4 = it.readNumber()
            } else {
                reset.arg4 = 0
            }
        }
        reset.note = it.next()
    }
    return resets
}

function parseSpecialsBlock(block) {
    if(!block || block.length == 0) {
        return []
    }

    let specials = []
    let it = new Iterator(block)
    while(it.hasNext() && 'S' != it.peek()) {
        if('' == it.peek()) {
            continue
        }

        let parts = it.splitNext()

        // The Mud Only Supports Mob Specials
        if(! 'M' == parts[0]) {
            console.log(`Found a Non Mob Special ${parts}`)
            continue
        }

        specials.push({
            "mob" : parseInt(parts[1]),
            "ability" : parts[2]
        })
    }

    return specials
}

function areaToObject(fileBlocks) {
    const area = parseAreaBlock(fileBlocks['#AREA'])
    area.rooms = parseRoomsBlock(fileBlocks['#ROOMS'])
    area.mobs = parseMobsBlock(fileBlocks['#MOBILES'])
    area.objects = parseObjectsBlock(fileBlocks['#OBJECTS'])
    area.shops = parseShopsBlock(fileBlocks['#SHOPS'])
    area.resets = parseResetsBlock(fileBlocks['#RESETS'])
    area.specials = parseSpecialsBlock(fileBlocks['#SPECIALS'])
    
    //Ignoring HELPS and SOCIALS
    return area
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
            if(!area[key]) {
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
    return areaToObject(area)
}

function findAreaFromRoom(areas, vnum) {
    for(const area of areas) {
        if(area.vnumMin <= vnum && area.vnumMax >= vnum)
            return area.name
    }
}
async function parseAreas() {
    let areas = []
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
                }
            }
        }
    }
    return areas  
}

export { parseAreas, parseArea }