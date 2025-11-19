import mongoose,{Schema} from "mongoose"
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2"

const VideoSchema =  new Schema(
    {
    id:{
        type: String,
        required: true
    },
    VideoFile: {
        type: String ,
        required : true
    },
    thumbnail: {
        type: String ,
        required : true
    },
    Owner: {
        type : Schema.Types.ObjectId,
        ref: "User"
          
    }
    ,
    title: {
        type: String ,
        required : true
    },
    description: {
        type: String ,
        required : true
    },
    duration: {
        type: Number,
        required: true
    }
    ,
    Views: {
        type: Number,
        default: 0
    },
    isPublic: {
        type: Boolean,
        required: true
    }
        

},
{
    timestamps: true
}
)

VideoSchema.plugin(mongooseAggregatePaginate)

export const Video = mongoose.model("Video",VideoSchema)
