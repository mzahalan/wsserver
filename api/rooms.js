
function roomBuilder(room) {
    return {
        "vnum" : room.vnum,
        "title" : room.title,
        "description" : room.description,
        "exits" : room.exits
    }
}

// This handles the case where we hit /api/rooms
// looking for every room in the mud.
function getAllRoomsResponse(res) {
    let rooms = []
    for(const area of res.app.get('mud_areas')) {
        for(const room of area.rooms) {
            rooms.push(roomBuilder(room))
        }
    }
    return res.status(200).json(rooms)
}

// This handles the case where we hit /api/areas/:area/rooms
// and we only want the rooms for that area.
function getRoomsForAreaResponse(req, res) {
    let rooms = []
    for(const area of res.app.get('mud_areas')) {
        if(area.name == req.params.area) {
            for(const room of area.rooms) {
                rooms.push(roomBuilder(room))
            }
            return res.status(200).json(rooms)
        }
    }
    return res.status(404).send("Invalid Area")
}

// This controller is used for both getting All Rooms
// and getting All Rooms for an Area
export default (req, res) => {
    if(req.params.area) {
        return getRoomsForAreaResponse(req, res)
    } else {
        return getAllRoomsResponse(res)
    }
}