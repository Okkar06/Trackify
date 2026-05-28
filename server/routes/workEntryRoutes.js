const express = require('express');

const { create, getById, list, removeById, updateById } = require('../controllers/workEntryController');
const { requireUser } = require('../middleware/requireUser');

const router = express.Router();

router.use(requireUser);

router.post('/', create);
router.get('/', list);
router.get('/:id', getById);
router.put('/:id', updateById);
router.delete('/:id', removeById);

module.exports = router;
