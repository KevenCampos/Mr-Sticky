import { CreateButton, CreateEmbed, CreateModal, CreateRow, InteractionHandler, SlashCommand } from "fast-discord-js";
import { ApplicationCommandOptionType, ButtonStyle, InteractionResponse, Message, TextInputStyle, type ColorResolvable } from "discord.js";
import { isValidHexColor } from "../../utils";

interface StickyMessageData {
    lastMessageId: string;
    channelId: string;
    type: "embed" | "text";
    title?: string;
    description?: string;
    color?: string;
    message?: string;
}

const messagesInPreview = new Map<string, StickyMessageData>();
const messagesCache = new Map<string, StickyMessageData>();

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

// new InteractionHandler({
//     customId: "create-sticky-modal",

//     run: async (client, interaction, action, type, previewId?: string) => {

//         if (!interaction.channel){
//             return;
//         }

//         if (!interaction.channel.isSendable()){
//             return;
//         }

//         const previewData = previewId ? messagesInPreview.get(previewId) : undefined;

//         if (action === "show-modal"){
//             let inputs = [];

//             if (type === "embed"){
//                 inputs.push({ customId: "title", label: "Title", required: true, value: previewData?.title || "Sticky Message" });
//                 inputs.push({ customId: "description", label: "Description", style: TextInputStyle.Paragraph, required: true, value: previewData?.description || "This is a sticky message with embed" });
//                 inputs.push({ customId: "color", label: "Color", required: true, value: previewData?.color || "#89CFF0"});
//             }else{
//                 inputs.push({ customId: "message", label: "Message", style: TextInputStyle.Paragraph, required: true, value: previewData?.message || "This is a sticky message with text" });
//             }

//             const modal = CreateModal({
//                 title: "Create Sticky",
//                 customId: `create-sticky-modal:submit-modal:${type}:${previewId}`,
//                 inputs,
//             })

//             return modal.show(interaction);
//         }
        
//         if (action === "submit-modal" && interaction.isModalSubmit()){
            
//             let sendedMessage: Message | InteractionResponse | undefined;

//             const components = [
//                 CreateRow([ 
//                     CreateButton({ customId: `approve-sticky:${interaction.channel.id}`, label: "Approve", style: ButtonStyle.Success }),
//                     CreateButton({ customId: `create-sticky-modal:show-modal:${type}:${interaction.channel.id}`, label: "Edit", style: ButtonStyle.Danger })
//                 ])
//             ]

//             if (type === "embed"){
//                 const title = interaction.fields.getTextInputValue("title");
//                 const description = interaction.fields.getTextInputValue("description");
//                 const color = interaction.fields.getTextInputValue("color");

//                 if (!title || !description){
//                     return interaction.reply({ ephemeral: true, content: `\`❌\`・The title and description are required.`})
//                 }

//                 if (!isValidHexColor(color)){
//                     return interaction.reply({ ephemeral: true, content: `\`❌\`・The color is not a valid hex color.`})
//                 }

//                 const embed = CreateEmbed({ 
//                      title,
//                      description,
//                      color: color as ColorResolvable,
//                 })

//                 if (previewData){
//                     sendedMessage = await (interaction as any).update({ embeds: [embed], components: components });
//                 }else{
//                     sendedMessage = await interaction.reply({ embeds: [embed], components: components, ephemeral: true });
//                 }

//                 if (!sendedMessage){
//                     return interaction.reply({ ephemeral: true, content: `\`❌\`・Failed to send the message.`})
//                 }

//                 messagesInPreview.set(interaction.channel.id, {
//                     type: "embed",
//                     title,
//                     description,
//                     color,
//                     lastMessageId: sendedMessage.id,
//                     channelId: interaction.channel.id
//                 })

//             }else{
//                 const message = interaction.fields.getTextInputValue("message");
//                 if (!message){
//                     return interaction.reply({ ephemeral: true, content: `\`❌\`・The message is required.`})
//                 }

//                 let sendedMessage: Message | InteractionResponse | undefined;

//                 if (previewData){
//                     sendedMessage = await (interaction as any).update({ content: message, components});
//                 }else{
//                     sendedMessage = await interaction.reply({ content: message, components, ephemeral: true });
//                 }

//                 if (!sendedMessage){
//                     return interaction.reply({ ephemeral: true, content: `\`❌\`・Failed to send the message.`})
//                 }

//                 messagesInPreview.set(interaction.channel.id, {
//                     type: "text",
//                     message,
//                     lastMessageId: sendedMessage.id,
//                     channelId: interaction.channel.id
//                 })
//             }
//         }
//     }
// })

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

        if (stickyMessageData.type === "embed"){
            const embed = CreateEmbed({
                title: stickyMessageData.title,
                description: stickyMessageData.description,
                color: stickyMessageData.color as ColorResolvable,
            })
            await interaction.channel.send({ embeds: [embed] });
        }else{
            await interaction.channel.send(stickyMessageData.message!);
        }

        messagesInPreview.delete(interaction.channel.id);
        messagesCache.set(interaction.channel.id, stickyMessageData);

        //TODO: Armazenar no banco de dados
        return interaction.update({ content: `\`✅\`・Sticky message sent successfully.`, components: [], embeds: []})
    }
})