const express = require("express");
require("dotenv").config();
const MongoClient = require("mongodb").MongoClient;
const app = express();
const passport = require("passport");
const BasicStrategy = require("passport-http").BasicStrategy;
const client = new MongoClient(process.env.MONGODB_URL, {
    useUnifiedTopology : true
});
const session = require('express-session');

passport.use(new BasicStrategy(
    function (username, password, done) {
        client.connect()
            .then(client => {
                client.db().collection("users", (err, collection) => {
                        collection.findOne({ username: username })
                            .then(user => {
                                if (user.password === password){
                                    done(null, user);
                                }else{
                                    done(null, false);
                                }
                            }).catch(() => done(null, false));
                    });
            });
        // if (username === "edwin" && password === "12345") {
        //     done(null, {id:"1", name:"edwin", test:"test1",test32:"teset"});
        // }else{
        //     done(null, false);
        // }
    }
));
passport.serializeUser(function(user, done) {
    done(null, user._id);
  });
  
  passport.deserializeUser(function(id, done) {
    client.connect()
        .then(client => {
            client.db().collection("users", (err, collection) => {
                collection.findOne({_id: id})
                    .then(user => {
                        done(err, user);
                    }).catch(() => done(null, false));
            })
        });
  });
//not work
app.get("/logout", session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true
}), (req, res) => {
    req.session.destroy(() => {
        res.clearCookie('connect.sid');
        res.redirect('/login');
    });
})
//not work
// app.get("/logout", (req, res) => {
//     req.logout();
//     res.redirect('/login');
// })

app.get("/login", (req, res) => res.send("Send credentials"));

app.post("/login", [
    session({
        secret: 'keyboard cat',
        resave: false,
        saveUninitialized: true
    }),
    passport.initialize(),
    passport.session(),
    passport.authenticate('basic', { 
        successRedirect: '/',
        failureRedirect: '/login' 
    })
], )

app.get("/", [
    session({
        secret: 'keyboard cat',
        resave: false,
        saveUninitialized: true
    }),
    passport.initialize(),
    passport.session(),
    passport.authenticate('basic'),
    (req, res, next) => {
        console.log(req.session);
        next();
    }
], (req, res) => res.send("Hello world"));

app.get("/collections", (req,res) => {
    
    client.connect()
        .then(client => {
            client.db()
                .collections()
                .then(collections => res.json(collections.map(c => c.collectionName)))
                .finally(() => client.close());
        })
        .catch(handleConnectionErr);
});

app.get("/collections/:collectionName", 
    passport.authenticate('basic', { session: false }),
    (req, res) => {
    const client = new MongoClient(process.env.MONGODB_URL, {
        useUnifiedTopology : true
    });
    
    client.connect()
        .then(client => {
            const { collectionName } = req.params;

            client.db().collection(collectionName, (err, c) => {
                
                c.find({}).toArray().then(docs => res.json(docs))
                .finally(() => client.close());

            });
        }).catch(handleConnectionErr);
    
});

app.use(express.json());
app.post("/collections/:collectionName", 
    passport.authenticate('basic', { session: false }),
    (req, res) => {
        const client = new MongoClient(process.env.MONGODB_URL, {
            useUnifiedTopology : true
        });
        
        client.connect()
            .then(client => {
                const { collectionName } = req.params;

                client.db().collection(collectionName, (err, c) => {
                        
                        c.insertOne(req.body)
                                .then(r => res.json(r.insertedCount))
                                .finally(() => client.close());
                        
                    });
            });
    });

app.delete("/collections/:collectionName/:studentName", (req, res) => {
    const client = new MongoClient(process.env.MONGODB_URL, {
        useUnifiedTopology : true
    });
    
    client.connect()
        .then(client => {
            const { collectionName, studentName } = req.params;

            client.db().collection(collectionName, (err, collection) => {
                    collection
                        .findOneAndDelete({ name: studentName }, (err, result) => {
                            res.json(result.value);
                            client.close();
                        })
                })
        });
});

app.put('/collections/:collectionName/:studentName', (req, res) => {
    const client = new MongoClient(process.env.MONGODB_URL, {
        useUnifiedTopology: true
    });

    client.connect()
        .then(client => {
            const { collectionName, studentName } = req.params;
            const updateDocument = {
                $set: { ...req.body }
            };

            client.db().collection(collectionName, (err, collection) => {
                    collection
                        .findOneAndUpdate({ name: studentName }, updateDocument, (err, result) => {
                            res.json(result.value)
                            client.close();
                        })
                })
        })
})

const handleConnectionErr = err => console.log(err);

app.listen(process.env.PORT || 3000, () => console.log(`Listening at http://localhost:${process.env.PORT}`));