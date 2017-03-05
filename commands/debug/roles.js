const Discord = require("discord.js");
const common = require("../../common.js");

module.exports = {
    name: "roles",
    description: "Get all roles in this guild",
    permissions: ["ADMINISTRATOR"],

    exec(args, mentions, sender, channel) {
        var roleNames = [];

        channel.guild.roles.forEach(role => {
            if(role.name !== "@everyone") roleNames.push(role.name);
        });

        common.sendEmbed(channel, "List of roles", "- " + roleNames.join("\n- "), sender);
    }
};
