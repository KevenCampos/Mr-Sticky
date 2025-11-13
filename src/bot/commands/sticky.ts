import { CreateButton, CreateEmbed, CreateModal, CreateRow, InteractionHandler, SlashCommand } from "fast-discord-js";
import { ApplicationCommandOptionType, ButtonStyle, InteractionResponse, Message, TextInputStyle, type ColorResolvable } from "discord.js";
import { isValidHexColor } from "../../utils";
import databases from "../../database";
import { messagesCache, type StickyMessageData } from "../../cacheManager";

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
                return await interaction.reply({ content: `\`❌\`・sticky type not found`, ephemeral: true })
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
                title: "Create Sticky",
                customId: `setup-sticky-modal-embed:submit-modal`,
                inputs: [
                    { customId: "title", label: "Title", required: true, value: previewData?.title || "Sticky Message" },
                    { customId: "description", label: "Description", style: TextInputStyle.Paragraph, required: true, value: previewData?.description || "This is a sticky message with embed"},
                    { customId: "color", label: "Color", required: true, value: previewData?.color || "#89CFF0"},
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
                    throw new Error("The title and description are required.")
                }
    
                if (!isValidHexColor(color)){
                    throw new Error("The color is not a valid hex color.")
                }
    
                const embed = CreateEmbed({ 
                    title,
                    description,
                    color: color as ColorResolvable,
                })

                const components = [
                    CreateRow([ 
                        CreateButton({ customId: `approve-sticky:${interaction.channel.id}`, label: "Approve", style: ButtonStyle.Success }),
                        CreateButton({ customId: `setup-sticky-modal-embed:show-modal`, label: "Edit", style: ButtonStyle.Danger })
                    ])
                ]
    
                let sendedMessage: Message | InteractionResponse | undefined;
                if (previewData){
                    sendedMessage = await (interaction as any).update({ embeds: [embed], components: components });
                }else{
                    sendedMessage = await interaction.reply({ embeds: [embed], components: components, ephemeral: true });
                }
    
                if (!sendedMessage){
                    throw new Error(`Failed to send the message.`)
                }
    
                messagesInPreview.set(interaction.channel.id, {
                    type: "embed",
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
                title: "Create Sticky",
                customId: `setup-sticky-modal-text:submit-modal`,
                inputs: [
                    {customId: "message", label: "Message", style: TextInputStyle.Paragraph, required: true, value: previewData?.message || "This is a sticky message with text" },
                ],
            })

            modal.show(interaction);
        }

        if (action === "submit-modal" && interaction.isModalSubmit()){
            try {
                let sendedMessage: Message | InteractionResponse | undefined;

                const components = [
                    CreateRow([ 
                        CreateButton({ customId: `approve-sticky:${interaction.channel.id}`, label: "Approve", style: ButtonStyle.Success }),
                        CreateButton({ customId: `setup-sticky-modal-text:show-modal`, label: "Edit", style: ButtonStyle.Danger })
                    ])
                ]

                const message = interaction.fields.getTextInputValue("message");
                if (!message){
                    throw new Error("The message is required.")
                }

                if (previewData){
                    sendedMessage = await (interaction as any).update({content: message, components});
                }else{
                    sendedMessage = await interaction.reply({content: message, components, ephemeral: true});
                }

                if (!sendedMessage){
                    throw new Error("Failed to send the message.");
                }

                messagesInPreview.set(interaction.channel.id, {
                    type: "text",
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
            return interaction.reply({ ephemeral: true, content: `\`❌\`・Channel not found.`})
        }

        const stickyMessageData = messagesInPreview.get(interaction.channel.id);
        if (!stickyMessageData){
            return interaction.reply({ ephemeral: true, content: `\`❌\`・No sticky message found in this channel.`})
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
            return interaction.reply({ ephemeral: true, content: `\`❌\`・Error on send message. `})
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

        return interaction.update({ content: `\`✅\`・Sticky message sent successfully.`, components: [], embeds: []})
    }
})