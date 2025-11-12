import { Client } from "fast-discord-js";

const client = new Client({ autoImport: ["src/bot/commands", "src/bot/handler"]});
client.login(process.env.BOT_TOKEN!)

client.on("clientReady", (client) => {
    console.log(`Bot ${client?.user.username} (${client?.user.id}) connected`)
})

export { client };