const express = require("express")
const cors = require("cors")
const mongoose = require("mongoose")
const auth = require('./middleware/auth');
require("dotenv").config()

const app = express();
const port = process.env.port || 5000;

app.use(cors())
app.use(express.json())
const uri = process.env.ATLAS_URI;
mongoose.connect(uri,{useNewUrlParser:true, useCreateIndex: true,useUnifiedTopology: true}).then(() => {
    console.log('DB connected')
}).catch((e) => {
    console.log('DB error'+ e)
});

app.all('/api/*', auth);
const walletRoute = require('./routes/route');
app.use('/api', walletRoute);
app.listen(port, () => {
    console.log(`server is running on port ${port}`)
})
