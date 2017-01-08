const Discord = require("discord.js");

module.exports = {
    name: "roles",
    description: "Get all roles in this guild",
    permissions: ["ADMINISTRATOR"],

    exec(args, mentions, sender, channel) {
        var roleNames = [];

        channel.guild.roles.forEach(role => {
            if(role.name !== "@everyone") roleNames.push(role.name);
        });

        channel.sendEmbed(
            new Discord.RichEmbed()
                .setTitle("List of roles")
                .setColor("#3498db")
                .setDescription("- " + roleNames.join("\n- "))
                .setFooter("This action was authorized by " + (sender.nickname || sender.user.username) + "#" + sender.user.discriminator + " (" + sender.user.id +")"),
            "",
            { disableEveryone: true }
        );
    }
};
