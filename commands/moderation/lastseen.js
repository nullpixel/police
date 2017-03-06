const Discord = require("discord.js");
const common = require("../../common.js");

module.exports = {
    name: "lastseen",
    description: "When was a user last seen",
    permissions: ["MANAGE_MESSAGES"],
    args: [
        {
            name: "user",
            optional: false
        }
    ],

    exec(args, mentions, sender, channel, lastseenData) {
        if(mentions.users.size > 0) {
            let embed = new Discord.RichEmbed()
                .setTitle("Last seen")
                .setColor("#3498db");

            if(Object.keys(lastseenData).indexOf(mentions.users.first().id) > -1) {
                embed.setDescription(mentions.users.first().username + " was last seen at " + new Date(lastseenData[mentions.users.first().id].time).toString() + " " + lastseenData[mentions.users.first().id].doing.toLowerCase());
            } else {
                embed.setDescription(mentions.users.first().username + " has never been seen");
            }

            common.sendAsAuthorizedEmbed(channel, embed, sender);
        } else {
            common.sendErrorEmbed(channel, "You didn\'t mention anyone.", sender);
        }
    }
};
