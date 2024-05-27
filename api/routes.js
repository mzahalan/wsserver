import express from 'express'
const router = express.Router()

router.get('/areas', (req, res)=>{
    return res.status(200).json(req.app.get('mud_areas'))
})

export default router