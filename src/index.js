// require('dotenv').config()
import connectDB from "./db/index.js";
import dotenv from 'dotenv';
import app from './app.js'

 



connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000 , ()=>{
        console.log(`server is runnig at port : ${process.env.PORT}`)
    })
})
.catch((error) => {console.log("MONGODB connection failed !!",error)})
































// const app = express()

// (async () => {
//     try{
//     await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//     app.on("error",(error)=>{
//         console.log("ERR:",error)
//         throw error
//     });
     
//     app.listen(process.env.PORT,()=>{
//         console.log(`Listening on port ${process.env.PORT}`)
//     })
//     }
//     catch (error){
//         console.error("ERROR:",error)
//         throw err
//     }
// })()