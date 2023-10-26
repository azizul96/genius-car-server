const express = require('express');
require('dotenv').config()
const cors = require('cors');
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors({
    origin: ['http://localhost:5173'],
    credentials: true
  }));
app.use(express.json());
app.use(cookieParser())



const uri = "mongodb+srv://genius-car:12345@cluster0.13lfhki.mongodb.net/?retryWrites=true&w=majority";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const serviceCollection = client.db('geniusCar').collection('services')
    const bookingCollection = client.db('geniusCar').collection('bookings')

    // auth api
    app.post('/jwt', async(req, res)=>{
      const user = req.body
      console.log(user);
      // const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1h'})
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1h'})

      res
      .cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Set to true in production
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict', // Adjust based on your requirements
        // maxAge: // how much time the cookie will exist
    })
      .send({success: true})
      
    })

    // service
    app.get('/services', async(req, res)=>{
        const result = await serviceCollection.find().toArray()
        res.send(result);
    })
    app.get('/services/:id', async(req, res)=>{
        const id = req.params.id
      const query = {_id: new ObjectId(id)}
      const options = {
        
        // Include only the `title` and `imdb` fields in the returned document
        projection: { title: 1, price: 1, service_id: 1, img: 1, }
      }
      const result = await serviceCollection.findOne(query, options)
      res.send(result)
    })

    // booking
    app.get('/bookings', async(req, res)=>{
        // console.log('token....', req.cookies.token);
        let query = {};
        if(req.query?.email){
            query = {email: req.query.email}
        }
        const result = await bookingCollection.find(query).toArray()
        res.send(result);
    })

    app.post('/bookings', async(req, res)=>{
        const booking = req.body
        const result = await bookingCollection.insertOne(booking)
        res.send(result)
    })

    app.delete('/bookings/:id', async(req, res)=>{
        const id = req.params.id
        const query = { _id: new ObjectId(id)}
        const result = await bookingCollection.deleteOne(query)
        res.send(result)
    })


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error..
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('Genius Car app is running !')
  })
  
app.listen(port, () => {
    console.log(`Genius Car app running on port ${port}`)
  })