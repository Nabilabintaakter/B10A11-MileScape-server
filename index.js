require("dotenv").config();
const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
const port = process.env.PORT || 5000;
const corsOptions = {
    origin: [
    'http://localhost:5173',
    'https://coffee-store-5b114.web.app',
    'https://coffee-store-5b114.firebaseapp.com',
    ],
    credentials: true,
    optionalSuccessStatus: 200,
}

// middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser())

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

// verifyToken
const verifyToken = (req, res, next) => {
    const token = req.cookies?.token
    if (!token) return res.status(401).send({ message: 'unauthorized access' })
    jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: 'unauthorized access' })
        }
        req.user = decoded
    })
    next()
}

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();
        const marathonCollection = client.db('mileScape').collection('marathons')
        const upcomingMarathonCollection = client.db('mileScape').collection('upcomingMarathons')
        const marathonRegistrationCollection = client.db('mileScape').collection('marathonRegistrations')

        // generate jwt
        app.post('/jwt', async (req, res) => {
            const email = req.body
            // create token
            const token = jwt.sign(email, process.env.SECRET_KEY, {
                expiresIn: '365d',
            })
            console.log(token)
            res
                .cookie('token', token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
                })
                .send({ success: true })
        })

        // logout || clear cookie from browser
        app.get('/logout', async (req, res) => {
            res
                .clearCookie('token', {
                    maxAge: 0,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
                })
                .send({ success: true })
        })


        // ----------------------------------- MARATHON RELATED APIs---------------------------------------


        // 1.POST (for all marathons)
        app.post('/marathons', async (req, res) => {
            const newMarathon = req.body;
            const result = await marathonCollection.insertOne(newMarathon);
            res.send(result);
        })
        // 2.GET (for all marathons)
        app.get('/allMarathons', async (req, res) => {
            const sort = req.query.sort;
            let options = {};
            if (sort) {
                options = { createdAt: sort === 'asc' ? 1 : -1 };
            }
            try {
                const cursor = marathonCollection.find().sort(options);
                const result = await cursor.toArray();
                res.send(result);
            } catch (err) {
                res.status(500).send('Error fetching marathons');
            }
        });

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
        app.get('/marathons/:id',verifyToken, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await marathonCollection.findOne(query);
            res.send(result);
        })
        // 6.GET (for email based marathons)
        app.get('/myMarathons', verifyToken, async (req, res) => {
            const { email } = req.query;
            const decodedEmail = req.user?.email;
            if (decodedEmail !== email)
                return res.status(403).send({ message: 'forbidden access!' })
            const query = { organizer_email: email };
            const cursor = marathonCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        });
        // 5.PUT
        app.put('/myMarathons/:id', verifyToken, async (req, res) => {
            const id = req.params.id;
            const updatedMarathon = req.body;
            console.log(updatedMarathon);
            const filter = { _id: new ObjectId(id) }
            const options = { upsert: true };
            const marathon = {
                $set: {
                    title: updatedMarathon.title,
                    startRegDate: updatedMarathon.startRegDate,
                    endRegDate: updatedMarathon.endRegDate,
                    marathonStartDate: updatedMarathon.marathonStartDate,
                    location: updatedMarathon.location,
                    distance: updatedMarathon.distance,
                    description: updatedMarathon.description,
                    image: updatedMarathon.image,
                }
            }
            const result = await marathonCollection.updateOne(filter, marathon, options);
            res.send(result);
        })
        // DELETE
        app.delete('/myMarathons/:id',verifyToken, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await marathonCollection.deleteOne(query);
            res.send(result);
        })



        // ---------------------MARATHON REGISTRATION RELATED APIs--------------------------------

        // 1. post all registrations
        app.post('/marathon-registrations', async (req, res) => {
            const registrationData = req.body;
            // 0. if a user placed a registration already in the marathon
            const query = { email: registrationData.email, marathonId: registrationData.marathonId }
            const alreadyExist = await marathonRegistrationCollection.findOne(query);
            if (alreadyExist) {
                return res.status(400).send('You have already registered for this marathon!');
            }
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

        // 3.get specific user's registrations
        app.get('/marathon-registrations',verifyToken, async (req, res) => {
            const email = req.query.email;
            const filter = req.query.filter;
            const search = req.query.search;
            const decodedEmail = req.user?.email;
            if (decodedEmail !== email)
                return res.status(403).send({ message: 'forbidden access!' })
            let query = {
                email: email,
                marathonTitle: {
                    $regex: search,
                    $options: 'i',
                },
            }
            if (filter) query.location = filter;
            const result = await marathonRegistrationCollection.find(query).toArray();
            res.send(result);
        })
        // 4.Get specific user's single registration by id
        app.get('/marathon-registrations/:id',verifyToken, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await marathonRegistrationCollection.findOne(query);
            res.send(result);

        });
        // 5.PUT
        app.put('/marathon-registrations/:id',verifyToken, async (req, res) => {
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

        // DELETE
        app.delete('/marathon-registrations/:id',verifyToken, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await marathonRegistrationCollection.deleteOne(query);
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