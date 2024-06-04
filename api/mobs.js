function getMobs(mudDB) {
    let mobs = []
    for(const area of mudDB) {
        mobs.push(...area.mobs)
    }
    return mobs
}

export default (req, res, next) => {
    return res.json(getMobs(res.app.get('mud_areas')))
}