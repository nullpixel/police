const Discord = require("discord.js");
const common = require("../../common.js");

module.exports = {
    name: "ping",
    description: "Test if bot is alive and it's responsibility",
    permissions: ["ADMINISTRATOR"],

    exec(args, mentions, sender, channel) {
        common.sendNeutralEmbed(channel, "Ping", "Pong!", sender);
    }
};
