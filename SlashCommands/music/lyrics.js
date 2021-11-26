// const { Client, CommandInteraction, MessageActionRow, MessageSelectMenu } = require('discord.js');
// const { SlashCommandBuilder } = require('@discordjs/builders');
// const { Provider, searchLyrics } = require('../../modules/lyrics-scraper/index');
// const { embedResponse, reply, truncateString } = require('../../utils/Utility');
// const resp = require('../../responses/MusicCommandsResponse');
// const selectMenu = require('../../utils/EmbedSelectMenu');

// module.exports = {
//     ...new SlashCommandBuilder()
//         .setName('lyrics')
//         .setDescription('Seach song lyrics')
//         .addStringOption((option) =>
//             option.setName('terms').setDescription('Keyword to identify a song').setRequired(true)
//         ),
//     /**
//      *
//      * @param {Client} client
//      * @param {CommandInteraction} interaction
//      * @param {String[]} args
//      */
//     run: async (client, interaction, args) => {
//         await interaction.deferReply();

//         const terms = interaction.options.getString('terms');
//         const results = (
//             await searchLyrics(terms, [Provider.LN, Provider.GENIUS, Provider.AL])
//         ).map((res) => {
//             return {
//                 label: `${truncateString(`${res.artist} - ${res.title}`, 95)}`,
//                 description: `Source: ${res.provider}`,
//                 lyrics: res.lyrics,
//             };
//         });

//         const listSong = results.map((res, index) => {
//             return {
//                 label: res.label,
//                 description: res.description,
//                 value: `${index}`,
//             };
//         });

//         const row = new MessageActionRow().addComponents(
//             new MessageSelectMenu()
//                 .setCustomId('song')
//                 .setPlaceholder('Nothing selected')
//                 .addOptions(listSong)
//         );

//         if (listSong.length == 0) {
//             return await reply(interaction, embedResponse(resp.others.noResultsFound));
//         }

//         const onCollect = async (componentInteraction) => {
//             await reply(
//                 componentInteraction,
//                 embedResponse({
//                     msg: `${await results[componentInteraction.values[0]].lyrics}`,
//                     color: '#32C8C8',
//                 })
//             );
//         };

//         selectMenu(client, interaction, row, onCollect, false, results);
//     },
// };
