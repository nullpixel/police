const Discord = require("discord.js");

module.exports = {
    name: "shell",
    description: "Open a shell",
    permissions: ["ADMINISTRATOR"],

    exec(args, mentions, sender, channel, client) {
        if(sender.id === channel.guild.ownerID) {
            let currentShell = "PoliceShell v0.1\n$ ";
            channel.sendMessage("```" + currentShell + "```").then(message => {
                var shellHandler = msg => {
                    if(msg.author.id === sender.id && msg.guild.id === channel.guild.id) {
                        msg.delete();
                        if(msg.content === "exit") {
                            currentShell += msg;
                            message.edit("```" + currentShell + "```");

                            shellHandler = null;
                        } else {
                            currentShell += msg + "\n> " + eval(msg).toString().split("\n").join("\n> ") + "\n\n$ ";
                            message.edit("```" + currentShell + "```");
                        }
                    }
                };
                client.on("message", shellHandler);
            });
        } else {
            channel.sendEmbed(
                new Discord.RichEmbed()
                    .setTitle("ERROR")
                    .setColor("#ff0000")
                    .setDescription("You do not have enough permissions to open a shell.")
                    .setFooter("This action was authorized by " + (sender.nickname || sender.user.username) + "#" + sender.user.discriminator + " (" + sender.user.id +")"),
                "",
                { disableEveryone: true }
            );
        }
    }
};
