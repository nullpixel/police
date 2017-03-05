const Discord = require("discord.js");

var common = {
  sendSuccessEmbed: function(channel, description, sender) {
    return this.sendAuthorizedEmbed(channel, "Success!", "#32CD32", description, sender);
  },
  sendErrorEmbed: function(channel, description, sender) {
    return this.sendAuthorizedEmbed(channel, "ERROR", "#ff0000", description, sender);
  },
  sendAuthorizedEmbed: function(channel, title, color, description, sender) {
    /*
    --- COLORS ---
    Success: #32CD32
    Error: #ff0000
    Follow-up: #9400D3
    Neutral: #3498db
    Warning/medium: #FFCC00
    */
    return channel.sendEmbed(
        new Discord.RichEmbed()
            .setTitle(title)
            .setColor(color)
            .setDescription(description)
            .setFooter("This action was authorized by " + (sender.nickname || sender.user.username) + "#" + sender.user.discriminator + " (" + sender.user.id +")"),
        "", { disableEveryone: true }
    ).catch(console.error);
  }
}

module.exports = common;
