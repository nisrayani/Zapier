import express from "express"

const app = express()

//https://hooks.zapier.com/hooks/catch/28795500/4hv65rz/

app.post("/hooks/catch/:userId/:hookId/", (req, res) => {
  var userId = req.params.userId
  var hookId = req.params.hookId
  console.log(`Received webhook for userId: ${userId}, hookId: ${hookId}`)
  
  // store new trigger to db
  // push that to queue kafka/redis
})