const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

const convertDbObjectToResponseObject1 = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const convertDbObjectToResponseObject2 = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

//api 1
app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
    SELECT
      *
    FROM
      player_details
    ORDER BY
      player_id;`;
  const PlayersArray = await db.all(getPlayersQuery);
  response.send(
    PlayersArray.map((eachPlayer) =>
      convertDbObjectToResponseObject1(eachPlayer)
    )
  );
});

//api 2
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
    SELECT
        *
    FROM
        player_details
    WHERE
        player_id = ${playerId};`;
  const playersArray = await db.get(getPlayerQuery);
  response.send(convertDbObjectToResponseObject1(playersArray));
});

//api 3
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;
  const { playerName } = playerDetails;
  const updatePlayerQuery = `
    UPDATE
      player_details
    SET
      player_name = '${playerName}'
      
    WHERE
     player_id = ${playerId};`;
  const dbResponse = await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

//api 4
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `
    SELECT
        *
    FROM
        match_details
    WHERE
        match_id = ${matchId};`;
  const MatchArray = await db.get(getMatchQuery);
  response.send(convertDbObjectToResponseObject2(MatchArray));
});
//api 5
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMatches = `
    SELECT
   *
     FROM (player_match_score
    NATURAL JOIN player_details) NATURAL JOIN  match_details
    WHERE
        player_id = ${playerId};`;
  const MatchArray2 = await db.all(getPlayerMatches);
  response.send(
    MatchArray2.map((eachPlayer) =>
      convertDbObjectToResponseObject2(eachPlayer)
    )
  );
});

//api 6
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getPlayerMatches = `
    SELECT
*
FROM (player_match_score
NATURAL JOIN match_details ) NATURAL JOIN player_details
    WHERE
        match_id = ${matchId};`;
  const MatchArray2 = await db.all(getPlayerMatches);
  response.send(
    MatchArray2.map((eachPlayer) =>
      convertDbObjectToResponseObject1(eachPlayer)
    )
  );
});

//api 7
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerScored = `
    SELECT
    player_details.player_id AS playerId,
    player_details.player_name AS playerName,
    SUM(player_match_score.score) AS totalScore,
    SUM(player_match_score.fours) AS totalFours,
    SUM(player_match_score.sixes) AS totalSixes 
    FROM 
    player_details 
    INNER JOIN player_match_score ON
    player_details.player_id = player_match_score.player_id
    WHERE player_details.player_id = ${playerId};
    `;
  const MatchArray2 = await db.get(getPlayerScored);
  response.send(MatchArray2);
});

module.exports = app;
