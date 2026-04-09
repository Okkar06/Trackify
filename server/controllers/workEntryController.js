const { asyncHandler } = require('../utils/asyncHandler');
const {
  createWorkEntry,
  deleteWorkEntryById,
  getWorkEntryById,
  listWorkEntries,
  updateWorkEntryById,
} = require('../services/workEntryService');

const create = asyncHandler(async (req, res) => {
  const data = await createWorkEntry({ userId: req.userId, input: req.body });
  res.status(201).json(data);
});

const list = asyncHandler(async (req, res) => {
  const data = await listWorkEntries({ userId: req.userId });
  res.status(200).json(data);
});

const getById = asyncHandler(async (req, res) => {
  const data = await getWorkEntryById({ userId: req.userId, id: req.params.id });
  res.status(200).json(data);
});

const updateById = asyncHandler(async (req, res) => {
  const data = await updateWorkEntryById({ userId: req.userId, id: req.params.id, input: req.body });
  res.status(200).json(data);
});

const removeById = asyncHandler(async (req, res) => {
  const data = await deleteWorkEntryById({ userId: req.userId, id: req.params.id });
  res.status(200).json(data);
});

module.exports = {
  create,
  getById,
  list,
  removeById,
  updateById,
};

