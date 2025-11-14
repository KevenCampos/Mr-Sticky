import { client } from "..";
import { Guild } from "discord.js";
import { CreateEmbed } from "fast-discord-js";
import { getTranslation } from "../../translation";

client.on("guildCreate", async (guild: Guild) => {

    const logs = await guild.fetchAuditLogs({ limit: 1, type: 28 }).catch(() => null);
    const entry = logs?.entries.first();
    const userTargetDM = entry?.executor || await guild.fetchOwner().catch(() => null);

    // Try to get locale from guild preferences, default to en-US
    const locale = guild.preferredLocale || "en-US";

    const embed = CreateEmbed({
        title: getTranslation("guild.add.title", undefined, locale),
        description: [
            `📌・${getTranslation("guild.add.commands", undefined, locale)}`,
            `- \`/sticky <type>\` - ${getTranslation("guild.add.command.sticky", undefined, locale)}`,
            `- \`/stickyremove <channel>\` - ${getTranslation("guild.add.command.stickyremove", undefined, locale)}\n`,
            `-# ${getTranslation("guild.add.hosted", undefined, locale)}`,
        ].join("\n"),
        color: "Green",
    })

    await userTargetDM?.send({ embeds: [embed] });
});