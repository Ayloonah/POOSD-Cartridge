const mongoose = require("mongoose");
const List = require("../models/list");
const Game = require("../models/games");
const createList = async (req, res) => {
    try{
        const list = await List.create(req.body);
        res.status(201).json(list);
    } catch(error){
        res.status(500).json({
            error: error.message
        });
    }
};
const getUserLists = async (req, res) => {
    try {
        const lists = await List.find({
            userId: req.params.userId
        }).sort({
            updatedAt: -1
        });

        res.status(200).json(lists);
    } catch(error){
        res.status(500).json({
            error: error.message
        });
    }
};
const deleteList = async (req, res) => {
    try{
        const deletedList = await List.findOneAndDelete({
            _id: req.params.listId,
            userId: req.params.userId
    });
        if(!deletedList){
            return res.status(404).json({
                error: "List not found"
            });
        }
        res.status(200).json({
            message: "List deleted successfully"
        });
    } catch (error){
        res.status(500).json({
            error: error.message
        });
    }
};
const addGameToList = async (req, res) => {
    try{
        const {userId, listId, gameId } = req.params;
        if(
            !mongoose.Types.ObjectId.isValid(userId) ||
            !mongoose.Types.ObjectId.isValid(listId) ||
            !mongoose.Types.ObjectId.isValid(gameId)
        ){
            return res.status(400).json({
                error: "Invalid user, list, or game ID"
            });
        }
        const gameExists = await Game.exists({
            _id: gameId
        });
        if(!gameExists){
            return res.status(404).json({
                error: "Game not found"
            });
        }
        const updatedList = await List.findOneAndUpdate(
            {
                _id: listId,
                userId: userId
            },
            {
                $addToSet: {
                    games: gameId
                }
            },
            {
                returnDocument: "after",
                runValidators: true
            }
        );
        if (!updatedList){
            return res.status(404).json({
                error: "List not found for this user"
            });
        }
        res.status(200).json({
            message: "Game added to list successfully",
            list: updatedList
        });

    } catch(error){
        res.status(500).json({
            error: error.message
        });
    }
};
const deleteGameFromList = async (req, res) => {
    try{
        const {userId, listId, gameId } = req.params;
        if(
            !mongoose.Types.ObjectId.isValid(userId) ||
            !mongoose.Types.ObjectId.isValid(listId) ||
            !mongoose.Types.ObjectId.isValid(gameId)
        ){
            return res.status(400).json({
                error: "Invalid user, list, or game ID"
            });
        }
        const updatedList = await List.findOneAndUpdate(
            {
                _id: listId,
                userId: userId,
                games: gameId
            },
            {
                $pull: {
                    games:gameId
                }
            },
            {
                returnDocument: "after",
                runValidators: true
            }
        );
        if (!updatedList){
            return res.status(404).json({
                error: "List or game not found"
            });
        }
        res.status(200).json({
            message: "Game removed from list successfully",
            list: updatedList
        });

    } catch(error){
        res.status(500).json({
            error: error.message
        });
    }
};
const updateListName = async (req, res) => {
    try{
        const {userId, listId } = req.params;
        const { name } = req.body;
        if(
            !mongoose.Types.ObjectId.isValid(userId) ||
            !mongoose.Types.ObjectId.isValid(listId)
        ){
            return res.status(400).json({
                error: "Invalid user or list Id"
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
                userId: userId
            },
            {
                $set: {
                    name: name.trim()
                }
            },
            {
                returnDocument: "after",
                runValidators: true
            }
        );
        if (!updatedList){
            return res.status(404).json({
                error: "List not found for this user"
            });
        }
        res.status(200).json({
            message: "List name updated successfully",
            list: updatedList
        });

    } catch(error){
        res.status(500).json({
            error: error.message
        });
    }
};
module.exports = {
    createList,
    getUserLists,
    deleteList,
    addGameToList,
    deleteGameFromList,
    updateListName
};
