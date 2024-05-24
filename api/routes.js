import express from 'express'
const router = express.Router()

router.get('/areas', (req, res)=>{
    return res.status(200).json({
        status: true,
        data: "some data",
    })
})

export default router