import databases from "./database";

export interface StickyMessageData {
    lastMessageId: string;
    channelId: string;
    lastUpdated: Date;
    type: "embed" | "text";
    title?: string;
    description?: string;
    color?: string;
    message?: string;
}

export const messagesCache = new Map<string, StickyMessageData>();
export const waitingToSaveOnDatabase = new Map<string, StickyMessageData>();

const main = async () => {
    const stickyMessages = await databases.stickyMessages.find();

    for (const sticky of stickyMessages) {
        messagesCache.set(sticky.channelId, {
            type: sticky.type,
            lastUpdated: sticky.lastUpdated,
            title: sticky.title ?? undefined,
            description: sticky.description ?? undefined,
            color: sticky.color ?? undefined,
            message: sticky.message ?? undefined,
            channelId: sticky.channelId,
            lastMessageId: sticky.lastMessageId,
        });
    }

    console.log(`Loaded ${messagesCache.size} sticky messages in cache.`);
};

main();