const mongoose=require('mongoose')
const config=require("config")
const dbgr=require("debug")("development:mongoose")


// mongoose
// .connect(`${config.get("MONGODB_URI")}/Apremiumbagshop`)
// .then(function(){
//     dbgr("connected");
// })
// .catch(function(err){
//     dbgr(err)
// })
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB connected"))
    .catch((err) => console.log("MongoDB error:", err));

module.exports = mongoose.connection;

module.exports=mongoose.connection;