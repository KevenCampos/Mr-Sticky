import client from "../index"

client.on("messageCreate", (message) => {
    if (!message.guild){
        return;
    }

    console.log(`Mensagem enviada na ${message.guild.name} - (${message.author.globalName}): ${message.content}`);
})