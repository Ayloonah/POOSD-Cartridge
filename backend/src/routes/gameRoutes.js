const express = require("express");
const router = express.Router();
const{
    searchGames,
    getGameByRawgId,
    saveGame,
    getSavedGame
} = require ("../controllers/gameController");

router.get("/search", searchGames);
router.get("/rawg/:rawgId", getGameByRawgId);
router.post("/rawg/:rawgId", saveGame);
router.get("/:gameId", getSavedGame);
module.exports = router;
