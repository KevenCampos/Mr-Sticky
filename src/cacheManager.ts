import databases from "./database";

export interface StickyMessageData {
    lastMessageId: string;
    channelId: string;
    type: "embed" | "text";
    title?: string;
    description?: string;
    color?: string;
    message?: string;
}

export const messagesCache = new Map<string, StickyMessageData>();


const main = async () => {
    const stickyMessages = await databases.stickyMessages.find();

    for (const sticky of stickyMessages) {
        messagesCache.set(sticky.channelId, {
            type: sticky.type,
            title: sticky.title ?? undefined,
            description: sticky.description ?? undefined,
            color: sticky.color ?? undefined,
            message: sticky.message ?? undefined,
            channelId: sticky.channelId,
            lastMessageId: sticky.lastMessageId,
        });
    }
    
    console.log(stickyMessages);
};

main();