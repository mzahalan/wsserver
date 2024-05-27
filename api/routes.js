import express from 'express'
const router = express.Router()

import AreaController from './areas.js'
router.get('/areas', AreaController)

export default router