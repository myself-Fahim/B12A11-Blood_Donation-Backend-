const { MongoClient, ServerApiVersion } = require('mongodb');
const express = require('express');
const app = express()
const cors = require('cors');
require('dotenv').config();
const port = 5000;
app.use(cors())
app.use(express.json());


const admin = require("firebase-admin");
const decoded = Buffer.from(process.env.FB_KEY, 'base64').toString('utf8')
const serviceAccount = JSON.parse(decoded);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});


const verifyFBToken = async(req,res,next) =>{
    const token = req.headers.authorization
    if(!token){
        return res.status(401).send({message : 'unauthorize access'})
    }

    try{
        const idToken = token.split(' ')[1]
        const decoded = await admin.auth().verifyIdToken(idToken)
        console.log('decoded Code',decoded)
        req.decoded_email = decoded.email
        next()
    }
    catch(error){
         return res.status(401).send({message : 'unauthorize access'})
    }
}


const uri = "mongodb+srv://Blood_Donation:xv0w08nWTu9igq64@cluster0.konzx.mongodb.net/?appName=Cluster0";
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

        const database = client.db('Blood_Donation')
        const dataCollection = database.collection('users')
        const requestCollection = database.collection('request')

        app.post('/users', async(req,res)=>{
            const newUser = req.body
            newUser.role = 'donor'
            newUser.createdAt = new Date();
            const result = await dataCollection.insertOne(newUser)
            res.send(result)
             
        })

        app.get('/users/role/:email', async (req,res)=>{
            const userMail = req.params.email
            const query = {email:userMail}
            const result = await dataCollection.findOne(query)
            res.send(result)
        })

        app.post('/request', verifyFBToken, async (req,res)=>{
            const myRequest = req.body;
            myRequest.status = 'pending'
            const result = await requestCollection.insertOne(myRequest)
            res.send(result)
        })

        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);






app.get('/', (req, res) => {
    res.send('Server running')
})

app.listen(port, () => {
    console.log(`Running from port ${port}`);
})