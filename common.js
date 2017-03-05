const Discord = require("discord.js");

var common = {
  /*
  --- COLORS ---
  Success: #32cd32
  Error: #ff0000
  Follow-up: #9400d3
  Neutral: #3498db
  Warning/medium: #ffcc00
  */
  sendSuccessEmbed: function(channel, description, sender) {
    return this.sendAuthorizedEmbed(channel, "Success!", "#32cd32", description, sender);
  },
  sendErrorEmbed: function(channel, description, sender) {
    return this.sendAuthorizedEmbed(channel, "ERROR", "#ff0000", description, sender);
  },
  sendWarningEmbed: function(channel, description) {
    this.sendEmbed(channel, new Discord.RichEmbed()
                              .setTitle("Warning!")
                              .setColor("#ffcc00")
                              .setDescription(description));
  },
  sendNeutralEmbed: function(channel, title, description, sender) {
    return this.sendAuthorizedEmbed(channel, title, "#3498db", description, sender);
  },
  sendFollowUpEmbed: function(channel, title, description, sender) {
      return this.sendAuthorizedEmbed(channel, title, "#9400d3", description, sender, true);
  },
  sendAuthorizedEmbed: function(channel, title, color, description, sender) {
    return this.sendAuthorizedEmbed(channel, title, color, description, sender, false);
  },
  sendAuthorizedEmbed: function(channel, title, color, description, sender, followUp) {
    var embed = new Discord.RichEmbed()
                    .setTitle(title)
                    .setColor(color)
                    .setDescription(description);
    return this.sendAsAuthorizedEmbed(channel, embed, sender, followUp);
  },
  sendAsAuthorizedEmbed: function(channel, embed, sender) {
    return this.sendAsAuthorizedEmbed(channel, embed, sender, false);
  },
  sendAsAuthorizedEmbed: function(channel, embed, sender, followUp) {
    return this.sendAsEmbed(
      channel,
      embed.setFooter((followUp ? "This message was a follow-up for an action" : "This action was") + " authorized by " + (sender.nickname || sender.user.username) + "#" + sender.user.discriminator + " (" + sender.user.id +")")
    );
  },
  sendAsEmbed: function(channel, embed) {
    return channel.sendEmbed(embed, "", { disableEveryone: true }).catch(console.error);
  }
}

module.exports = common;
