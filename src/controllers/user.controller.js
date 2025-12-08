import { asynchandler } from "../utils/asynchandler.js";
import { ApiError } from "../utils/ApiErorr.js";
import {User} from "../models/user.model.js";
import {uploadoncloudinary} from "../utils/cloudnary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"


const generatAccessandRefreshtoken = async(userId) => {
  try {
    const usercheck = await User.findById(userId) 
    const accessToken = usercheck.generateAccessToken() 
    const refreshToken = usercheck.generateRefreshToken() 

    usercheck.refreshtoken = refreshToken
    await usercheck.save({validateBeforeSave : false })

    return {accessToken,refreshToken}
  
    } catch (error) {
    throw new ApiError(500,'sometihing went wrong while generating token for user')
  }
}


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

const loginUser = asynchandler(async (req,res)=> {
 
     // req.body -> data 
     // find the user 
     // password check 
     //access and refresh token 
     // send via secure cookies
     // send a response as successful

     const {email,username,password} =req.body
    if(!(username || email)){
     throw new ApiError(400,'username or password is required')
    }
    
    const Usercheck = await  User.findOne({
      $or: [{username},{email}]
    })

    if(!Usercheck){
      throw new ApiError(404,'user not found')
    }

    const ispasswordvalid = await Usercheck.isPasswordcorrect(password)

    if(!ispasswordvalid){
      throw new ApiError(401,'Password incorrect')
    }

    const {accessToken,refreshToken} = await generatAccessandRefreshtoken(Usercheck._id)
    
    const loggedInUser = await User.findById(Usercheck._id).select("-password -refreshToken")
   
    const options  = {
      httpOnly : true ,
      secure : true
    }
    
    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
      new ApiResponse(
        200,
        {
          user:loggedInUser,accessToken,refreshToken
        },
        "User  logged in successfully "
      )
    )
})

const logoutUser = asynchandler(async(req,res)=>{
   // clear cookies 
   // refresh token should be removed in mongodb also 

   
   await User.findByIdAndUpdate(req.user._id,{
    $set : {refreshToken : undefined},
   },
  {
      new: true
     })

    const options  = {
      httpOnly : true ,
      secure : true
    }

    return res.status(200).clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(
      new ApiResponse(200,{},"Usersuccesfully logged out ")
    )

})

const refreshaccesstoken = asynchandler(async(req,res) => {
  const incomingrefreshToken = req.cookies.refreshToken || req.body.refreshToken
  if(!incomingrefreshToken){
    throw new ApiError(404,"Token not found : ")
  }

  try {
    const decodedToken =  jwt.verify(incomingrefreshToken,process.env.REFRESH_TOKEN_SECRET)
    const user = await User.findById(decodedToken?._id)
    if(!user){
      throw new ApiError(401,'Invalid refresh token')
    }
  
    if(incomingrefreshToken !== user?.refreshToken){
      throw new ApiError(401,'refresh token is expired or used')
    
    }
  
    const options = {
      httpOnly : true,
      secure : true
    }
    
    const {accessToken,newrefreshToken} = await generatAccessandRefreshtoken(User._id)
    
    return res
      .status(200)
      .cookie("accessToken",accessToken,options)
      .cookie("refreshToken",newrefreshToken,options)
      .json(
        new ApiResponse(
          200,
          {
            user:user,accessToken,refreshToken :newrefreshToken
          },
          "Token refreshed succesfully  "
        )
      )
  
  } catch (error) {
    throw new ApiError(401,error?.message || "Failed to refresh token")
  }

})

const changecurrentuserpassword = asynchandler (async(req,res) => {
  const {oldpassword , newpassword} = req.body
  if(!(oldpassword || newpassword)){
    throw new ApiError(400,"old password and new password are required")
  }
  const user = await User.findById(req.user._id)

  const ispasswordvalid = await user.isPasswordcorrect(oldpassword)

  if(!ispasswordvalid){
    throw new ApiError(401,'Old Password incorrect')
  }

  user.password = newpassword
  await user.save({validateBeforeSave : false })

  return res.status(200).json(
    new ApiResponse(200,{},"Password changed succesfully ")
  )

})

const getcurrentuserdetails = asynchandler (async(req,res) => {

  return res.status(200).json(
    new ApiResponse(200,req.user,"User details fetched succesfully ")
  )

})

const updateAccountDetails = asynchandler (async(req,res) => {
   const {fullName,username,email} = req.body
   if(!(fullName || email) ){
    throw new ApiError(400,"fullName and email are required")
   }
   
   const user = User.findByIdAndUpdate(req.user._id,{
      $set : {fullName,username,email}
},{ new: true}).select("-password")

return res.status(200).json(
  new ApiResponse(200,user,"User details updated succesfully ") )


}) 


const updateavatar = asynchandler (async(req,res) => {
  const avatarlocalpath  = req.file?.avatar[0]?.path
  if(!avatarlocalpath) {
    throw new ApiError(400,"Avatar Not Found")
  }

  const avatar = await uploadoncloudinary(avatarlocalpath)
  if(!avatar.url){
    throw new ApiError(409,"Error while uploading avatar") }

  const user = await User.findByIdAndUpdate(req.user._id,{
     $set : {avatar : avatar.url}
},{ new: true}).select("-password")

return res.status(200).json(
  new ApiResponse(200,user,"User avatar updated succesfully "))
   
})


const updateusercoverImage = asynchandler (async(req,res) => {
  const coverImagelocalpath  = req.file?.coverImage[0]?.path
  if(!coverImagelocalpath) {
    throw new ApiError(400,"CoverImage Not Found")
  }

  const coverImage = await uploadoncloudinary(avatarlocalpath)
  if(!coverImage.url){
    throw new ApiError(409,"Error while uploading CoverImage") }

  const user = await User.findByIdAndUpdate(req.user._id,{
     $set : {coverImage : coverImage.url}
},{ new: true}).select("-password")


return res.status(200).json(
  new ApiResponse(200,user,"User coverImage updated succesfully "))
   
})

export {registerUser , loginUser, logoutUser ,refreshaccesstoken,changecurrentuserpassword,getcurrentuserdetails,updateAccountDetails,updateavatar}