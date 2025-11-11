import { Client } from "fast-discord-js";

const client = new Client({ autoImport: ["bot/commands", "bot/handler"]});
client.login(process.env.BOT_TOKEN!)

client.on("clientReady", (client) => {
    console.log(`Bot ${client?.user.username} connected`)
})

export default client;