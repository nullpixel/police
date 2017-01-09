const fs = require("fs");
const path = require("path");
const Discord = require("discord.js");
const JsDiff = require("diff");

/*
--- COLORS ---
Success: #32CD32
Error: #ff0000
Follow-up: #9400D3
Neutral: #3498db
Warning/medium: #FFCC00
*/

function Bot(options) {
    let settings = {
        commands: {
            commander: "$",
            deleteAllWithCommander: true,
            notifyNoPermissions: false
        }

    };

    let commands = {};
    let commandCategories = {};

    let lastSeen = {};

    let policeChannels = {
        modLog: null,
        rules: null,
        log: null,
        commandLog: null
    };

    let logignore = {
        channels: []
    };

    let client = options.client;
    let guild = options.guild;
    let botMember = guild.members.get(client.user.id);

    fs.readdir("./commands/", (err, dirs) => {
        dirs.forEach(dir => {
            fs.stat(path.join("./commands", dir), (err, stats) => {
                if(stats.isDirectory()) {
                    fs.readdir(path.join("./commands", dir), (err, files) => {
                        files.forEach(file => {
                            fs.stat(path.join("./commands", dir, file), (err, fStats) => {
                                if(fStats.isFile() && file.split(".").slice(-1)[0] === "js") {
                                    var commandModule = require("./" + path.join("./commands", dir, file));
                                    if(typeof commandModule.name !== "undefined") {
                                        commands[commandModule.name] = commandModule;

                                        if(Object.keys(commandCategories).indexOf(dir) === -1) commandCategories[dir] = [];

                                        commandCategories[dir].push(commandModule.name);
                                    }
                                }
                            });
                        });
                    });
                }
            });
        });
    });

    if(botMember.hasPermission("CHANGE_NICKNAME") && botMember.nickname !== "\ud83d\udc6e") {
        botMember.setNickname("\ud83d\udc6e");
    }

    let mutedRole = null;

    if(botMember.hasPermission("MANAGE_ROLES_OR_PERMISSIONS")) {
        var roleNames = [];
        guild.roles.forEach(role => {
            roleNames.push(role.name);
        });

        if(roleNames.indexOf("Police-Muted") === -1) {
            guild.createRole({
                name: "Police-Muted",
                color: "#34495e",
                mentionable: false,
                permissions: ["READ_MESSAGES", "READ_MESSAGE_HISTORY", "CONNECT"],
                hoist: false
            });
        }

        if(roleNames.indexOf("Police-Not-Accepted") === -1) {
            guild.createRole({
                name: "Police-Not-Accepted",
                color: "#34495e",
                mentionable: false,
                permissions: ["READ_MESSAGES", "READ_MESSAGE_HISTORY"],
                hoist: false
            });
        }

        mutedRole = guild.roles.filter(o => { return o.name === "Police-Muted"; }).first();

        guild.channels.forEach(channel => {
            channel.overwritePermissions(mutedRole, {
                SEND_MESSAGES: false
            });
        });

        client.on("channelCreate", channel => {
            if(channel.guild.id === guild.id) {
                channel.overwritePermissions(mutedRole, {
                    SEND_MESSAGES: false
                });
            }
        });
    }

    if(botMember.hasPermission("MANAGE_CHANNELS")) {
        var channelNames = [];

        guild.channels.forEach(channel => {
            channelNames.push(channel.name);
        });

        if(channelNames.indexOf("police-mod-log") === -1) {
            guild.createChannel("police-mod-log", "text").then(channel => {
                policeChannels.modLog = channel;
            });
        } else {
            policeChannels.modLog = guild.channels.filter(o => { return o.name === "police-mod-log"; }).first();
        }

        if(channelNames.indexOf("police-rules") === -1) {
            guild.createChannel("police-rules", "text").then(channel => {
                policeChannels.modLog = channel;
            });
        } else {
            policeChannels.rules = guild.channels.filter(o => { return o.name === "police-rules"; }).first();
        }

        if(channelNames.indexOf("police-log") === -1) {
            guild.createChannel("police-log", "text").then(channel => {
                policeChannels.modLog = channel;
            });
        } else {
            policeChannels.log = guild.channels.filter(o => { return o.name === "police-log"; }).first();
        }

        if(channelNames.indexOf("police-command-log") === -1) {
            guild.createChannel("police-command-log", "text").then(channel => {
                policeChannels.commandLog = channel;
            });
        } else {
            policeChannels.commandLog = guild.channels.filter(o => { return o.name === "police-command-log"; }).first();
        }
    }

    client.on("typingStart", (channel, user) => {
        if(channel.guild.id === guild.id) {
            lastSeen[user.id] = {
                time: Date.now(),
                doing: "Typing in channel #" + channel.name
            };
        }
    });

    client.on("typingStop", (channel, user) => {
        if(channel.guild.id === guild.id) {
            lastSeen[user.id] = {
                time: Date.now(),
                doing: "Stopping typing in channel #" + channel.name
            };
        }
    });

    client.on("messageUpdate", (oldMessage, newMessage) => {
        if(newMessage.guild.id === guild.id) {
            lastSeen[newMessage.author.id] = {
                time: Date.now(),
                doing: "Updating message #" + oldMessage.id
            };
        }
    });

    client.on("presenceUpdate", (oldMember, newMember) => {
        if(newMember.guild.id === guild.id) {
            lastSeen[newMember.user.id] = {
                time: Date.now(),
                doing: "Changing presence"
            };
        }
    });

    client.on("messageDelete", message => {
        if(message.guild.id === guild.id) {
            if(policeChannels.log && !message.content.startsWith(settings.commands.commander)) {
                if(policeChannels.log && logignore.channels.indexOf(message.channel.id) === -1) {
                    policeChannels.log.sendEmbed(
                        new Discord.RichEmbed()
                            .setTitle("Message deleted")
                            .setDescription("A new message was deleted from channel `" + message.channel.name + "` (" + message.channel.id + ").")
                            .setColor("#ff0000")
                            .addField("Sender", message.author.username + "#" + message.author.discriminator + " " + (message.member.nickname ? "(no nickname)" : "(" + message.member.nickname + ")") + " (" + message.author.id + ")")
                            .addField("Content", message.content)
                            .addField("Attachments", message.attachments.size > 0 ? message.attachments.array().map(attachment => attachment.proxyURL).join("\n") : "no attachments")
                            .addField("Time sent", new Date(message.createdTimestamp).toString())
                            .addField("Time deleted", new Date().toString()),
                        "",
                        { disableEveryone: true }
                    );
                }
            }
        }
    });

    client.on("messageUpdate", (oldMessage, newMessage) => {
        if(newMessage.guild.id === guild.id) {
            if(oldMessage.content !== newMessage.content && !oldMessage.content.startsWith(settings.commands.commander)) {
                if(policeChannels.log && logignore.channels.indexOf(newMessage.channel.id) === -1) {
                    var markdownDiff = "";

                    JsDiff.diffChars(oldMessage.content, newMessage.content).forEach(diff => {
                        if(diff.added) {
                            markdownDiff += "**" + diff.value + "**";
                        } else if(diff.removed) {
                            markdownDiff += "~~" + diff.value + "~~";
                        } else {
                            markdownDiff += diff.value;
                        }
                    });

                    policeChannels.log.sendEmbed(
                        new Discord.RichEmbed()
                            .setTitle("Message edited")
                            .setDescription("A message was edited in channel `" + newMessage.channel.name + "` (" + newMessage.channel.id + ").")
                            .setColor("#FFCC00")
                            .addField("Sender", newMessage.author.username + "#" + newMessage.author.discriminator + " " + (newMessage.member.nickname ? "(" + newMessage.member.nickname + ")" : "(no nickname)") + " (" + newMessage.author.id + ")")
                            .addField("Diff", markdownDiff)
                            .addField("Attachments", newMessage.attachments.size > 0 ? newMessage.attachments.array().map(attachment => attachment.proxyURL).join("\n") : "no attachments")
                            .addField("Time sent", new Date(newMessage.createdTimestamp).toString())
                            .addField("Time edited", new Date().toString()),
                        "",
                        { disableEveryone: true }
                    ).catch(console.error);
                }
            }
        }
    });

    client.on("message", message => {
        if(message.channel.type === "text" && message.channel.guild && message.author.id !== botMember.id) {
            if(message.channel.guild.id === guild.id && message.channel !== policeChannels.log && message.channel !== policeChannels.commandLog && message.channel !== policeChannels.modLog) {
                // last seen
                lastSeen[message.member.user.id] = {
                    time: Date.now(),
                    doing: "Sending message #" + message.id
                };

                // command handling
                if(message.content.startsWith(settings.commands.commander)) {
                    if(settings.commands.deleteAllWithCommander) message.delete();

                    const args = message.content.substr(1).split(" ");
                    const command = args[0].split("-")[0];

                    if(Object.keys(commands).indexOf(command) > -1) {
                        var specialArg = message.content;

                        if(command === "commands") {
                            specialArg = [commands, commandCategories];
                        } else if(command === "lastseen") {
                            specialArg = lastSeen;
                        } else if(command === "settings") {
                            specialArg = [settings, (category, setting, value) => {
                                settings[category][setting] = value;
                            }];
                        } else if(command === "shell") {
                            specialArg = client;
                        } else if(command === "logignore") {
                            specialArg = channel => {
                                if(logignore.channels.indexOf(channel.id) > -1) {
                                    logignore.channels.splice(logignore.channels.indexOf(channel.id), 1);
                                } else {
                                    logignore.channels.push(channel.id);
                                }
                            };
                        }

                        if(args[0].indexOf("-") > -1) {
                            if(message.member.hasPermissions(commands[command].subexec_permissions || commands[command].permissions)) {
                                commands[command].subexec(args.slice(1), message.mentions, message.member, message.channel, args[0].split("-").slice(1), specialArg, policeChannels);
                            }
                        } else {
                            if(message.member.hasPermissions(commands[command].permissions)) {
                                commands[command].exec(args.slice(1), message.mentions, message.member, message.channel, specialArg, policeChannels);
                            }
                        }

                        if(policeChannels.commandLog) {
                            policeChannels.commandLog.sendEmbed(
                                new Discord.RichEmbed()
                                    .setTitle("Command execution")
                                    .setDescription("A command was executed in channel `" + message.channel.name + "` (" + message.channel.id + ").")
                                    .setColor("#3498db")
                                    .addField("Executer", message.author.username + "#" + message.author.discriminator + " " + (message.member.nickname ? "(" + message.member.nickname + ")" : "(no nickname)") + " (" + message.author.id + ")")
                                    .addField("Command", message.content)
                                    .addField("Time", new Date().toString()),
                                "",
                                { disableEveryone: true }
                            ).catch(console.error);
                        }
                    } else {
                        logMessage(message);
                    }
                } else {
                    logMessage(message);
                }
            }
        }
    });

    const logMessage = message => {
        // message logging
        if(policeChannels.log && logignore.channels.indexOf(message.channel.id) === -1) {
            if(message.content.length > 1024) {
                policeChannels.log.sendEmbed(
                    new Discord.RichEmbed()
                        .setTitle("New message")
                        .setDescription("A new message was posted to channel `" + message.channel.name + "` (" + message.channel.id + ").")
                        .setColor("#3498db")
                        .addField("Sender", message.author.username + "#" + message.author.discriminator + " " + (message.member.nickname ? "(" + message.member.nickname + ")" : "(no nickname)") + " (" + message.author.id + ")")
                        .addField("Content", "Due to the messages large content, the content will be sent in the next message.")
                        .addField("Attachments", message.attachments.size > 0 ? message.attachments.array().map(attachment => attachment.proxyURL).join("\n") : "no attachments")
                        .addField("Time", new Date().toString()),
                    "",
                    { disableEveryone: true }
                );

                policeChannels.log.sendMessage(message.content);
            } else {
                policeChannels.log.sendEmbed(
                    new Discord.RichEmbed()
                        .setTitle("New message")
                        .setDescription("A new message was posted to channel `" + message.channel.name + "` (" + message.channel.id + ").")
                        .setColor("#3498db")
                        .addField("Sender", message.author.username + "#" + message.author.discriminator + " " + (message.member.nickname ? "(" + message.member.nickname + ")" : "(no nickname)") + " (" + message.author.id + ")")
                        .addField("Content", message.content)
                        .addField("Attachments", message.attachments.size > 0 ? message.attachments.array().map(attachment => attachment.proxyURL).join("\n") : "no attachments")
                        .addField("Time", new Date().toString()),
                    "",
                    { disableEveryone: true }
                );
            }
        }
    };
}

Bot.prototype = Object.create(Bot.prototype);

module.exports = Bot;
