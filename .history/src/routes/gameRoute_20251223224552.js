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
    if(!hostName) { 

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
