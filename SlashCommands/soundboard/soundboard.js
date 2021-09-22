// const { Client, CommandInteraction, GuildMember, MessageEmbed } = require('discord.js');
// const { SlashCommandBuilder } = require('@discordjs/builders');
// const voiceDiscord = require('@discordjs/voice');

// module.exports = {
//     ...new SlashCommandBuilder()
//         .setName('soundboard')
//         .setDescription('Play a sound from a URL')
//         .addStringOption((option) =>
//             option.setName('url').setDescription('The URL of the media').setRequired(true)
//         ),
//     /**
//      *
//      * @param {Client} client
//      * @param {CommandInteraction} interaction
//      * @param {String[]} args
//      */
//     run: async (client, interaction, args) => {
//         await interaction.deferReply({ ephemeral: true });
//         const channel = interaction.member.voice.channel;
//         const url = interaction.options.getString('url');

//         console.log(url);

//         if (!channel) {
//             return await interaction.followUp({
//                 embeds: [
//                     new MessageEmbed()
//                         .setDescription(
//                             ':octagonal_sign: **Join a voice channel and then try that again!**'
//                         )
//                         .setColor('#eb0000'),
//                 ],
//             });
//         }

//         if (!(interaction.member instanceof GuildMember)) {
//             return await interaction.followUp({
//                 embeds: [
//                     new MessageEmbed()
//                         .setDescription(
//                             ':octagonal_sign: **This command only available on a channel**'
//                         )
//                         .setColor('#eb0000'),
//                 ],
//             });
//         }

//         const player = voiceDiscord.createAudioPlayer();
//         const resource = voiceDiscord.createAudioResource(url);
//         console.log(resource);
//         if (!resource.readable) {
//             return await interaction.followUp({
//                 embeds: [
//                     new MessageEmbed()
//                         .setDescription(':octagonal_sign: **This resource is unplayable**')
//                         .setColor('#eb0000'),
//                 ],
//             });
//         }

//         const connection = voiceDiscord.joinVoiceChannel({
//             channelId: channel.id,
//             guildId: interaction.guildId,
//             adapterCreator: interaction.guild.voiceAdapterCreator,
//         });

//         let subscription = client.subscriptions.get(interaction.guildId);
//         if (subscription) {
//             connection.destroy();
//             return await interaction.followUp({
//                 embeds: [
//                     new MessageEmbed()
//                         .setDescription(
//                             ':octagonal_sign: **The bot already playing on other channel**'
//                         )
//                         .setColor('#eb0000'),
//                 ],
//             });
//         } else {
//             player.play(resource);
//             connection.subscribe(player);
//         }

//         const mediaInfo = new MessageEmbed()
//             .setColor('#c99fff')
//             .setAuthor('Playing sound from url', interaction.user.avatarURL())
//             .setTimestamp();
//         await interaction.followUp({ ephemeral: true, embeds: [mediaInfo] });

//         player.on(voiceDiscord.AudioPlayerStatus.Idle, () => {
//             connection.destroy();
//         });
//     },
// };
