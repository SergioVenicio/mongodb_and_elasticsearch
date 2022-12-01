import mongoose from "mongoose"


const PostSchema = new mongoose.Schema({
    title: {
        type: String, require: true
    },
    content: {
        type: String, require: true
    },
    slug: {
        type: String, require: true
    }
}, {
    timestamps: {
        createdAt: true,
        updatedAt: false
    }
})

PostSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: (doc, ret) => {
        ret.id = ret._id
        delete ret._id
    }
})

const PostModel = mongoose.model('Post', PostSchema)

export {
    PostSchema,
    PostModel
}