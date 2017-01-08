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

var app = module.exports = {
    settings: {
        commands: {
            commander: "$",
            deleteAllWithCommander: true,
            notifyNoPermissions: false
        }

    },

    commands: {},
    commandCategories: {},

    lastSeen: {},

    policeChannels: {
        modLog: null,
        rules: null,
        log: null,
        commandLog: null
    },

    init(options) {
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
                                            app.commands[commandModule.name] = commandModule;

                                            if(Object.keys(app.commandCategories).indexOf(dir) === -1) app.commandCategories[dir] = [];

                                            app.commandCategories[dir].push(commandModule.name);
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
                    app.policeChannels.modLog = channel;
                });
            } else {
                app.policeChannels.modLog = guild.channels.filter(o => { return o.name === "police-mod-log"; }).first();
            }

            if(channelNames.indexOf("police-rules") === -1) {
                guild.createChannel("police-rules", "text").then(channel => {
                    app.policeChannels.modLog = channel;
                });
            } else {
                app.policeChannels.rules = guild.channels.filter(o => { return o.name === "police-rules"; }).first();
            }

            if(channelNames.indexOf("police-log") === -1) {
                guild.createChannel("police-log", "text").then(channel => {
                    app.policeChannels.modLog = channel;
                });
            } else {
                app.policeChannels.log = guild.channels.filter(o => { return o.name === "police-log"; }).first();
            }

            if(channelNames.indexOf("police-command-log") === -1) {
                guild.createChannel("police-command-log", "text").then(channel => {
                    app.policeChannels.commandLog = channel;
                });
            } else {
                app.policeChannels.commandLog = guild.channels.filter(o => { return o.name === "police-command-log"; }).first();
            }
        }

        client.on("typingStart", (channel, user) => {
            if(channel.guild.id === guild.id) {
                app.lastSeen[user.id] = {
                    time: Date.now(),
                    doing: "Typing in channel #" + channel.name
                };
            }
        });

        client.on("typingStop", (channel, user) => {
            if(channel.guild.id === guild.id) {
                app.lastSeen[user.id] = {
                    time: Date.now(),
                    doing: "Stopping typing in channel #" + channel.name
                };
            }
        });

        client.on("messageUpdate", (oldMessage, newMessage) => {
            if(newMessage.guild.id === guild.id) {
                app.lastSeen[newMessage.author.id] = {
                    time: Date.now(),
                    doing: "Updating message #" + oldMessage.id
                };
            }
        });

        client.on("presenceUpdate", (oldMember, newMember) => {
            if(newMember.guild.id === guild.id) {
                app.lastSeen[newMember.user.id] = {
                    time: Date.now(),
                    doing: "Changing presence"
                };
            }
        });

        client.on("messageDelete", message => {
            if(app.policeChannels.log && !message.content.startsWith(app.settings.commands.commander)) {
                app.policeChannels.log.sendEmbed(
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
        });

        client.on("messageUpdate", (oldMessage, newMessage) => {
            if(newMessage.guild.id === guild.id) {
                if(oldMessage.content !== newMessage.content && !oldMessage.content.startsWith(app.settings.commands.commander)) {
                    if(app.policeChannels.log) {
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

                        app.policeChannels.log.sendEmbed(
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
                if(message.channel.guild.id === guild.id && message.channel !== app.policeChannels.log && message.channel !== app.policeChannels.commandLog && message.channel !== app.policeChannels.modLog) {
                    // last seen
                    app.lastSeen[message.member.user.id] = {
                        time: Date.now(),
                        doing: "Sending message #" + message.id
                    };

                    // command handling
                    if(message.content.startsWith(app.settings.commands.commander)) {
                        if(app.settings.commands.deleteAllWithCommander) message.delete();

                        const args = message.content.substr(1).split(" ");
                        const command = args[0].split("-")[0];

                        if(Object.keys(app.commands).indexOf(command) > -1) {
                            var specialArg = message.content;

                            if(command === "commands") {
                                specialArg = [app.commands, app.commandCategories];
                            } else if(command === "lastseen") {
                                specialArg = app.lastSeen;
                            } else if(command === "settings") {
                                specialArg = [app.settings, (category, setting, value) => {
                                    app.settings[category][setting] = value;
                                }];
                            } else if(command === "shell") {
                                specialArg = client;
                            }

                            if(args[0].indexOf("-") > -1) {
                                if(message.member.hasPermissions(app.commands[command].subexec_permissions || app.commands[command].permissions)) {
                                    app.commands[command].subexec(args.slice(1), message.mentions, message.member, message.channel, args[0].split("-").slice(1), specialArg, app.policeChannels);
                                }
                            } else {
                                if(message.member.hasPermissions(app.commands[command].permissions)) {
                                    app.commands[command].exec(args.slice(1), message.mentions, message.member, message.channel, specialArg, app.policeChannels);
                                }
                            }

                            if(app.policeChannels.commandLog) {
                                app.policeChannels.commandLog.sendEmbed(
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
                            app.logMessage(message);
                        }
                    } else {
                        app.logMessage(message);
                    }
                }
            }
        });
    },

    logMessage: message => {
        // message logging
        if(app.policeChannels.log) {
            if(message.content.length > 1024) {
                app.policeChannels.log.sendEmbed(
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

                app.policeChannels.log.sendMessage(message.content);
            } else {
                app.policeChannels.log.sendEmbed(
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
    }
};
