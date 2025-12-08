import { Router } from "express";
import { loginUser, logoutUser, registerUser,refreshaccesstoken} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { VerifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.post('/register', upload.fields([
    {
      name : 'avatar',
      maxCount : 2
    
    },
    {
       name : 'coverImage',
       maxCount : 2 
    }
]),registerUser)


router.post('/login',loginUser)
// secured routes 
router.post('/logout',VerifyJWT ,logoutUser)

router.post('/refreshaccessToken',refreshaccesstoken)


export default router