const Game = require ("../models/games");
const fullGameFields = "_id rawgId name coverImage genres platforms releaseDate developers description cachedAt";
const {
    searchRawgGames,
    getRawgGame
} = require("../services/rawgService");
const formatGame = (rawgGame) => {
    return {
        rawgId: rawgGame.id,
        name: rawgGame.name,
        coverImage: rawgGame.background_image || null,
        genres:
            rawgGame.genres?.map((genre) => genre.name) || [],
        platforms:
            rawgGame.platforms?.map(
                (item) => item.platform.name
            ) || [],
        releaseDate: rawgGame.released || null,
    };
};

const searchGames = async (req, res) => {
    try{
        const query = req.query.search;
        if (!query || query.trim() === "")
        {
            return res.status(400).json({
                error: "A search term is required"
            });
        }
        const page = Number(req.query.page) || 1;
        const pageSize = Number(req.query.pageSize) || 20;
        const data = await (searchRawgGames)(
            query.trim(),
            page,
            pageSize
        );
        const games = data.results.map((rawgGame)=>{
            return formatGame(rawgGame);
        });
        res.status(200).json({
            count: data.count,
            next: data.next,
            previous: data.previous,
            results: games
        });
    } catch(error){
        res.status(500).json({
            error: error.message
        });
    }
};

const getGameByRawgId = async (req, res) => {
    try{
        const rawgId = Number(req.params.rawgId)
        if(!Number.isInteger(rawgId)||rawgId<=0){
            return res.status(400).json({
                error: "Invalid RAWG game ID"
            });
        }
        const rawgGame = await getRawgGame(rawgId);
        const game = formatGame(rawgGame);
        res.status(200).json(game);
    }catch(error){
        res.status(500).json({
            error: error.message
        });
    }
};
const saveGame = async (req, res) => {
    try {
        const rawgId = Number(req.params.rawgId);
        if(!Number.isInteger(rawgId)||rawgId<=0){
            return res.status(400).json({
                error: "Invalid RAWG game ID"
            });
        }
        const rawgGame = await getRawgGame(rawgId);
        const gameData = formatGame(rawgGame);
        const game = await Game.findOneAndUpdate(
            {
                rawgId: gameData.rawgId
            },
            {
                $set: gameData
            },
            {
                new: true,
                upsert: true,
                runValidators: true
            }
        ).select(fullGameFields);
        res.status(200).json({
            message: "Game saved successfully",
            game
        });
    } catch(error){
        res.status(500).json({
            error: error.message
        });
    }
};
const getSavedGame = async (req, res) => {
    try{
        const game = await Game.findById(req.params.gameId).select(fullGameFields);
        if(!game)
        {
            return res.status(400).json({
                error: "Game not Found"
            });
        }
        res.status(200).json(game);
    }catch(error){
        res.status(500).json({
            error: error.message
        });
    }
};
module.exports = {
    searchGames,
    getGameByRawgId,
    saveGame,
    getSavedGame
};