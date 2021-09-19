const { Client, CommandInteraction, GuildMember } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const voiceDiscord = require('@discordjs/voice');

module.exports = {
    ...new SlashCommandBuilder()
        .setName('soundboard')
        .setDescription('Play a sound from a URL')
        .addStringOption((option) =>
            option.setName('url').setDescription('The URL of the media').setRequired(true)
        ),
    /**
     *
     * @param {Client} client
     * @param {CommandInteraction} interaction
     * @param {String[]} args
     */
    run: async (client, interaction, args) => {
        await interaction.deferReply().catch(() => {});
        const channel = interaction.member.voice.channel;
        const url = interaction.options.getString('url');

        console.log(url);

        if (!url.endsWith('.mp3')) {
            return await interaction.followUp('Please provide a valid url!');
        }

        if (!channel) {
            return await interaction.followUp('Join a voice channel and then try that again!');
        }

        if (!(interaction.member instanceof GuildMember)) {
            return await interaction.followUp('This command only available on a channel');
        }

        const player = voiceDiscord.createAudioPlayer();
        const resource = voiceDiscord.createAudioResource(url);

        const connection = voiceDiscord.joinVoiceChannel({
            channelId: channel.id,
            guildId: interaction.guildId,
            adapterCreator: interaction.guild.voiceAdapterCreator,
        });

        player.play(resource);
        connection.subscribe(player);

        await interaction.followUp({ content: 'Playing', ephemeral: true });

        player.on(voiceDiscord.AudioPlayerStatus.Idle, () => {
            connection.destroy();
        });
    },
};
