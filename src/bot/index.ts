import { Client } from "fast-discord-js";
import { Client as DiscordClient } from "discord.js";

const client = new Client({ autoImport: ["src/bot/commands", "src/bot/handler"]});
client.login(process.env.BOT_TOKEN!)

client.on("clientReady", (client) => {
    console.log(`Bot ${client?.user.username} (${client?.user.id}) connected`)
    updateActivity(client);

    setInterval(() => {
        updateActivity(client);
    }, 10000);
})


const updateActivity = (client: DiscordClient) => {
    client?.user?.setActivity({ name: `Best Stickies #${client?.guilds.cache.size} guilds`, type: 4 });
}

export { client };