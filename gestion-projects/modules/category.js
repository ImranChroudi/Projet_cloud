import mongoose, {Schema} from "mongoose";


const categorySchema = new Schema({
    name: String,
    description: String,
    createdBy : String,
    userName : String
});

const Category = mongoose.model('Category', categorySchema);

export default Category;