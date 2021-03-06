const express = require("express");
require("dotenv").config();
const MongoClient = require("mongodb").MongoClient;
const app = express();
const client = new MongoClient(process.env.MONGODB_URL, {
    useUnifiedTopology : true
});

app.get("/", (req, res) => res.send("Hello world"));

app.get("/collections", (req,res) => {
    client.connect()
        .then(client => {
            client.db("school")
                .collections()
                .then(collections => res.json(collections.map(c => c.collectionName)));
        })
        .catch(handleConnectionErr);
    
});

app.get("/collections/:collectionName", (req, res) => {
    client
        .connect()
        .then(client => {
            const { collectionName } = req.params;

            client.db("school").collection(collectionName, (err, c) => {
                
                c.find({}).toArray().then(docs => res.json(docs));

            });
        }).catch(handleConnectionErr);
    
});

app.use(express.json());
app.post("/collections/:collectionName", (req, res) => {
    
    client.connect()
        .then(client => {
            const { collectionName } = req.params;

            client.db("school")
                .collection(collectionName, (err, c) => {
                    
                    c.insertOne(req.body)
                            .then(r => res.json(r.insertedCount));    
                    
                });
        });

});

const handleConnectionErr = err => console.log(err);

app.listen(process.env.PORT, () => console.log(`Listening at http://localhost:${process.env.PORT}`));