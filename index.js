require("dotenv").config();
const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.5f9uk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
console.log(uri);


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
        // await client.connect();
        const marathonCollection = client.db('mileScape').collection('marathons')
        const upcomingMarathonCollection = client.db('mileScape').collection('upcomingMarathons')
        const marathonRegistrationCollection = client.db('mileScape').collection('marathonRegistrations')


        //  MARATHON RELATED APIs
        // 1.POST (for all marathons)
        app.post('/marathons', async (req, res) => {
            const newMarathon = req.body;
            const result = await marathonCollection.insertOne(newMarathon);
            res.send(result);
        })

        // 2.GET (for all marathons)
        app.get('/allMarathons', async (req, res) => {
            const cursor = marathonCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        })
        // 3.GET (for running marathons-6)
        app.get('/marathons', async (req, res) => {
            const cursor = marathonCollection.find().limit(6);
            const result = await cursor.toArray();
            res.send(result);
        })
        // 4.GET (for upcoming marathons)
        app.get('/upcomingMarathons', async (req, res) => {
            const cursor = upcomingMarathonCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        })
        // 5.GET (for id wise details)
        app.get('/marathons/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await marathonCollection.findOne(query);
            res.send(result);
        })


// -----------------------------------MARATHON REGISTRATION RELATED APIs--------------------------------

        // 1. post all registrations
        app.post('/marathon-registrations', async (req, res) => {
            const registrationData = req.body;
            // 1.save data in my apply list
            const result = await marathonRegistrationCollection.insertOne(registrationData);
            // 2.increase totalRegistrations in marathons
            const filter = { _id: new ObjectId(registrationData.marathonId) }
            const update = {
                $inc: { totalRegistrations: 1 }
            }
            const updateTotalRegistrations = await marathonCollection.updateOne(filter, update)
            console.log(updateTotalRegistrations);
            res.send(result);
        })
        // 2.GET all registrations
        app.get('/marathon-registrations', async (req, res) => {
            const cursor = marathonRegistrationCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        })

        // 3.get specific user's registrations
        app.get('/marathon-registrations', async (req, res) => {
            const email = req.query.email;
            const query = { email: email }
            const result = await marathonRegistrationCollection.find(query).toArray();
            res.send(result);
        })
        // 4.Get specific user's single registration by id
        app.get('/marathon-registrations/:id', async (req, res) => {
            const id = req.params.id; 
            const query = { _id: new ObjectId(id) }; 
            const result = await marathonRegistrationCollection.findOne(query); 
            res.send(result); 

        });
        // 5.PUT
        app.put('/marathon-registrations/:id', async (req, res) => {
            const id = req.params.id;
            const updatedRegistration = req.body;
            console.log(updatedRegistration);
            const filter = { _id: new ObjectId(id) }
            const options = { upsert: true };
            const marathon = {
                $set: {
                    email: updatedRegistration.email,
                    firstName: updatedRegistration.firstName,
                    lastName: updatedRegistration.lastName,
                    phone: updatedRegistration.phone,
                    additionalInfo: updatedRegistration.additionalInfo,
                }
            }

            const result = await marathonRegistrationCollection.updateOne(filter, marathon, options);
            res.send(result);
        })






        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('MileScape server is running')
})

app.listen(port, () => {
    console.log(`MileScape server is running on port: ${port}`);
})