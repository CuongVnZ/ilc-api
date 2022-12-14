const { 
    verifyToken,
    verifyTokenAndAdmin,
    verifyTokenAndAuthorize 
} = require('./verifyToken');

const router = require('express').Router();

module.exports = function(astraClient) {
    const collection = astraClient.namespace(process.env.ASTRA_DB_KEYSPACE).collection("orders")

    const convertArray = (collection) => {
        var result = []
        for (const property in collection) {
            var temp = {}
            temp["_id"] = property

            for (const property2 in collection[property]) {
                temp[property2] = collection[property][property2]
            }
            result.push(temp)
        }
        return result
    }

    //CREATE
    router.post("/", verifyToken, async (req, res) => {
        const data = req.body;
        try {
            const result = await collection.create(data);
            console.log(result)

            return res.status(200).json(result);
        }
        catch (err) {
            return res.status(500).json(err);
        }
    });

    //UPDATE
    router.put("/:id", verifyTokenAndAdmin, async (req, res) => {
        try {
            const updatedOrder = await collection.update(req.params.id, req.body);
            return res.status(200).json(updatedOrder);
        } catch (err) {
            return res.status(500).json(err);
        }
    });

    //DELETE
    router.delete("/:id", verifyTokenAndAdmin, async (req, res) => {
        try {
            const deletedOrder = await collection.delete(req.params.id);
            return res.status(200).json(deletedOrder);
        } catch (err) {
            return res.status(500).json(err);
        }
    });

    //GET USER ORDERS
    router.get("/findByUser/:uid", verifyTokenAndAuthorize, async (req, res) => {
        try {
            const orders = await collection.find({ 
                userId: {
                    $eq: req.params.uid 
                }
            });

            var result = convertArray(orders.data)

            result.sort((a,b) => {
                return new Date(b.createdAt) - new Date(a.createdAt)
            })

            return res.status(200).json(result);
        } catch (err) {
            return res.status(500).json(err);
        }
    });

    //GET ORDER
    router.get("/findById/:id", verifyTokenAndAuthorize, async (req, res) => {
        try {
            var _id = req.params.id
            const order = await collection.find(req.params.id);
            order._id = _id
            return res.status(200).json(order);
        } catch (err) {
            return res.status(500).json(err);
        }
    });

    //GET ALL ORDERS
    router.get("/", verifyTokenAndAdmin, async (req, res) => {
        try {
            const orders = await collection.find();

            var result = convertArray(orders.data)
            
            result.sort((a,b) => {
                return new Date(b.createdAt) - new Date(a.createdAt)
            })
            return res.status(200).json(result)
        } catch (err) {
            return res.status(500).json(err);
        }
    });

    // GET MONTHLY INCOME

    router.get("/income", verifyTokenAndAdmin, async (req, res) => {
        const productId = req.query.pid;
        const date = new Date();
        const lastMonth = new Date(date.setMonth(date.getMonth() - 1));
        const previousMonth = new Date(new Date(date.setMonth(lastMonth.getMonth() - 1)));
        try {
            var arr = []
            var result = await collection.find()

            var orders = result.data

            if(productId) {
                for (const orderId in orders) {
                    var order = orders[orderId]
    
                    var month = new Date(order.createdAt).getMonth()
                    var skip = false
                    

                    var products = order.products
                    products.forEach((product) => {
                        if (product.productId == productId) {
                            
                            arr.forEach((value, index) => {
                                if (value._id == month) {
                                    value.total += product.price * product.quantity
                                    skip = true
                                }
                            })
                            if(!skip && !isNaN(month)){
                                var value = {}
                                value._id = month
                                value.total = product.price * product.quantity
                                arr.push(value)
                            }
                        }

                    })

                }
            }else{
                for (const orderId in orders) {
                    var order = orders[orderId]

                    var month = new Date(order.createdAt).getMonth()
                    console.log(month, order.createdAt, order.amount)
                    var skip = false
                
                    arr.forEach((value, index) => {
                        if (value._id == month) {
                            value.total = Math.round((value.total + order.amount)*100)/100
                            skip = true
                        }
                        
                    })
                    if(!skip && !isNaN(month)){
                        Math.round(order.amount*100)/100
                        arr.push({
                            _id: month,
                            total: Math.round(order.amount*100)/100
                        })
                    }

                }
            }

            arr.sort((a,b) => {
                return b._id - a._id
            })

            console.log("[INFO] Received /orders/income get request from ", req.get('origin'))
            return res.status(200).json(arr);
        } catch (err) {
            console.log(err)
            return res.status(500).json(err);
        }
    });

    return router
}