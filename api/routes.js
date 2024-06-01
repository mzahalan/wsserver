import express from 'express'
const router = express.Router()

import AreasController from './areas.js'
router.get('/areas', AreasController)

import AreaController from './area.js'
router.get('/areas/:area', AreaController)

import RoomsController from './rooms.js'
router.get('/rooms', RoomsController)
router.get('/areas/:area/rooms', RoomsController)

import RoomController from './room.js'
router.get('/rooms/:room', RoomController)

export default router