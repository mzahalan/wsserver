export default (req, res) => {
    for(const area of res.app.get('mud_areas')) {
        for(const room of area.rooms) {
            if(room.vnum == req.params.room) {
                return res.status(200).json(room)
            }
        }
    }
    return res.status(404).send("Invalid Room VNUM")
}