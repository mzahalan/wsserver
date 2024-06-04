
const supported_types = ['weapon', 'container']

function getItemsByType(mudDB, type) {
    let items = []
    for(const area of mudDB) {
        for(const obj of area.objects) {
            if(obj.type == type) {
                items.push(obj)
            }
        }
    }
    return items
}

export default (req, res, next, type) => {
    if(!type || !supported_types.includes(type)) {
        return res.status(404).send('Invalid Type Specified')
    }

    return res.json(getItemsByType(res.app.get('mud_areas'), type))
}