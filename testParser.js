import { parseAreas, parseArea } from './AreaParser.js'

let areas = await parseAreas()
console.log(`Finished parsing. I found ${areas.length} areas`)



// Print Out the Area Section
// Useful for debugging.
function printAreaSection(area) {
    console.log(`${area.name}, ${area.filename}, MinVnum: ${area.vnums[0]}, MaxVnum: ${area.vnums[1]}, Creator: ${area.creator}, Range: ${area.range}, Description: ${area.description}`)
}

function printRoomSection(area) {
    console.log(`${area.filename} :: Num Rooms: ${area.rooms.length}`)
    area.rooms.forEach((room) => {
        console.log(`${room.vnum} :: ${room.title}`)
        console.log(room.description)
        console.log('Unparsed: ' + room.unparsed)
        console.log('Flags: ' + room.flags)
        console.log('Extras: ' + JSON.stringify(room.extra))
        console.log('Exits: ' + JSON.stringify(room.exits))
        console.log(`heal: ${room.healRate}, mana: ${room.manaRate}`)
    })
}

function printAllAreaBlocks(areas) {
    areas.forEach(printAreaSection)
}

function printAllRoomBlocks(areas) {
    areas.forEach(printRoomSection)
}


let trollden = await parseArea('school.are')
//printRoomSection(trollden)


