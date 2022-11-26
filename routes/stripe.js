const router = require("express").Router();
const stripe = require("stripe")("sk_test_51LOeVQEuYDk3LNJoUMW12VAK1QrKdDXqI6TsXxWBJCtxSrzNXGubevjffVDCk4aSwFEzQQnKb4fwPIxaAQOazXTc00xh2AipPi");


router.post("/payment", (req, res) => {
    //console.log(process.env.STRIPE_KEY)
    stripe.charges.create({
        source: req.body.tokenId,
        amount: req.body.amount,
        currency: "usd"
    }, (stripeErr, stripeRes) => {
        console.log((stripeErr, stripeRes))
        if (stripeErr) {
            console.log(stripeErr)
            return res.status(500).json(stripeErr);
        }
        return res.status(200).json(stripeRes);
    }
    );
});

module.exports = router;