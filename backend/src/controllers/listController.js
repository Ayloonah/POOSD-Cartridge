const List = require("../models/list");
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

module.exports = {
    createList,
    getUserLists,
    deleteList
};