import { SlashCommand } from "fast-discord-js";
import { messagesCache } from "../../cacheManager";
import databases from "../../database";
import { getTranslation, formatTranslation } from "../../translation";

new SlashCommand({
    name: "stickyremove",
    description: "Remove the sticky message from a channel",
    type: 1,
    options: [
        {
            name: "channel",
            description: "Choose the channel you want to remove the sticky message",
            type: 7,
            required: false,
        },
    ],

    run: async (client, interaction: any) => {
        if (!interaction.isCommand()){
            return;
        }

        const hasAdminPermissions = interaction.member?.permissions.has("ADMINISTRATOR");
        if (!hasAdminPermissions){
            return await interaction.reply({ content: `\`❌\`・${getTranslation("error.permissions.adminRequired", interaction)}`, ephemeral: true })
        }

        const channel = interaction.options.getChannel("channel") || interaction.channel;
        if (!channel){
            return await interaction.reply({ content: `\`❌\`・${getTranslation("error.channel.notFound", interaction)}`, ephemeral: true })
        }

        try {
            const stickyMessageData = messagesCache.get(channel.id);
            if (!stickyMessageData){
                return await interaction.reply({ content: `\`❌\`・${getTranslation("error.sticky.remove.notFound", interaction)}`, ephemeral: true })
            }

            messagesCache.delete(channel.id);
            await databases.stickyMessages.deleteOne({ channelId: channel.id });

            const oldMessage = await channel.messages.fetch(stickyMessageData.lastMessageId).catch(() => null);
            await oldMessage?.delete().catch(() => null);

            return await interaction.reply({ content: `\`✅\`・${formatTranslation("success.sticky.removed", { channel: channel.name }, interaction)}`, ephemeral: true })
        } catch (error: any) {
            console.error("Error removing sticky message:", error);
            return await interaction.reply({ content: `\`❌\`・${getTranslation("error.sticky.removeError", interaction)}`, ephemeral: true })
        }
    }
})