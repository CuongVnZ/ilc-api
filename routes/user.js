const { verifyTokenAndAdmin, verifyTokenAndAuthorize } = require('./verifyToken');

const router = require('express').Router();


module.exports = function(astraClient) {

    const collection = astraClient.namespace(process.env.ASTRA_DB_KEYSPACE).collection("users")

    //UPDATE
    router.put("/:id", verifyTokenAndAuthorize, async (req, res) => {
        if(req.body.password) {
            req.body.password = CryptoJS.AES.encrypt(
                req.body.password, 
                process.env.PASS_SEC
            ).toString();
        }

        try {
            const updatedUser = await User.findByIdAndUpdate(
                req.params.id, 
                {
                    $set: req.body
                }, 
                { new: true }
            );
            return res.status(200).json(updatedUser);
        } catch (err) {
            return res.status(500).json(err);
        }
    });

    //DELETE
    router.delete("/:id", verifyTokenAndAuthorize, async (req, res) => {
        try {
            const deletedUser = await collection.delete(req.params.id);
            return res.status(200).json("User has been deleted ${deletedUser}");
        } catch (err) {
            return res.status(500).json(err);
        }
    });

    //GET USER
    router.get("/find/:uid", verifyTokenAndAdmin, async (req, res) => {
        try {
            const user = await collection.findById(req.params.uid);
            const { password, ...others } = user._doc;
            return res.status(200).json(others);
        } catch (err) {
            return res.status(500).json(err);
        }
    });

    //GET ALL USERS
    router.get("/", async (req, res) => {
        const isNew = req.query.new;
        try {
            var result = await collection.find({})

            var data = result.data
            var arr = []
            for (const property in data) {
                var temp = {}
                temp["_id"] = property
    
                for (const property2 in data[property]) {
                    temp[property2] = data[property][property2]
                }
                arr.push(temp)
            }

            if(isNew) {
                arr.sort((a,b) => {
                    return new Date(b.createdAt) - new Date(a.createdAt)
                })
            }

            return res.json(arr)
        } catch (err) {
            return res.status(500).json(err);
        }
    });

    //GET USER STATS
    router.get("/stats", verifyTokenAndAdmin, async (req, res) => {
        const date = new Date();
        const lastYear = new Date(date.setFullYear(date.getFullYear() -1));
        try {
            var result = await collection.find({})
            var users = result.data
            var arr = []
            for (const property in users) {
                var user = users[property]

                var month = new Date(user.createdAt).getMonth()
                var skip = false
    
                arr.forEach((value, index) => {
                    if (value._id == month) {
                        value.total += 1
                        skip = true
                    }
                })
                if(!skip && !isNaN(month)){
                    var temp = {}
                    temp._id = month
                    temp.total = 1
                    arr.push(temp)
                }

            }
            console.log("[INFO] Received /users/stats get request from ", req.get('origin'))
            return res.status(200).json(arr);
        } catch (err) {
            return res.status(500).json(err);
        }
    });

    return router
}