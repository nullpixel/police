const Discord = require("discord.js");
const common = require("../../common.js");

module.exports = {
    name: "purge",
    description: "Purge messages within range",
    permissions: ["MANAGE_MESSAGES"],
    args: [
        {
            name: "range",
            optional: true,
            default: "10"
        }
    ],

    exec(args, mentions, sender, channel) {
        if(args.length === 0 || (isNaN(args[0]) && args[0] !== "all")) args[0] = 10;
        common.sendAsAuthorizedEmbed(
          channel,
          new Discord.RichEmbed()
              .setTitle("Purging...")
              .setColor("#ff0000")
              .setDescription(args[0] == "all" ? "Purging all previous message(s)..." : "Purging previous " + args[0] + " message(s)..."),
          sender
        )
        .then(embed => {
            channel.fetchMessages(args[0] === "all" ? {} : { limit: args[0]++}).then(messages => {
                console.log(`Going to prune: ${args[0]++}`);
                let deletableMessages = [];

                if(args[0] !== "all") {
                    let i = 0;
                    messages.every(message => {
                        if(i < args[0]++) {
                            console.log(args[0]++);
                            i++;

                            if(message.id !== embed.id) deletableMessages.push(message);
                            return true;
                        } else {
                            return false;
                        }
                    });
                } else {
                    messages.forEach(message => {
                        if(message.id !== embed.id) deletableMessages.push(message);
                    });
                }

                channel.bulkDelete(deletableMessages).then(() => {
                    embed.delete();
                });
            });
        });
    }
};
