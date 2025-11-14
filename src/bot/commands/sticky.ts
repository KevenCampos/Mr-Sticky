import { CreateButton, CreateEmbed, CreateModal, CreateRow, InteractionHandler, SlashCommand } from "fast-discord-js";
import { ApplicationCommandOptionType, ButtonStyle, InteractionResponse, Message, TextInputStyle, type ColorResolvable } from "discord.js";
import { isValidHexColor } from "../../utils";
import databases from "../../database";
import { messagesCache, type StickyMessageData } from "../../cacheManager";
import { getTranslation, formatTranslation } from "../../translation";

const messagesInPreview = new Map<string, StickyMessageData>();

new SlashCommand({
    name: "sticky",
    description: "Create a new sticky message",
    type: 1,
    options: [
        {
            name: "type",
            description: "Choose the type of message you want to send",
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: [
                { name: "embed", value: "embed" },
                { name: "text", value: "text" }
            ]
        },
    ],

    run: async (client, interaction: any) => {
        if (!interaction.isCommand()){
            return;
        }

        const stickyType = interaction.options.get("type").value;
        switch (stickyType) {
            case "embed": 
                client.invokeInteraction(`setup-sticky-modal-embed:show-modal`, interaction);
                break;
            case "text":
                client.invokeInteraction(`setup-sticky-modal-text:show-modal`, interaction);
            break;
            default:
                return await interaction.reply({ content: `\`❌\`・${getTranslation("error.sticky.type.notFound", interaction)}`, ephemeral: true })
        }
    }
})

new InteractionHandler({
    customId: "setup-sticky-modal-embed",

    run: async (client, interaction, action) => {
        if (!interaction.channel?.isSendable()){
            return;
        }

        const previewData = messagesInPreview.get(interaction.channel.id) || undefined;

        if (action === "show-modal"){
            const modal = CreateModal({
                title: getTranslation("modal.createSticky.title", interaction),
                customId: `setup-sticky-modal-embed:submit-modal`,
                inputs: [
                    { customId: "title", label: getTranslation("modal.input.title", interaction), required: true, value: previewData?.title || getTranslation("default.sticky.title", interaction) },
                    { customId: "description", label: getTranslation("modal.input.description", interaction), style: TextInputStyle.Paragraph, required: true, value: previewData?.description || getTranslation("default.sticky.description", interaction)},
                    { customId: "color", label: getTranslation("modal.input.color", interaction), required: true, value: previewData?.color || getTranslation("default.sticky.color", interaction)},
                ],
            })

            modal.show(interaction);
        }

        if (action === "submit-modal" && interaction.isModalSubmit()){
            try {
                const title = interaction.fields.getTextInputValue("title");
                const description = interaction.fields.getTextInputValue("description");
                const color = interaction.fields.getTextInputValue("color");
    
                if (!title || !description){
                    throw new Error(getTranslation("error.validation.titleDescriptionRequired", interaction))
                }
    
                if (!isValidHexColor(color)){
                    throw new Error(getTranslation("error.validation.colorInvalid", interaction))
                }
    
                const embed = CreateEmbed({ 
                    title,
                    description,
                    color: color as ColorResolvable,
                })

                const components = [
                    CreateRow([ 
                        CreateButton({ customId: `approve-sticky:${interaction.channel.id}`, label: getTranslation("button.approve", interaction), style: ButtonStyle.Success }),
                        CreateButton({ customId: `setup-sticky-modal-embed:show-modal`, label: getTranslation("button.edit", interaction), style: ButtonStyle.Danger })
                    ])
                ]
    
                let sendedMessage: Message | InteractionResponse | undefined;
                if (previewData){
                    sendedMessage = await (interaction as any).update({ embeds: [embed], components: components });
                }else{
                    sendedMessage = await interaction.reply({ embeds: [embed], components: components, ephemeral: true });
                }
    
                if (!sendedMessage){
                    throw new Error(getTranslation("error.message.sendFailed", interaction))
                }
    
                messagesInPreview.set(interaction.channel.id, {
                    type: "embed",
                    lastUpdated: new Date(),
                    title,
                    description,
                    color,
                    lastMessageId: sendedMessage.id,
                    channelId: interaction.channel.id
                })
            }catch(e: any){
                return await interaction.reply({ ephemeral: true, content: `\`❌\`・${e.message}`})
            }
        }
    }
})

