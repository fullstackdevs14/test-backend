const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();

const MongoClient = require("mongodb").MongoClient;
const dbUri = "mongodb+srv://test-user:test-1234@cluster0.mwmfi.mongodb.net/test?retryWrites=true";

(async () => {
  let dbClient;

  try {
    dbClient = await MongoClient.connect(dbUri, { useUnifiedTopology: true });
  } catch (error) {
    console.log(`==> Error while connecting db`, error);
  }

  const questionsCollection = dbClient.db("test").collection("questions");
  const topicsCollection = dbClient.db("test").collection("topics");

  app.use("*", bodyParser.json(), cors());

  app.use("/search", async (req, res) => {
    if (!req.query.q || !req.query.q.length) {
      return res.status(400).send({
        success: false,
        message: "Query string is required",
      });
    }

    let questions = [];
    const [originId] = (await topicsCollection.distinct("_id", { name: req.query.q })) || [];

    if (originId) {
      const relatedIds = (await topicsCollection.distinct("_id", { ancestors: originId })) || [];
      relatedIds.push(originId);

      questions = await questionsCollection.find({ topics: { $in: relatedIds } }).toArray();
    }

    res.send({
      success: true,
      questions,
    });
  });

  app.listen(process.env.PORT || 4000, () => {
    console.log("API running at port 4000");
  });
})();