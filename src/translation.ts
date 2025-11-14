import { type Interaction, type Locale } from "discord.js";

const translations: Record<string, Record<string, string>> = {
    "en-US": {
        // Command descriptions
        "command.sticky.description": "Create a new sticky message",
        "command.sticky.type.description": "Choose the type of message you want to send",
        "command.sticky.type.embed": "embed",
        "command.sticky.type.text": "text",
        "command.stickyremove.description": "Remove the sticky message from a channel",
        "command.stickyremove.channel.description": "Choose the channel you want to remove the sticky message",
        
        // Error messages
        "error.sticky.type.notFound": "sticky type not found",
        "error.channel.notFound": "Channel not found",
        "error.sticky.notFound": "No sticky message found in this channel",
        "error.sticky.remove.notFound": "Sticky message not found in this channel",
        "error.message.sendFailed": "Failed to send the message",
        "error.message.sendError": "Error on send message",
        "error.sticky.removeError": "Error removing sticky message",
        "error.validation.titleDescriptionRequired": "The title and description are required.",
        "error.validation.colorInvalid": "The color is not a valid hex color.",
        "error.validation.messageRequired": "The message is required.",
        "error.permissions.adminRequired": "You don't have permission to use this command.",
        
        // Modal labels
        "modal.createSticky.title": "Create Sticky",
        "modal.input.title": "Title",
        "modal.input.description": "Description",
        "modal.input.color": "Color",
        "modal.input.message": "Message",
        
        // Default values
        "default.sticky.title": "Sticky Message",
        "default.sticky.description": "This is a sticky message with embed",
        "default.sticky.message": "This is a sticky message with text",
        "default.sticky.color": "#89CFF0",
        
        // Button labels
        "button.approve": "Approve",
        "button.edit": "Edit",
        
        // Success messages
        "success.sticky.sent": "Sticky message sent successfully.",
        "success.sticky.removed": "Sticky message removed from {channel}",
        
        // Guild add message
        "guild.add.title": "Mr. Sticky - thank you for adding me to your server!",
        "guild.add.commands": "My commands:",
        "guild.add.command.sticky": "Create a sticky message (embed or text)",
        "guild.add.command.stickyremove": "Remove the sticky message from a channel (if no channel is provided, it will remove the sticky message from the current channel)",
        "guild.add.hosted": "💻 Hosted by [CamposCloud](<https://camposcloud.com>)",
    },
    "pt-BR": {
        // Command descriptions
        "command.sticky.description": "Criar uma nova mensagem fixa",
        "command.sticky.type.description": "Escolha o tipo de mensagem que deseja enviar",
        "command.sticky.type.embed": "embed",
        "command.sticky.type.text": "texto",
        "command.stickyremove.description": "Remover a mensagem fixa de um canal",
        "command.stickyremove.channel.description": "Escolha o canal do qual deseja remover a mensagem fixa",
        
        // Error messages
        "error.sticky.type.notFound": "tipo de mensagem fixa não encontrado",
        "error.channel.notFound": "Canal não encontrado",
        "error.sticky.notFound": "Nenhuma mensagem fixa encontrada neste canal",
        "error.sticky.remove.notFound": "Mensagem fixa não encontrada neste canal",
        "error.message.sendFailed": "Falha ao enviar a mensagem",
        "error.message.sendError": "Erro ao enviar mensagem",
        "error.sticky.removeError": "Erro ao remover mensagem fixa",
        "error.validation.titleDescriptionRequired": "O título e a descrição são obrigatórios.",
        "error.validation.colorInvalid": "A cor não é uma cor hexadecimal válida.",
        "error.validation.messageRequired": "A mensagem é obrigatória.",
        "error.permissions.adminRequired": "Você não tem permissão para usar este comando.",
        
        // Modal labels
        "modal.createSticky.title": "Criar Mensagem Fixa",
        "modal.input.title": "Título",
        "modal.input.description": "Descrição",
        "modal.input.color": "Cor",
        "modal.input.message": "Mensagem",
        
        // Default values
        "default.sticky.title": "Mensagem Fixa",
        "default.sticky.description": "Esta é uma mensagem fixa com embed",
        "default.sticky.message": "Esta é uma mensagem fixa com texto",
        "default.sticky.color": "#89CFF0",
        
        // Button labels
        "button.approve": "Aprovar",
        "button.edit": "Editar",
        
        // Success messages
        "success.sticky.sent": "Mensagem fixa enviada com sucesso.",
        "success.sticky.removed": "Mensagem fixa removida de {channel}",
        
        // Guild add message
        "guild.add.title": "Mr. Sticky - obrigado por me adicionar ao seu servidor!",
        "guild.add.commands": "Meus comandos:",
        "guild.add.command.sticky": "Criar uma mensagem fixa (embed ou texto)",
        "guild.add.command.stickyremove": "Remover a mensagem fixa de um canal (se nenhum canal for fornecido, removerá a mensagem fixa do canal atual)",
        "guild.add.hosted": "💻 Hospedado por [CamposCloud](<https://camposcloud.com>)",
    }
}

export const getTranslation = (key: string, interaction?: Interaction | { locale?: Locale }, locale?: string): string => {
    let targetLocale: string = "en-US";
    
    if (interaction && 'locale' in interaction && interaction.locale) {
        targetLocale = interaction.locale.toString();
    } else if (locale) {
        targetLocale = locale;
    }

    const translation = translations[targetLocale]?.[key] || translations["en-US"]?.[key] || key;
    
    // Replace placeholders like {channel}
    return translation;
}

export const formatTranslation = (key: string, replacements: Record<string, string>, interaction?: Interaction | { locale?: Locale }, locale?: string): string => {
    let translation = getTranslation(key, interaction, locale);
    
    for (const [placeholder, value] of Object.entries(replacements)) {
        translation = translation.replace(`{${placeholder}}`, value);
    }
    
    return translation;
}