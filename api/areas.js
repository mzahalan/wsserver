
export default (req, res) => {
    return res.status(200).json(req.app.get('mud_areas').map(area => {
        return {
            "name": area.name,
            "file": area.filename,
            "range": area.range,
            "creator": area.creator,
            "description": area.description,
            "vnumMin": parseInt(area.vnumMin),
            "vnumMax": parseInt(area.vnumMax),
            "numRooms": area.rooms.length,
            "connections": area.connections
        }
    }))
}