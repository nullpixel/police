const Discord = require("discord.js");
const common = require("../../common.js");

module.exports = {
    name: "commands",
    description: "Get all commands or information about a specific command",
    permissions: [],
    args: [
        {
            name: "info|",
            optional: true
        },
        {
            name: "command",
            description: "required when previous argument is present",
            optional: true
        }
    ],

    exec(args, mentions, sender, channel, commandData) {
        const commands = commandData[0];
        const commandCategories = commandData[1];

        if(args.length === 0) {
            let commandsComposed = "";

            Object.keys(commandCategories).forEach(category => {
                commandsComposed += "● " + category + "\n";

                commandCategories[category].forEach(commandName => {
                    commandsComposed += "\t○ " + commandName + "\n";
                });
            });

            commandsComposed += "\nGet more information about a command with `$commands info [command name]`";

            channel.sendEmbed(
                new Discord.RichEmbed()
                    .setTitle("Commands")
                    .setColor("#3498db")
                    .setDescription(commandsComposed)
                    .setFooter("This action was authorized by " + (sender.nickname || sender.user.username) + "#" + sender.user.discriminator + " (" + sender.user.id +")"),
                "",
                { disableEveryone: true }
            );
        } else {
            if(args[0] == "info" && args[1]) {
                let command = commands[args[1]];
                if(command) {
                    let commandCategory = null;

                    Object.keys(commandCategories).forEach(category => {
                        if(commandCategories[category].indexOf(args[1]) > -1) {
                            commandCategory = category;
                        }
                    });

                    let argumentsComposed = "";
                    let argumentDescriptions = "";

                    command.args.forEach(arg => {
                        argumentsComposed += (arg.optional ? "<" : "[") + arg.name + (arg.default ? "=" + arg.default : "") + (arg.optional ? ">" : "]") + " ";

                        if(arg.description) {
                            argumentDescriptions += arg.name + ": " + arg.description + "\n";
                        }
                    });

                    channel.sendEmbed(
                        new Discord.RichEmbed()
                            .setTitle("Information about command `" + command.name + "`")
                            .setColor("#3498db")
                            .addField("Arguments", argumentsComposed + "\n\n" + argumentDescriptions)
                            .addField("Category", commandCategory ? commandCategory : "not found")
                            .addField("Permissions", command.permissions.map(perm => perm.toLowerCase().replace("_", " ")).join(", "))
                            .setFooter("This action was authorized by " + (sender.nickname || sender.user.username) + "#" + sender.user.discriminator + " (" + sender.user.id +")"),
                        "",
                        { disableEveryone: true }
                    );
                } else {
                    common.sendErrorEmbed(channel, "Command not found.", sender);
                }
            }
        }
    }
};
