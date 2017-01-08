const Discord = require("discord.js");
const client = new Discord.Client();
const config = require("./config.js");

console.log("Initializing Police...");

client.on("ready", () => {
    console.log(`Bot has logged in as ${client.user.username}!`);
    console.log(`Creating ${client.guilds.size} instance(s) of bot to scale`);

    client.user.setGame("\ud83d\udea8");

    client.guilds.forEach(guild => {
        require("./bot.js").init({
            client: client,
            guild: guild
        });
    });
});

client.login(config.botToken);
