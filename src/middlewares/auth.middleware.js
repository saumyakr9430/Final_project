import { ApiError } from "../utils/ApiErorr";
import { asynchandler } from "../utils/asynchandler";
import jwt from "jsonwebtoken"
import dotenv from 'dotenv'
import { User } from "../models/user.model";


export const VerifyJWT = asynchandler(async(req,res,next)=>{
   
try {
         const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")
    
         if(!token){
            throw new ApiError(401,'Un Auth Request ')
         }
        
         const decodedToken = await jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
    
         const Usercheck = await User.findById(decodedToken?._id).select("-password -refreshToken")
    
         if(!Usercheck){
            throw new ApiError(401,'Invalid accessToken')
         }
        
         req.user = Usercheck ;
         next()
} catch (error) {
    throw new ApiError(401,error?.message || "Invalid accessToken middleware")
}

})