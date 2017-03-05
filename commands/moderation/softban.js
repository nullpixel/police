const Discord = require("discord.js");

module.exports = {
    name: "softban",
    description: "Softban a user (kick and delete messages)",
    permissions: ["BAN_MEMBERS"],
    args: [
        {
            name: "user",
            optional: false
        },
        {
            name: "reason",
            optional: true,
            default: "Read #rules."
        }
    ],

    subexec_permissions: ["BAN_MEMBERS"],

    pendingBans: {},

    exec(args, mentions, sender, channel, raw, policeChannels) {
        // TODO: redo sending the embed, sending at the end does not work, because promises

        let embed = new Discord.RichEmbed();

        if(mentions.users.first()) {
            if(!args[1]) args[1] = "Read #rules.";

            channel.guild.fetchMember(mentions.users.first()).then(member => {
                let roleArray = [];

                Array.from(channel.guild.roles).forEach(role => {
                    roleArray.push(role[1]);
                });

                let senderHighRankPos = roleArray.indexOf(channel.guild.roles.filter(role => role.id === sender.highestRole.id).first());
                let bannableHighRankPos = roleArray.indexOf(channel.guild.roles.filter(role => role.id === member.highestRole.id).first());

                if(senderHighRankPos < bannableHighRankPos || roleArray[bannableHighRankPos].name === "@everyone") {
                    channel.guild.fetchMembers().then(refreshedGuild => {
                        let hasNamesakes = false;

                        refreshedGuild.members.every(checkableMember => {
                            if((member.nickname || member.user.username) == (checkableMember.nickname || checkableMember.user.username) && checkableMember.user.id !== member.user.id) {
                                hasNamesakes = true;
                                return false;
                            } else {
                                return true;
                            }
                        });

                        if(!hasNamesakes) {
                            module.exports.softban(mentions, member, sender, args, policeChannels, channel);
                        } else {
                            const identifier = Math.random().toString(36).substr(2, 4);
                            module.exports.pendingBans[identifier] = setTimeout(module.exports.softban, 8 * 1000, mentions, member, sender, args, policeChannels, channel);

                            channel.sendEmbed(
                                new Discord.RichEmbed()
                                    .setTitle("Warning!")
                                    .setDescription("There is another user with similar username or nickname " + (member.nickname || member.username) + " has. If you want to cancel, run command `$ban-" + identifier + " cancel` in 8 seconds. After 8 seconds, the user will be banned normally.")
                                    .setColor("#FFCC00"),
                                "",
                                { disableEveryone: true }
                            );
                        }
                    });
                } else {
                    embed.setTitle("ERROR")
                        .setColor("#ff0000")
                        .setDescription("Your highest role is lower or the same as the member you requested to ban.")
                        .setFooter("This action was authorized by " + (sender.nickname || sender.user.username) + "#" + sender.user.discriminator + " (" + sender.user.id +")");
                    channel.sendEmbed(embed, "", { disableEveryone: true });
                }
            }).catch(() => {
                embed.setTitle("ERROR")
                    .setColor("#ff0000")
                    .setDescription("Could not find the mentioned user.")
                    .setFooter("This action was authorized by " + (sender.nickname || sender.user.username) + "#" + sender.user.discriminator + " (" + sender.user.id +")");
                channel.sendEmbed(embed, "", { disableEveryone: true });
            });
        } else {
            embed.setTitle("ERROR")
                .setColor("#ff0000")
                .setDescription("You didn\'t mention anyone.")
                .setFooter("This action was authorized by " + (sender.nickname || sender.user.username) + "#" + sender.user.discriminator + " (" + sender.user.id +")");
            channel.sendEmbed(embed, "", { disableEveryone: true });
        }
    },

    softban: (mentions, member, sender, args, policeChannels, channel) => {
        channel.fetchMessages().then(messages => {
            let deletableMessages = [];

            messages.forEach(message => {
                if(message.author.id == member.user.id) deletableMessages.push(message);
            });

            channel.bulkDelete(deletableMessages).then(() => {
                member.user.sendMessage("You have been softbanned from the server `" + channel.guild.name + "`. Reason: `" + args.slice(1).join(" ") + "`. Softban is a kick (**not** a ban). Your recent messages were also deleted. You can join back to the server via a valid invite.").then(() => {
                    member.kick(+args[1]).catch(console.error);

                    if(policeChannels.modLog) {
                        policeChannels.modLog.sendEmbed(
                            new Discord.RichEmbed()
                                .setTitle("New softban")
                                .setDescription("A user was softbanned.")
                                .setColor("#3498db")
                                .addField("Banned", mentions.users.first().username + "#" + mentions.users.first().discriminator + " " + (member.nickname ? "(" + member.nickname + ")" : "(no nickname)") + " (" + mentions.users.first().id + ")")
                                .addField("Banner", sender.user.username + "#" + sender.user.discriminator + " (" + (sender.nickname ? sender.nickname : "no nickname") + ") (" + sender.user.id +")")
                                .addField("Reason", args.slice(1).join(" "))
                                .addField("Time", new Date().toString()),
                            "",
                            { disableEveryone: true }
                        );
                    }
                    channel.sendEmbed(
                        new Discord.RichEmbed()
                            .setTitle("Success!")
                            .setColor("#32CD32")
                            .setDescription("You have softbanned " + mentions.users.first().username + " (" + mentions.users.first().id + ")")
                            .setFooter("This action was authorized by " + (sender.nickname || sender.user.username) + "#" + sender.user.discriminator + " (" + sender.user.id +")"),
                            "", { disableEveryone: true }
                    );
                });
            }).catch(console.error);
        }).catch(console.error);
    },

    subexec: (args, mentions, sender, channel, sub) => {
        if(args[0] == "cancel" && sub) {
            if(Object.keys(module.exports.pendingBans).indexOf(sub[0]) > -1) {
                clearTimeout(module.exports.pendingBans[sub[0]]);

                channel.sendEmbed(
                    new Discord.RichEmbed()
                        .setTitle("Success!")
                        .setColor("#32CD32")
                        .setDescription("Softban `" + sub + "` has been cancelled.")
                        .setFooter("This action was authorized by " + (sender.nickname || sender.user.username) + "#" + sender.user.discriminator + " (" + sender.user.id +")"),
                    "", { disableEveryone: true }
                ).catch(console.error);
            } else {
                channel.sendEmbed(
                    new Discord.RichEmbed()
                        .setTitle("ERROR")
                        .setColor("#ff0000")
                        .setDescription(sub + " is not a valid pending softban.")
                        .setFooter("This action was authorized by " + (sender.nickname || sender.user.username) + "#" + sender.user.discriminator + " (" + sender.user.id +")"),
                    "", { disableEveryone: true }
                ).catch(console.error);
            }
        }
    }
};
