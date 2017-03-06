const Discord = require("discord.js");
const common = require("../../common.js");

module.exports = {
    name: "logignore",
    description: "Toggles ignoring message and command logging in the channel",
    permissions: ["ADMINISTRATOR"],

    exec(args, mentions, sender, channel, logignoreMethod) {
        const ignoring = logignoreMethod(channel);
        common.sendSuccessEmbed(channel, "Message and command logging will be " + (ignoring ? "ignoring" : "logging") + " this channel.", sender);
    }
};
