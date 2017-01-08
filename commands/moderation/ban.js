const Discord = require("discord.js");

module.exports = {
    name: "ban",
    description: "Ban an user",
    permissions: ["BAN_MEMBERS"],
    args: [
        {
            name: "user",
            optional: false
        },
        {
            name: "ban length",
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

        if(!isNaN(args[1])) {
            if(mentions.users.first()) {
                if(!args[2]) args[2] = "Read #rules.";

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
                                module.exports.ban(mentions, member, sender, args, policeChannels, channel);
                            } else {
                                const identifier = Math.random().toString(36).substr(2, 4);
                                module.exports.pendingBans[identifier] = setTimeout(module.exports.ban, 8 * 1000, mentions, member, sender, args, policeChannels, channel);

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
                    .setDescription("You didn\"t mention anyone.")
                    .setFooter("This action was authorized by " + (sender.nickname || sender.user.username) + "#" + sender.user.discriminator + " (" + sender.user.id +")");
                channel.sendEmbed(embed, "", { disableEveryone: true });
            }
        } else {
            embed.setTitle("ERROR")
                .setColor("#ff0000")
                .setDescription(args[1] + " is not a valid length")
                .setFooter("This action was authorized by " + (sender.nickname || sender.user.username) + "#" + sender.user.discriminator + " (" + sender.user.id +")");
            channel.sendEmbed(embed, "", { disableEveryone: true });
        }
    },

    ban: (mentions, member, sender, args, policeChannels, channel) => {
        member.user.sendMessage("You have been banned from the server `" + channel.guild.name + "` for " + args[1] + " days. Reason: `" + args.slice(2).join(" ") + "`").then(() => {
            member.ban(+args[1]);

            if(policeChannels.modLog) {
                policeChannels.modLog.sendEmbed(
                    new Discord.RichEmbed()
                        .setTitle("New ban")
                        .setDescription("A user was banned.")
                        .setColor("#3498db")
                        .addField("Banned", mentions.users.first().username + "#" + mentions.users.first().discriminator + " " + (member.nickname ? "(" + member.nickname + ")" : "(no nickname)") + " (" + mentions.users.first().id + ")")
                        .addField("Banner", sender.user.username + "#" + sender.user.discriminator + " (" + (sender.nickname ? sender.nickname : "no nickname") + ") (" + sender.user.id +")")
                        .addField("Reason", args.slice(2).join(" "))
                        .addField("Length", args[1] + " day(s)")
                        .addField("Time", new Date().toString()),
                    "",
                    { disableEveryone: true }
                );
            }
            channel.sendEmbed(
                new Discord.RichEmbed()
                    .setTitle("Success!")
                    .setColor("#32CD32")
                    .setDescription("You have banned " + mentions.users.first().username + " (" + mentions.users.first().id + ")")
                    .setFooter("This action was authorized by " + (sender.nickname || sender.user.username) + "#" + sender.user.discriminator + " (" + sender.user.id +")"),
                    "", { disableEveryone: true }
            );
        });
    },

    subexec: (args, mentions, sender, channel, sub) => {
        if(args[0] == "cancel" && sub) {
            if(Object.keys(module.exports.pendingBans).indexOf(sub[0]) > -1) {
                clearTimeout(module.exports.pendingBans[sub[0]]);

                channel.sendEmbed(
                    new Discord.RichEmbed()
                        .setTitle("Success!")
                        .setColor("#32CD32")
                        .setDescription("Ban `" + sub + "` has been cancelled.")
                        .setFooter("This action was authorized by " + (sender.nickname || sender.user.username) + "#" + sender.user.discriminator + " (" + sender.user.id +")"),
                    "", { disableEveryone: true }
                ).catch(console.error);
            } else {
                channel.sendEmbed(
                    new Discord.RichEmbed()
                        .setTitle("ERROR")
                        .setColor("#ff0000")
                        .setDescription(sub + " is not a valid pending ban.")
                        .setFooter("This action was authorized by " + (sender.nickname || sender.user.username) + "#" + sender.user.discriminator + " (" + sender.user.id +")"),
                    "", { disableEveryone: true }
                ).catch(console.error);
            }
        }
    }
};
