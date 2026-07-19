const mongoose = require("mongoose");
const List = require("../models/list");
const Game = require("../models/games");
const GameUserEntry = require("../models/gameUserEntries");
const validIds = (...ids) => {
    return ids.every((id)=>
    mongoose.Types.ObjectId.isValid(id)
    );
};

const addGameToUserList = async (req, res) =>{
    try{
        const userId = req.user.userId;
        const {listId, gameId} = req.params;
        if (!validIds(userId, listId, gameId)){
            return res.status(400).json({
                error: "Invalid user, list, or game ID"
            });
        }
        const listExists = await List.exists({
            _id: listId,
            userId
        });
        if(!listExists) {
            return res.status(404).json({
                error: "List not found for this user"
            });
        }
        const gameExists = await Game.exists({
            _id: gameId
        });
        if (!gameExists) {
            return res.status(404).json({
                error: "Game not found"
            });
        }
        const entry = await GameUserEntry.findOneAndUpdate(
            {
                userId,
                gameId
            },
            {
                $setOnInsert: {
                    userId,
                    gameId
                },
                $addToSet: {
                    listIds: listId
                }
            },
            {
                new: true,
                upsert: true,
                runValidators: true
            }
        ).populate({
    path: "gameId",
    select: "name coverImage genres releaseDate developers"
});
        res.status(200).json({
            message: "Game added to list successfully",
            entry
        });
    } catch (error){
        res.status(500).json({
            error: error.message
        });
    }
};
const removeGameFromUserList = async (req, res) =>{
    try{
        const userId = req.user.userId;
        const {listId, gameId} = req.params;
        if (!validIds(userId, listId, gameId)){
            return res.status(400).json({
                error: "Invalid user, list, or game ID"
            });
        }
        const listExists = await List.exists({
            _id: listId,
            userId
        });
        if(!listExists) {
            return res.status(404).json({
                error: "List not found for this user"
            });
        }
          const entry = await GameUserEntry.findOneAndUpdate(
            {
                userId,
                gameId,
                listIds: listId
            },
            {
                $pull: {
                    listIds: listId
                }
            },
            {
                new: true,
                runValidators: true
            }
        ).populate({
    path: "gameId",
    select: "name coverImage genres releaseDate developers"
});
          if (!entry) {
            return res.status(404).json({
                error: "Game was not found in this list"
            });
        }

        res.status(200).json({
            message: "Game removed from list successfully",
            entry
        });
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
};
const getUserCollection = async (req, res) => {
    try {
        // The user ID comes from tokenVerification
        const userId = req.user.userId;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                error: "Invalid user ID"
            });
        }

        const entries = await GameUserEntry.find({
            userId
        }).populate({
            path: "gameId",
            select: "name coverImage genres releaseDate developers"
        });

        res.status(200).json(entries);
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
};
const getGameEntry = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { entryId } = req.params;

        if (!validIds(userId, entryId)) {
            return res.status(400).json({
                error: "Invalid user or entry ID"
            });
        }

        const entry = await GameUserEntry.findOne({
            _id: entryId,
            userId
        }).populate({
            path: "gameId",
            select: "name coverImage genres releaseDate developers"
        });

        if (!entry) {
            return res.status(404).json({
                error: "Game entry not found"
            });
        }

        res.status(200).json(entry);
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
};
const updateGameEntry = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { entryId } = req.params;

        if (!validIds(userId, entryId)) {
            return res.status(400).json({
                error: "Invalid user or entry ID"
            });
        }

        const allowedFields = [
            "played",
            "hoursPlayed",
            "rating",
            "review",
            "platformPlayed"
        ];

        const updates = {};

        for (const field of allowedFields) {
            if (
                Object.prototype.hasOwnProperty.call(
                    req.body,
                    field
                )
            ) {
                updates[field] = req.body[field];
            }
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                error: "No valid fields were provided"
            });
        }

        const entry = await GameUserEntry.findOneAndUpdate(
            {
                _id: entryId,
                userId
            },
            {
                $set: updates
            },
            {
                returnDocument: "after",
                runValidators: true
            }
        ).populate({
            path: "gameId",
            select: "name coverImage genres releaseDate developers"
        });

        if (!entry) {
            return res.status(404).json({
                error: "Game entry not found"
            });
        }

        res.status(200).json({
            message: "Game entry updated successfully",
            entry
        });
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
};
module.exports = {
    addGameToUserList,
    removeGameFromUserList,
    getUserCollection,
    getGameEntry,
    updateGameEntry
};