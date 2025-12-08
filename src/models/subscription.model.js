import mongoose,{Schema} from "mongoose"

const SubscriptionSchema =  new Schema(
    {
    id:{
        type: String,
        required: true
    },
    Subscriber: {
        type : Schema.Types.ObjectId,
        ref: "User"
          
    }
    ,
    channel: {
        type : Schema.Types.ObjectId,
        ref: "User"
          
    }
},
{
    timestamps: true
}
)
export const User = mongoose.model("Subscription",SubscriptionSchema)