import { CreateEmbed } from "fast-discord-js";
import { messagesCache, type StickyMessageData } from "../../cacheManager";
import { client } from "../index"
import { Message, type ColorResolvable } from "discord.js";
import databases from "../../database";

// Tempo de espera após o último envio de mensagem antes de atualizar a sticky (em ms)
// Isso garante que só atualiza quando as conversas "acabarem"
const SILENCE_INTERVAL = 3 * 1000; // 3 segundos de silêncio
const schudleUpdate = new Map<string, NodeJS.Timeout>();

client.on("messageCreate", async (message) => {
    const { channel, guild, author } = message;

    if (!guild || !channel || author.bot) {
        return;
    }

    const stickyMessageData = messagesCache.get(channel.id);
    if (!stickyMessageData){
        return;
    }

    // Ignora se a própria mensagem sticky foi enviada
    if (message.id === stickyMessageData.lastMessageId) {
        return;
    }

    // Cancela qualquer atualização agendada anterior
    if (schudleUpdate.has(channel.id)){
        clearTimeout(schudleUpdate.get(channel.id)!);
        schudleUpdate.delete(channel.id);
    }

    // Agenda uma nova atualização após o período de silêncio
    // Isso garante que só atualiza quando não houver mais mensagens sendo enviadas
    schudleUpdate.set(channel.id, setTimeout(async () => {
        await ensureStickyIsLast(channel.id);
        schudleUpdate.delete(channel.id);
    }, SILENCE_INTERVAL));
})

/**
 * Verifica se a mensagem sticky é a última do canal e atualiza se necessário
 * Esta função é otimizada para não fazer operações desnecessárias
 */
const ensureStickyIsLast = async (channelId: string) => {
    const stickyMessageData = messagesCache.get(channelId);
    if (!stickyMessageData){
        return;
    }

    try {
        const channel = await client.channels.fetch(channelId).catch(() => null);
        if (!channel || !channel.isSendable()) {
            return;
        }

        // Busca apenas a última mensagem do canal (otimizado)
        const lastMessages = await channel.messages.fetch({ limit: 1 });
        const lastMessage = lastMessages.first();

        if (!lastMessage) {
            return;
        }

        // Se a sticky já é a última mensagem, não precisa fazer nada
        if (lastMessage.id === stickyMessageData.lastMessageId) {
            return;
        }

        // Verifica se a mensagem sticky ainda existe
        const stickyMessage = await channel.messages.fetch(stickyMessageData.lastMessageId).catch(() => null);
        
        // Se a mensagem sticky não existe mais, recria ela
        if (!stickyMessage) {
            await recreateStickyMessage(channelId, stickyMessageData);
            return;
        }

        // Se chegou aqui, a sticky não é a última mensagem, então precisa atualizar
        await updateStickyMessage(channelId, stickyMessageData);
    } catch(e: any) {
        console.error("Error ensuring sticky is last:", e);
    }
}

/**
 * Recria a mensagem sticky (caso tenha sido deletada)
 */
const recreateStickyMessage = async (channelId: string, stickyMessageData: StickyMessageData) => {
    try {
        const channel = await client.channels.fetch(channelId).catch(() => null);
        if (!channel || !channel.isSendable()) {
            return;
        }

        let newMessage: Message | undefined;

        if (stickyMessageData.type === "embed"){
            const embed = CreateEmbed({
                title: stickyMessageData.title,
                description: stickyMessageData.description,
                color: stickyMessageData.color as ColorResolvable,
            })
            newMessage = await channel.send({ embeds: [embed] });
        }else{
            newMessage = await channel.send(stickyMessageData.message!);
        }

        if (!newMessage){
            return;
        }

        messagesCache.set(channelId, {
            ...stickyMessageData,
            lastUpdated: new Date(),
            lastMessageId: newMessage.id,
        });

        await databases.stickyMessages.updateOne({ channelId }, { $set: { lastMessageId: newMessage.id } })
            .catch((err) => {
                console.error("Error updating sticky message on database:", err);
            });
    } catch(e: any) {
        console.error("Error recreating sticky message:", e);
    }
}

/**
 * Atualiza a mensagem sticky (deleta a antiga e envia uma nova)
 */
const updateStickyMessage = async (channelId: string, stickyMessageData: StickyMessageData) => {
    try {
        const channel = await client.channels.fetch(channelId).catch(() => null);
        if (!channel || !channel.isSendable()) {
            return;
        }

        // Tenta deletar a mensagem antiga (pode não existir mais)
        const oldMessage = await channel.messages.fetch(stickyMessageData.lastMessageId).catch(() => null);
        await oldMessage?.delete().catch((err) => {
            // Ignora erros de deletar (mensagem pode já ter sido deletada)
        });

        // Envia a nova mensagem sticky
        let newMessage: Message | undefined;

        if (stickyMessageData.type === "embed"){
            const embed = CreateEmbed({
                title: stickyMessageData.title,
                description: stickyMessageData.description,
                color: stickyMessageData.color as ColorResolvable,
            })
            newMessage = await channel.send({ embeds: [embed] });
        }else{
            newMessage = await channel.send(stickyMessageData.message!);
        }

        if (!newMessage){
            return;
        }

        // Atualiza o cache e o banco de dados
        messagesCache.set(channelId, {
            ...stickyMessageData,
            lastUpdated: new Date(),
            lastMessageId: newMessage.id,
        });

        await databases.stickyMessages.updateOne({ channelId }, { $set: { lastMessageId: newMessage.id } })
            .catch((err) => {
                console.error("Error updating sticky message on database:", err);
            });
    } catch(e: any) {
        console.error("Error updating sticky message:", e);
    }
};
