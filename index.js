const Discord = require("discord.js");
const client = new Discord.Client();
const config = require("./config.js");
const bot = new require("./bot.js");

console.log("Initializing Police...");

client.on("ready", () => {
    console.log(`Bot has logged in as ${client.user.username}!`);
    console.log(`Creating ${client.guilds.size} instance(s) of bot to scale`);

    client.user.setGame("\ud83d\udea8");

    client.guilds.forEach(guild => {
        try {
            new bot({
                client: client,
                guild: guild
            });
        } catch(e) {
            console.error(e);
        }
    });
});

client.login(config.botToken);
