const Discord = require("discord.js");

module.exports = {
    name: "logignore",
    description: "Toggles ignoring message and command logging in the channel",
    permissions: ["ADMINISTRATOR"],

    exec(args, mentions, sender, channel, logignoreMethod) {
        const ignoring = logignoreMethod(channel);

        channel.sendEmbed(
            new Discord.RichEmbed()
                .setTitle("Success")
                .setColor("#32CD32")
                .setDescription("Message and command logging will be " + (ignoring ? "ignoring" : "logging") + " this channel.")
                .setFooter("This action was authorized by " + (sender.nickname || sender.user.username) + "#" + sender.user.discriminator + " (" + sender.user.id +")"),
            "",
            { disableEveryone: true }
        );
    }
};
