
export default (req, res) => {
    return res.status(200).json(req.app.get('mud_areas').filter(area => area.name == req.params.area)[0])
}