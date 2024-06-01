
export default (req, res) => {
    for(const area of req.app.get('mud_areas')) {
        if(area.name == req.params.area) {
            return res.status(200).json(area)
        }
    }
    return res.status(404).send("Invalid Area Name")
}