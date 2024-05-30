import express from 'express'
const router = express.Router()

import AreasController from './areas.js'
router.get('/areas', AreasController)

import AreaController from './area.js'
router.get('/areas/:area', AreaController)

export default router