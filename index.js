const fs = require('fs');
if (!fs.existsSync('./config.json')) {
    fs.appendFileSync('./config.json', JSON.stringify({
        piped_instances: ['https://pipedapi.kavin.rocks'],
        token: 'YOUR.BOT.TOKEN',
        prefix: '%'
    }, null, 4))

    console.log('A config file has been created. Please fill in the necessary details and restart the bot.');
    process.exit(0);
}
require('dotenv').config();
const DJSV = require('@discordjs/voice');
const { Client, IntentsBitField, EmbedBuilder } = require('discord.js');
const tools = require('./tools.js');
const config = require('./config.json');
const token = process.env.TOKEN ?? config.token; // Get the token from the environment variable or the config file
const prefix = config.prefix ?? '%';

const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
        IntentsBitField.Flags.GuildVoiceStates,
        IntentsBitField.Flags.GuildMessageReactions
    ]
})

client.on('ready', () => {
    console.log('Bot is ready');
})

/**
 * @type {string[]}
*/
let playingGuilds = [];

/**
 * @type {Object.<string, string[]>}
 */
let queues = {};

/**
 * @type {Object.<string, string>}
*/
let currentlyPlaying = {};

/**
 * @type {Object.<string, Object.<string, Function>>}
*/
let guildFunc = {};

client.on('messageCreate', async (message) => {
    try {
        if (message.content.toLowerCase().startsWith(`${prefix}play `)) {
            const startTime = Date.now();
            await message.channel.sendTyping()

            if (!message.member.voice.channel) {
                const embed = new EmbedBuilder()
                    .setTitle('You must be in a voice channel to use this command')
                    .setColor('Red')
                return message.reply({
                    embeds: [embed]
                })
            }

            const results = await tools.search(message.content.slice(prefix.length + 5));
            
            if (!results.length) {
                const embed = new EmbedBuilder()
                    .setTitle('No results found')
                    .setColor('Red')
                return message.reply({
                    embeds: [embed]
                })
            }
    
            const stream = (await tools.getStreams(results[0].url.replace('/watch?v=', '')))
            const audioStream = stream.audioStreams[0];
            
            if (!queues[message.guild.id]) {queues[message.guild.id] = [
                stream.audioStreams[0].url
            ]} else {
                queues[message.guild.id].push(stream.audioStreams[0].url)
            }

            const embed = new EmbedBuilder()
                .setTitle(stream.title ?? 'No title???')
                .setURL(`https://www.youtube.com${results[0].url}`)
                .setDescription(results[0].shortDescription)
                .setThumbnail(stream.thumbnailUrl)
                .setAuthor({
                    name: playingGuilds.includes(message.guild.id) ? 'Added to queue' : 'Now playing',
                    iconURL: playingGuilds.includes(message.guild.id) ? 'https://media.piny.dev/icons/playlist-add.png' : 'https://media.piny.dev/icons/player-play.png'
                })
                .addFields([
                    {
                        name: 'Uploader',
                        value: `[${stream.uploader}](https://www.youtube.com${stream.uploaderUrl})`,
                        inline: true
                    },
                    {
                        name: 'Uploaded',
                        value: `<t:${Math.floor(parseInt(stream.uploaded)) / 1000}:R>`,
                        inline: true
                    },
                    {
                        name: 'Duration',
                        value: `${Math.floor(stream.duration / 60)}:${stream.duration % 60}`,
                        inline: true
                    },
                    {
                        name: 'Views',
                        value: stream.views.toLocaleString(),
                        inline: true
                    }
                ])
    
            message.reply({
                embeds: [embed]
            })

            if (playingGuilds.includes(message.guild.id)) return; // If the bot is already playing in this guild, then don't do anything and wait till the current stream ends
            const connection = DJSV.joinVoiceChannel({
                channelId: message.member.voice.channel.id,
                guildId: message.guild.id,
                adapterCreator: message.guild.voiceAdapterCreator
            })
            const player = DJSV.createAudioPlayer({
                behaviors: {
                    noSubscriber: DJSV.NoSubscriberBehavior.Pause
                }
            });
            const resource = DJSV.createAudioResource(audioStream.url);
            connection.subscribe(player);
            player.play(resource);
            playingGuilds.push(message.guild.id);

            async function skip(noMsg = false) {
                if (queues[message.guild.id]?.length > 1) {
                    const nextStream = queues[message.guild.id][1]; // Get the next stream
                    currentlyPlaying[message.guild.id] = queues[message.guild.id][1]; // For if you wanted future reference ig
                    queues[message.guild.id] = queues[message.guild.id].filter(item => item != queues[message.guild.id][0] && item != queues[message.guild.id][1]); // Remove the first two items from the queue
                    if (!nextStream) return;

                    // Play the next stream
                    const nextResource = DJSV.createAudioResource(nextStream);
                    player.play(nextResource);
                } else {
                    if (queues[message.guild.id]?.length === 1) {
                        queues[message.guild.id] = []; // Clear the queue because we just skipped the last song
                    }
                    // Leave the voice channel and remove the guild from the playingGuilds array
                    connection.destroy();
                    playingGuilds = playingGuilds.filter(guild => guild !== message.guild.id);
                    player.stop(); // Stop the player just in case

                    if (!noMsg) message.channel.send('Queue has ended. Leaving voice channel...')
                }
            }

            guildFunc[message.guild.id] = {
                skip, // Skip the current song
            }

            player.on(DJSV.AudioPlayerStatus.Idle, () => {
                // Check if the start time is less than 5 seconds ago
                if (Date.now() - startTime < 5000) return; // If it is, then it's probably just taking its sweet sweet time to start
                if (connection.state.status === DJSV.VoiceConnectionStatus.Destroyed) return;
                if (queues[message.guild.id]?.length > 1) {
                    const nextStream = queues[message.guild.id][1]; // Get the next stream
                    currentlyPlaying[message.guild.id] = queues[message.guild.id][1]; // For if you wanted future reference ig
                    queues[message.guild.id] = queues[message.guild.id].filter(item => item != queues[message.guild.id][0] && item != queues[message.guild.id][1]); // Remove the first two items from the queue
                    if (!nextStream) return;

                    // Play the next stream
                    const nextResource = DJSV.createAudioResource(nextStream);
                    player.play(nextResource);
                } else {
                    if (queues[message.guild.id]?.length === 1) {
                        queues[message.guild.id] = []; // Clear the queue because we just played the last song
                    }
                    // Leave the voice channel and remove the guild from the playingGuilds array
                    connection.destroy();
                    playingGuilds = playingGuilds.filter(guild => guild !== message.guild.id);
                    player.stop(); // Stop the player just in case

                    message.channel.send('Queue has ended. Leaving voice channel...')
                }
            })
        }
    } catch (error) {
        const embed = new EmbedBuilder()
            .setTitle('An error occurred')
            .setDescription(`${error}`)
            .setColor('Red')

        message.reply({
            embeds: [embed]
        })
    }
})

client.login(token);