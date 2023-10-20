const {Router} = require("express");
const controller= require("./controller")

const router = Router();

router.get('/',controller.getEvents)
router.post('/',controller.addEvent);
router.get('/:id',controller.getEventById);
router.delete('/:id',controller.removeEvent);
router.put('/:id',controller.updateEvent);


module.exports = router;