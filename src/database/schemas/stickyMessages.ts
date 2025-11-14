import { Schema, Types, model } from "mongoose";

export interface IStickyMessages {
    channelId: string;
    title?: string;
    description?: string;
    color?: string;
    message?: string;
    lastMessageId: string;
    lastUpdated: Date;
    type: "embed" | "text";
}

const stickyMessageSchema = new Schema<IStickyMessages>({
    channelId: {
        type: String,
        required: true,
        index: true,
        unique: true // 1 canal = 1 sticky message
    },

    title: {
        type: String,
        required: false,
        default: null
    },

    description: {
        type: String,
        required: false,
        default: null
    },

    color: {
        type: String,
        required: false,
        default: null
    },

    message: {
        type: String,
        required: false,
        default: null
    },

    lastMessageId: {
        type: String,
        required: true,
        default: null
    },

    lastUpdated: {
        type: Date,
        required: true,
        default: new Date()
    },

    type: {
        type: String,
        enum: ["embed", "text"],
        required: true
    }
});

export default model<IStickyMessages>("stickyMessage", stickyMessageSchema);