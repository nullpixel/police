const Discord = require("discord.js");
const common = require("../../common.js");

module.exports = {
    name: "poll",
    description: "Make a poll, arguments inside inline code blocks",
    permissions: ["MANAGE_MESSAGES"],
    args: [
        {
            name: "time",
            description: "in minutes",
            optional: false
        },
        {
            name: "question",
            description: "inside `inline code block`",
            optional: false
        },
        {
            name: "..choices..",
            description: "inside `inline code blocks`",
            optional: false
        }
    ],
    subexec_permissions: [],

    active_polls: {},

    exec(args, mentions, sender, channel, message) {
        if(/`([^`]+)`/.test(message) && message.match(/`([^`]+)`/g).length >= 2) {
            const time = args[0];
            const question = message.match(/`([^`]+)`/)[1];
            const answers = message.match(/`([^`]+)`/g).splice(1).map(value => { return value.replace(/^`/, "").replace(/`$/, ""); });
            const pollID = Math.random().toString(36).substr(2, 4);

            const regional_indicators = Array(10).fill(0).map((value, key) => { return eval("'\\ud83c\\udde" + (key + 6).toString(16) + "'"); });

            if(answers.length > regional_indicators.length) {
                common.sendErrorEmbed(channel, "Too many viable answers. Maximum: " + regional_indicators.length, sender);
            } else {
                module.exports.active_polls[pollID] = {
                    question: question,
                    answers: answers,
                    user_answers: []
                };

                let embed = new Discord.RichEmbed()
                    .setTitle(question)
                    .setColor("#3498db")
                    .setDescription("Time to answer: " + time + " minute(s). Answer with `$poll-" + pollID + " [" + Array(answers.length).fill(0).map((value, key) => { return String.fromCharCode(key + 65); }).join("|") + "]`")
                    .setFooter("This action was authorized by " + (sender.nickname || sender.user.username) + "#" + sender.user.discriminator + " (" + sender.user.id +")");

                let i = 0;
                answers.forEach(answer => {
                    embed.addField(regional_indicators[i], answer);
                    i++;
                });

                channel.sendEmbed(
                    embed,
                    "",
                    { disableEveryone: true }
                );

                setTimeout((channel, pollID, sender, regional_indicators) => {
                    let poll = module.exports.active_polls[pollID];

                    let embed = new Discord.RichEmbed()
                        .setTitle("Poll ended")
                        .setColor("#9400D3")
                        .setDescription("Poll #" + pollID + " (_" + poll.question + "_) has ended. The results are:")
                        .setFooter("This message was a follow-up for an action authorized by " + (sender.nickname || sender.user.username) + "#" + sender.user.discriminator + " (" + sender.user.id +")");

                    // TODO: Redo total answer logic

                    let totalAnswers = {};

                    for(var i = 0; i < poll.answers.length; i++) {
                        totalAnswers[i] = 0;
                    }

                    poll.user_answers.forEach(user_answer => {
                        totalAnswers[user_answer.selection]++;
                    });

                    let mostVotes = 0;

                    for(var selection in totalAnswers) {
                        embed.addField(regional_indicators[selection] + " (_" + poll.answers[selection] + "_)", totalAnswers[selection] + " votes");
                        if(totalAnswers[selection] > totalAnswers[mostVotes]) mostVotes = selection;
                    }

                    embed.addField("\u200b", "\u200b", true)
                        .addField("Winner is:", regional_indicators[mostVotes] + " (_" + poll.answers[mostVotes] + "_)");

                    channel.sendEmbed(
                        embed,
                        "",
                        { disableEveryone: true }
                    );

                    delete module.exports.active_polls[pollID];
                }, time * 60 * 1000, channel, pollID, sender, regional_indicators);
            }
        } else {
            common.sendErrorEmbed(channel, "You didn\'t use the command correctly.", sender).then(message => {
                setTimeout(message => {
                    message.delete();
                }, 5000, message);
            });
        }
    },

    subexec(args, mentions, sender, channel, sub) {
        if(Object.keys(module.exports.active_polls).indexOf(sub[0]) > -1) {
            let hasVoted = false;

            module.exports.active_polls[sub[0]].user_answers.every(user_answer => {
                if(user_answer.userID === sender.user.id) {
                    hasVoted = true;
                    return false;
                } else {
                    return true;
                }
            });

            if(!hasVoted) {
                const choices = Array(module.exports.active_polls[sub[0]].answers.length).fill(0).map((value, key) => { return String.fromCharCode(key + 65).toLowerCase(); });

                if(choices.indexOf(args[0].toLowerCase()) > -1) {
                    module.exports.active_polls[sub[0]].user_answers.push({
                        selection: choices.indexOf(args[0].toLowerCase()),
                        userID: sender.user.id
                    });

                    common.sendSuccessEmbed(channel, "You have voted successfully.", sender).then(message => {
                        setTimeout(message => {
                            message.delete();
                        }, 5000, message);
                    });
                } else {
                    common.sendErrorEmbed(channel, "That is not a valid answer to the poll.", sender).then(message => {
                        setTimeout(message => {
                            message.delete();
                        }, 5000, message);
                    });
                }
            } else {
                common.sendErrorEmbed(channel, "You have already answered to that poll.", sender).then(message => {
                    setTimeout(message => {
                        message.delete();
                    }, 5000, message);
                });
            }
        } else {
            common.sendErrorEmbed(channel, "Poll not found.", sender).then(message => {
                setTimeout(message => {
                    message.delete();
                }, 5000, message);
            });
        }
    }
};
