const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express');
const cors = require('cors');
const jwt = require("jsonwebtoken")
const app = express()
const port = process.env.PORT || 5000;

require('dotenv').config()
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.xk97zuc.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run(){
    try{
        const serviceCollection = client.db('pixelClickDB').collection('services');
        const reviewCollection = client.db('pixelClickDB').collection('reviews')

        function verifyJWT(req, res, next) {
            const authHeader = req.headers.authorization;
            if(!authHeader){
              return res.status(401).send({message:'unauthorized access'})
            }
            const token = authHeader.split(' ')[1];
            jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function(err, decoded){
              if(err){
                return res.status(403).send({message:'user forbidden from access'})
              }
              req.decoded = decoded;
              next();
            })
          }

        app.post('/jwt',(req, res)=>{
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET,{expiresIn: '10h'});
            res.send({token});
          })

        app.post('/services', async(req, res) =>{
          const newService = req.body;
          const result = await serviceCollection.insertOne(newService)
          res.send(result);
        })
        
        app.get('/services', async(req, res) => {
            const query = {}
            const cursor = serviceCollection.find(query);
            const services = await cursor.toArray();
            res.send(services)
        })

        app.get('/services/:id', async(req, res) => {
            const id = req.params.id;
            const query = {_id: ObjectId(id)}
            const service = await serviceCollection.findOne(query);
            res.send(service)
        })

        // reviews api

        app.get('/reviews', async(req, res) => {
            let query ={};
            if(req.query.serviceId) {
                query ={
                    serviceId : req.query.serviceId  
                }
            }
            const cursor = reviewCollection.find(query);
            const review = await cursor.toArray();
            res.send(review)
        })
        app.post('/reviews', async(req, res) => {
            const review = req.body;
            const result = await reviewCollection.insertOne(review);
            res.send(result) 
        })

        app.get('/reviews/:id', async (req, res) => {
          const id = req.params.id;
          const query = { _id: ObjectId(id)};
          const reviews = await reviewCollection.findOne(query);
          res.send(reviews)
        })
        
        app.delete('/reviews/:id', async (req, res) =>{
          const id = req.params.id;
          const query = { _id: ObjectId(id)};
          const deleteReview = await reviewCollection.deleteOne(query);
          res.send(deleteReview)
        })

        app.get("/myReviews", verifyJWT, async(req,res)=>{
            const decoded = req.decoded;
            if(decoded.email !== req.query.email){
              return res.status(401).send({message:'unauthorized access'})
            }
            let query = {};
            if(req.query.email){
              query = {
                email:req.query.email
              }
            }
            const cursor = await reviewCollection.find(query); 
            const userReviews = await cursor.toArray();
            res.send(userReviews);
          })
    }
    finally{

    }
}
run().catch(err => console.log(err))

app.get('/', (req, res) => {
    res.send("Pixel Click Photographer Server")
})

app.listen(port, () => {
    console.log("Pixel Click Photographer Server Running on Port", port);
})
