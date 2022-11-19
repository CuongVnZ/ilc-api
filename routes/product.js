const { 
    verifyTokenAndAdmin,
    verifyTokenAndAuthorize 
} = require('./verifyToken');

const router = require('express').Router();

module.exports = function(astraClient) {
    const collection = astraClient.namespace(process.env.ASTRA_DB_KEYSPACE).collection("products")

    //CREATE
    router.post("/", verifyTokenAndAdmin, async (req, res) => {
        try {
            data = req.body
            const result = await collection.create(data);
            data._id = result.documentId
            return res.status(201).json(data);
        }
        catch (err) {
            return res.status(500).json(err);
        }
    });
    
    //UPDATE
    router.put("/:id", verifyTokenAndAdmin, async (req, res) => {
        try {
            const result = await collection.update(req.params.id, req.body);
            console.log(result)
            return res.status(201).json(result);
        } catch (err) {
            return res.status(500).json(err);
        }
    });
    
    //DELETE
    router.delete("/:id", verifyTokenAndAdmin, async (req, res) => {
        try {
            console.log("[INFO] Received /products/ delete request from ", req.get('origin'))
            var result = await collection.delete(req.params.id);
            
            return res.status(200).json(result)
        } catch (err) {
            return res.status(500).json(err);
        }
    });
    
    //GET PRODUCT
    router.get("/find/:id", async (req, res) => {
        try {
            var result = await collection.find({ 
                id: { 
                    $eq: req.params.id 
                } 
            })
            var data = {}
            for (const property in result.data) {
                data["_id"] =  property
                for (const property2 in result.data[property]) {
                    data[property2] = result.data[property][property2]
                }
            }
            return res.status(200).json(data)
        } catch (err) {
            return res.status(500).json(err);
        }
    });

    //GET PRODUCT BY ID
    router.get("/:id", async (req, res) => {
        try {
            var _id = req.params.id
            var result = await collection.get(_id)
            result._id = _id
            return res.status(200).json(result)
        } catch (err) {
            return res.status(500).json(err);
        }
    });
    
    //GET ALL PRODUCTS
    router.get("/", async (req, res) => {
        const qNew = req.query.new;
        const qCategory = req.query.category;
        try {
            let result;
            if (qNew) {
                result = await collection.find().sort({ _id: -1 }).limit(5);
            }
            else if (qCategory) {
                result = await collection.find({ 
                    category: {
                        $in: [qCategory]
                    }
                });
            }else{
                result = await collection.find({})
            }

            var data = result.data
            var arr = []
            for (const property in data) {
                //console.log(`${property}: ${data[property]}`);
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

    return router
}
