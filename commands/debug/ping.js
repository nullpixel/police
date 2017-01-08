const Discord = require("discord.js");

module.exports = {
    name: "ping",
    description: "Test if bot is alive and it's responsibility",
    permissions: ["ADMINISTRATOR"],

    exec(args, mentions, sender, channel) {
        channel.sendEmbed(
            new Discord.RichEmbed()
                .setTitle("Ping")
                .setColor("#3498db")
                .setDescription("Pong!")
                .setFooter("This action was authorized by " + (sender.nickname || sender.user.username) + "#" + sender.user.discriminator + " (" + sender.user.id +")"),
            "",
            { disableEveryone: true }
        );
    }
};
