const { 
    verifyToken,
    verifyTokenAndAdmin,
    verifyTokenAndAuthorize 
} = require('./verifyToken');

const router = require('express').Router();

module.exports = function(astraClient) {
    const collection = astraClient.namespace(process.env.ASTRA_DB_KEYSPACE).collection("orders")

    //CREATE
    router.post("/", async (req, res) => {
        try {
            const savedCart = await collection.create(req.body);
            return res.status(200).json(savedCart);
        }
        catch (err) {
            return res.status(500).json(err);
        }
    });

    //UPDATE
    router.put("/:id", verifyTokenAndAuthorize, async (req, res) => {
        try {
            const updatedCart = await Cart.findByIdAndUpdate(
                req.params.id, 
                {
                    $set: req.body
                }, 
                { new: true }
            );
            return res.status(200).json(updatedCart);
        } catch (err) {
            return res.status(500).json(err);
        }
    });

    //DELETE
    router.delete("/:id", verifyTokenAndAuthorize, async (req, res) => {
        try {
            const deletedCart = await Cart.findByIdAndDelete(req.params.id);
            return res.status(200).json("Product has been deleted...", deletedCart);
        } catch (err) {
            return res.status(500).json(err);
        }
    });

    //GET USER CART
    router.get("/find/:userId", verifyTokenAndAuthorize, async (req, res) => {
        try {
            const cart = await Cart.find({ userId: req.params.userId });
            return res.status(200).json(cart);
        } catch (err) {
            return res.status(500).json(err);
        }
    });

    //GET ALL PRODUCTS
    router.get("/", async (req, res) => {
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
            return res.status(200).json(arr)
        } catch (err) {
            return res.status(500).json(err);
        }
    });
    return router;
}