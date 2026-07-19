const express = require("express");
const router = express.Router();
const{
    createList,
    getUserLists,
    deleteList
} = require("../controllers/listController");

router.post("/", createList);
router.get("/user/:userId", getUserLists);
router.delete("/user/:userId/:listId", deleteList);
module.exports = router;
