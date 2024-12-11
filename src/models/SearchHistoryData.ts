import mongoose, { Schema, Document, model } from "mongoose";

export interface ISearchHistory extends Document {

    userId: mongoose.Schema.Types.ObjectId;
    jobName: string;
    location?: string;
}

const SearchHistorySchema: Schema = new Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'UserData', required: true },
    jobName: { type: String, required: true },
    location: { type: String, required: false }
});

const SearchHistory = mongoose.model<ISearchHistory>("SearchHistory", SearchHistorySchema);
export default SearchHistory;