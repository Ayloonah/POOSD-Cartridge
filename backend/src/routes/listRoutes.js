const express = require("express");
const router = express.Router();
const tokenVerification = require("../middleware/tokenVerification");

const{
    createList,
    getUserLists,
    deleteList,
    updateListName
} = require("../controllers/listController");
router.use(tokenVerification);
router.post("/", createList);
router.get("/", getUserLists);
router.delete("/:listId", deleteList);
router.patch("/:listId",updateListName);
module.exports = router;