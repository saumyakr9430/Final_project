import { asynchandler } from "../utils/asynchandler.js";
import { ApiError } from "../utils/ApiErorr.js";
import {User} from "../models/user.model.js";
import {uploadoncloudinary} from "../utils/cloudnary.js"
import { ApiResponse } from "../utils/ApiResponse.js";



const registerUser = asynchandler(async(req,res) =>{

  const {email ,fullName,password,username} = req.body
  console.log("email:",email)
  console.log("name:",fullName)
  console.log("password:",password)
  if([email ,fullName,password,username].some((fields)=> fields?.trim() === "" )){
    throw new ApiError(400,"all fields are required")
  }

  console.log("File:",req.files)
  console.log("Body:",req.body)

  const ExistedUser = await User.findOne({
    $or : [{email},{username}]
  })

  if(ExistedUser){
    throw new ApiError(409,"User already exists")
  }

  const avatarlocalpath  = req.files?.avatar[0]?.path
  // const coverImagelocalpath  = req.files?.coverImage[0]?.path

  let coverImagelocalpath ;
  if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
    coverImagelocalpath = req.files.coverImage[0].path
  }

  if(!avatarlocalpath) {
    throw new ApiError(400,"Avatate Not Found")
  }

  const avatar = await uploadoncloudinary(avatarlocalpath)
  const coverImage  = await uploadoncloudinary(coverImagelocalpath)

  if(!avatar){
    throw new ApiError(409,"Avatar failed to upload")
    
  }
  
  const user = await User.create({
    fullName,
    avatar : avatar.url,
    coverImage : coverImage?.url || "" ,
    email,
    password,
    username : username.toLowerCase()

  })

console.log("User object before findById:", user);
console.log("ID being searched:", user?._id)
    
 const Createduser =  await User.findById(user._id).select(
    "-password -refreshToken"
 )

 if(!Createduser){
    throw new ApiError(500,"Something went wrong while registering the user")
 }

 return res.status(200).json(
    new ApiResponse(200,Createduser,"User created succesfully ")
 )
})



export {registerUser}