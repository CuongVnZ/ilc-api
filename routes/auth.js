const router = require('express').Router();
const CryptoJS = require("crypto-js");
const jwt = require('jsonwebtoken');

module.exports = function(astraClient) {
    const collection = astraClient.namespace(process.env.ASTRA_DB_KEYSPACE).collection("users")

    //REGISTER
    router.post("/register", async (req, res) => {
        var newUser = req.body
        newUser.password = CryptoJS.AES.encrypt(
            newUser.password, 
            process.env.PASS_SEC
        ).toString()

        try {
            const savedUser = await collection.create(newUser);
            return res.status(201).json(savedUser);
        } catch (err) {
            return res.status(400).json({ message: err.message });
        }
    });

    //LOGIN
    router.post("/login", async (req, res) => {
        try {
            const result = await collection.find({ 
                username: {
                    $eq: req.body.username
                } 
            });

            if(Object.keys(result.data).length === 0) 
                return res.status(404).json({ message: "User not found" });

            var user = {}
            for (const property in result.data) {
                user["_id"] =  property
                for (const property2 in result.data[property]) {
                    user[property2] = result.data[property][property2]
                }
            }
            
            const hashedPassword = CryptoJS.AES.decrypt(
                user.password, 
                process.env.PASS_SEC
            );
            const OriginialPassword = hashedPassword.toString(CryptoJS.enc.Utf8);

            if(OriginialPassword !== req.body.password) 
                return res.status(401).json({ message: "Wrong password" });
            
            //create token
            const accessToken = jwt.sign(
                {
                    id:user._id, 
                    isAdmin:user.isAdmin,
                }, 
                process.env.JWT_SEC, 
                { expiresIn: "3d" }
            );
            const { password, ...others } = user;

            return res.status(200).json({...others, accessToken});
        } catch (err) {
            console.log(err);
        }
    });

    return router
}