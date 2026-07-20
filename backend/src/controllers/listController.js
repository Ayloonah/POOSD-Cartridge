const mongoose = require("mongoose");
const listFields = "_id name isPublic coverImage createdAt updatedAt";
const List = require("../models/list");
const GameUserEntry = require("../models/gameUserEntry");
const createList = async (req, res) => {
    try {
        const userId = req.user.userId;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                error: "Invalid user ID"
            });
        }

        const { name, isPublic, coverImage } = req.body;

        if (typeof name !== "string" || name.trim() === "") {
            return res.status(400).json({
                error: "A valid list name is required"
            });
        }

        const list = await List.create({
            userId,
            name: name.trim(),
            isPublic,
            coverImage
        });

          res.status(201).json({
            _id: list._id,
            name: list.name,
            isPublic: list.isPublic,
            coverImage: list.coverImage,
            createdAt: list.createdAt,
            updatedAt: list.updatedAt
        });
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
};

const getUserLists = async (req, res) => {
    try {
        const userId = req.user.userId;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                error: "Invalid user ID"
            });
        }

        const lists = await List.find({
            userId
        }).select(listFields).sort({
            updatedAt: -1
        });

        res.status(200).json(lists);
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
};

const deleteList = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { listId } = req.params;

        if (
            !mongoose.Types.ObjectId.isValid(userId) ||
            !mongoose.Types.ObjectId.isValid(listId)
        ) {
            return res.status(400).json({
                error: "Invalid user or list ID"
            });
        }

        const deletedList = await List.findOneAndDelete({
            _id: listId,
            userId
        });

        if (!deletedList) {
            return res.status(404).json({
                error: "List not found"
            });
        }
         await GameUserEntry.updateMany(
            {
                userId,
                listIds: listId
            },
            {
                $pull: {
                    listIds: listId
                }
            }
        );

        res.status(200).json({
            message: "List deleted successfully"
        });
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
};

const updateListName = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { listId } = req.params;
        const { name } = req.body;

        if (
            !mongoose.Types.ObjectId.isValid(userId) ||
            !mongoose.Types.ObjectId.isValid(listId)
        ) {
            return res.status(400).json({
                error: "Invalid user or list ID"
            });
        }

        if (typeof name !== "string" || name.trim() === "") {
            return res.status(400).json({
                error: "A valid list name is required"
            });
        }

        const updatedList = await List.findOneAndUpdate(
            {
                _id: listId,
                userId
            },
            {
                $set: {
                    name: name.trim()
                }
            },
            {
                new: true,
                runValidators: true
            }
        ).select("listFields");

        if (!updatedList) {
            return res.status(404).json({
                error: "List not found"
            });
        }

        res.status(200).json({
            message: "List name updated successfully",
            list: updatedList
        });
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
};

module.exports = {
    createList,
    getUserLists,
    deleteList,
    updateListName
};