new InteractionHandler({
    customId: "setup-sticky-modal-text",

    run: async (client, interaction, action) => {
        if (!interaction.channel?.isSendable()){
            return;
        }

        const previewData = messagesInPreview.get(interaction.channel.id) || undefined;

        if (action === "show-modal"){
            const modal = CreateModal({
                title: getTranslation("modal.createSticky.title", interaction),
                customId: `setup-sticky-modal-text:submit-modal`,
                inputs: [
                    {customId: "message", label: getTranslation("modal.input.message", interaction), style: TextInputStyle.Paragraph, required: true, value: previewData?.message || getTranslation("default.sticky.message", interaction) },
                ],
            })

            modal.show(interaction);
        }

        if (action === "submit-modal" && interaction.isModalSubmit()){
            try {
                let sendedMessage: Message | InteractionResponse | undefined;

                const components = [
                    CreateRow([ 
                        CreateButton({ customId: `approve-sticky:${interaction.channel.id}`, label: getTranslation("button.approve", interaction), style: ButtonStyle.Success }),
                        CreateButton({ customId: `setup-sticky-modal-text:show-modal`, label: getTranslation("button.edit", interaction), style: ButtonStyle.Danger })
                    ])
                ]

                const message = interaction.fields.getTextInputValue("message");
                if (!message){
                    throw new Error(getTranslation("error.validation.messageRequired", interaction))
                }

                if (previewData){
                    sendedMessage = await (interaction as any).update({content: message, components});
                }else{
                    sendedMessage = await interaction.reply({content: message, components, ephemeral: true});
                }

                if (!sendedMessage){
                    throw new Error(getTranslation("error.message.sendFailed", interaction));
                }

                messagesInPreview.set(interaction.channel.id, {
                    type: "text",
                    lastUpdated: new Date(),
                    message,
                    lastMessageId: sendedMessage.id,
                    channelId: interaction.channel.id
                })
            }catch(e: any){
                return await interaction.reply({ ephemeral: true, content: `\`❌\`・${e.message}`})
            }
        }
    }
})

new InteractionHandler({
    customId: "approve-sticky", 

    run: async (client, interaction) => {

        if (!interaction.isButton()){
            return;
        }

        if (!interaction.channel?.id || !interaction.channel.isSendable()){
            return interaction.reply({ ephemeral: true, content: `\`❌\`・${getTranslation("error.channel.notFound", interaction)}`})
        }

        const stickyMessageData = messagesInPreview.get(interaction.channel.id);
        if (!stickyMessageData){
            return interaction.reply({ ephemeral: true, content: `\`❌\`・${getTranslation("error.sticky.notFound", interaction)}`})
        }

        let sendedMessage: Message | undefined;

        if (stickyMessageData.type === "embed"){
            const embed = CreateEmbed({
                title: stickyMessageData.title,
                description: stickyMessageData.description,
                color: stickyMessageData.color as ColorResolvable,
            })
            sendedMessage = await interaction.channel.send({ embeds: [embed] });
        }else{
            sendedMessage = await interaction.channel.send(stickyMessageData.message!);
        }

        if (!sendedMessage){
            return interaction.reply({ ephemeral: true, content: `\`❌\`・${getTranslation("error.message.sendError", interaction)}`})
        }

        // Update last messageId on cache
        stickyMessageData.lastMessageId = sendedMessage.id;

        // Delete old message in database if exists
        await databases.stickyMessages.deleteOne({ channelId: interaction.channel.id });

        // Add sticky message on database
        await databases.stickyMessages.create({
            channelId: interaction.channel.id,
            color: stickyMessageData.color,
            description: stickyMessageData.description,
            message: stickyMessageData.message,
            title: stickyMessageData.title,
            type: stickyMessageData.type,
            lastMessageId: sendedMessage.id
        })

        // add in cache to rapid access
        messagesInPreview.delete(interaction.channel.id);
        messagesCache.set(interaction.channel.id, stickyMessageData);

        return interaction.update({ content: `\`✅\`・${getTranslation("success.sticky.sent", interaction)}`, components: [], embeds: []})
    }
})