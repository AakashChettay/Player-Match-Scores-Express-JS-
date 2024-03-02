const express = require('express')
const app = express()
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')

app.use(express.json())

const dbPath = path.join(__dirname, 'cricketMatchDetails.db')
let db = null

const initializeDatabaseAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log(
        'Server started at https://chettayaakashqhyvpnjscpdiitb.drops.nxtwave.tech',
      )
    })
  } catch (e) {
    console.log(`Database Error: ${e.message}`)
    process.exit(1)
  }
}

initializeDatabaseAndServer()

//1. Get Players API
app.get('/players/', async (req, res) => {
  try {
    const getPlayersDetailsQuery = `
    SELECT player_id AS playerId, player_name AS playerName
    FROM player_details;
  `
    const dbResponse = await db.all(getPlayersDetailsQuery)
    res.json(dbResponse)
  } catch (err) {
    console.log(err.message)
    res.send({error: 'Internal Server Error'})
  }
})

//2. Get player details by Id API
app.get('/players/:playerId/', async (req, res) => {
  const {playerId} = req.params
  try {
    const getPlayerDetailsByIdQuery = `
      SELECT player_id AS playerId, player_name AS playerName
      FROM player_details 
      WHERE player_id = ?;
    `
    const dbResponse = await db.get(getPlayerDetailsByIdQuery, [playerId])
    res.json(dbResponse)
  } catch (err) {
    console.log(err.message)
    res.status(500).json({error: 'Internal Server Error'})
  }
})

//3. Update Player Name API
app.put('/players/:playerId/', async (req, res) => {
  const {playerId} = req.params
  const playerData = req.body
  const {playerName} = playerData
  try {
    const updatePlayerNameByIdQuery = `
    UPDATE player_details
    SET player_name = ?
    WHERE player_id = ?;
  `
    await db.run(updatePlayerNameByIdQuery, [playerName, playerId])
    res.send('Player Details Updated')
  } catch (err) {
    console.log(err.message)
    res.send('error: Internal Server Error')
  }
})

//4. Get match details by id API
app.get('/matches/:matchId/', async (req, res) => {
  const {matchId} = req.params
  try {
    const getMatchDetailsByIdQuery = `
    SELECT match_id AS matchId, match, year
    FROM match_details
    WHERE match_id = ?;
  `
    const dbResponse = await db.get(getMatchDetailsByIdQuery, [matchId])
    res.json(dbResponse)
  } catch (err) {
    console.log(err.message)
    res.json({error: 'Internal Server Error'})
  }
})

//5. Get matchs by player Id API
app.get('/players/:playerId/matches', async (req, res) => {
  const {playerId} = req.params
  try {
    const getMatchesByPlayerIdQuery = `
    SELECT match_id AS matchId, match, year
    FROM player_match_score
      NATURAL JOIN match_details
    WHERE player_id = ?;
  `
    const dbResponse = await db.all(getMatchesByPlayerIdQuery, [playerId])
    res.send(dbResponse)
  } catch (err) {
    console.log(err.message)
    res.json({error: 'Internal Server Error'})
  }
})

//6. Get player details by Id API
app.get('/matches/:matchId/players', async (req, res) => {
  const {matchId} = req.params
  try {
    const getPlayersByMatchIdQuery = `
    SELECT player_details.player_id AS playerId, player_details.player_name AS playerName
    FROM player_match_score
      NATURAL JOIN player_details
    WHERE match_id = ?;
  `
    const dbResponse = await db.all(getPlayersByMatchIdQuery, [matchId])
    res.send(dbResponse)
  } catch (err) {
    console.log(err.message)
    res.json({error: 'Internal Server Error'})
  }
})

//7. Get Player Score details API
app.get('/players/:playerId/playerScores', async (req, res) => {
  const {playerId} = req.params
  try {
    const getPlayerMatchScoresQuery = `
    SELECT
    player_details.player_id AS playerId,
    player_details.player_name AS playerName,
    SUM(player_match_score.score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes FROM 
    player_details INNER JOIN player_match_score ON
    player_details.player_id = player_match_score.player_id
    WHERE player_details.player_id = ?;
    `
    const dbResponse = await db.get(getPlayerMatchScoresQuery, [playerId])
    res.json(dbResponse)
  } catch (err) {
    console.log(err.message)
    res.json({error: 'Internal Server Error'})
  }
})
module.exports = app
