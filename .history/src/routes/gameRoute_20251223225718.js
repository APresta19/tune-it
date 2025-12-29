import express from "express";
import { UNSAFE_createClientRoutesWithHMRRevalidationOptOut } from "react-router-dom";
const router = express.Router();
/*
POST /game/create
POST /game/:id/join
POST /game/:id/add-song
POST /game/:id/start
GET  /game/:id/state

createSpotifyPlaylist()
*/

router.post("/create", async (req, res) => {
    const { hostName } = req.body;
    const token = req.access_token;

    if(!hostName) { 
        return res.status(401).send("No hostname provided.")
    }
    if(!token) {
        return res.status(401).send("No token provided.")
    }

    try 
    {
        const id = 5;
        const response = {gameId: id}
        //const res = await 
    } catch (err)
    {
        console.error(err);
        res.status(500).send("Internal server error");
    }

});

router.post("/:gameId/join", async (req, res) => {

});

router.post("/:gameId/add-song", async (req, res) => {

});

router.post("/:gameId/start", async (req, res) => {

});

router.get("/:gameId/state", async (req, res) => {

});

export default router;
