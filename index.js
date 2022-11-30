// import express and dotenv package installed above
const express = require("express");
const dotenv = require("dotenv");

const getAstraClient = require("./utils/astraClient");

const cors = require("cors");
const userRoute = require("./routes/user");
const authRoute = require("./routes/auth");
const productRoute = require("./routes/product");
const orderRoute = require("./routes/order");
const stripeRoute = require("./routes/stripe");



(async () => {
    const app = express()
    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded({extended: false}))

    // enable env varibales for .env file
    dotenv.config()
    app.listen(5001, () => {
        console.log("Server running port: 5001")
    })
    
    // a basic index route
    app.get('/', (req,res)=>{
        res.send("You're in the index page")
    })
    
    
    // create an Astra DB client
    const astraClient = await getAstraClient()
    app.use("/api/auth", authRoute(astraClient));
    app.use("/api/users", userRoute(astraClient));
    app.use("/api/products", productRoute(astraClient));
    app.use("/api/orders", orderRoute(astraClient));
    app.use("/api/checkout", stripeRoute);
    
    const testCollection = astraClient.namespace(process.env.ASTRA_DB_KEYSPACE).collection("test")

    // get all documents
    app.get('/test', async (req, res) => {
        const blogs = await testCollection.find({})
        return res.json(blogs)
    })

    // post route
    app.post('/test', async(req, res) => {
        const {username, password, email, phone} = req.body
        console.log(req.body)
        const newUser = await testCollection.create({
            username: username,
            password: password,
            email: email,
            phone: phone,
            point: 0
        })
            // return a success msg with the new doc 
        return res.json({data: newUser, msg: 'user created successfully'})
    })

    module.exports = app;
})();