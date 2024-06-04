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

import ItemsController from './items.js'
router.get('/weapons', (req, res, next) => ItemsController(req, res, next, "weapon"))
router.get('/containers', (req, res, next) => ItemsController(req, res, next, "container"))

import MobsController from './mobs.js'
router.get('/mobs', MobsController)

export default router