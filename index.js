const { Client, GatewayIntentBits, Events } = require('discord.js');
const { Player } = require('discord-player');
const { DefaultExtractors } = require('@discord-player/extractor');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const player = new Player(client);

client.once(Events.ClientReady, async () => {
    await player.extractors.loadMulti(DefaultExtractors);
    console.log(`Bot ${client.user.tag} sudah online!`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;

    const prefix = '!';
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // Mengambil antrean (queue) yang sedang aktif di server ini
    const queue = player.nodes.get(message.guild.id);

    // 1. Perintah !play (Memutar lagu atau playlist)
    if (command === 'play') {
        const query = args.join(' ');
        if (!query) return message.reply('Tuliskan judul lagu atau link Spotify/playlist yang ingin diputar!');

        const channel = message.member?.voice.channel;
        if (!channel) return message.reply('Kamu harus masuk ke voice channel terlebih dahulu!');

        try {
            const { track } = await player.play(channel, query, {
                nodeOptions: {
                    metadata: message
                }
            });

            return message.reply(`Memuat ke antrean: **${track.title}**`);
        } catch (e) {
            console.error(e);
            return message.reply('Terjadi kesalahan saat memutar lagu.');
        }
    }

    // 2. Perintah !pause (Menjeda musik)
    if (command === 'pause') {
        if (!queue || !queue.isPlaying()) return message.reply('Tidak ada musik yang sedang diputar!');
        queue.node.pause();
        return message.reply('Musik berhasil dijeda! ⏸️ Ketik `!resume` untuk melanjutkan.');
    }

    // 3. Perintah !resume / !start (Melanjutkan musik yang dijeda)
    if (command === 'resume' || command === 'start') {
        if (!queue) return message.reply('Tidak ada antrean musik!');
        queue.node.resume();
        return message.reply('Musik dilanjutkan kembali! ▶️');
    }

    // 4. Perintah !skip / !next (Melewati lagu saat ini)
    if (command === 'skip' || command === 'next') {
        if (!queue || !queue.isPlaying()) return message.reply('Tidak ada lagu yang bisa dilewati!');
        queue.node.skip();
        return message.reply('Berhasil melewati lagu ini! ⏭️');
    }

    // 5. Perintah !stop (Menghentikan musik dan mengeluarkan bot dari voice channel)
    if (command === 'stop') {
        if (!queue) return message.reply('Bot sedang tidak memutar musik!');
        queue.delete();
        return message.reply('Musik dihentikan dan bot keluar dari voice channel. ⏹️');
    }
});

client.login(process.env.DISCORD_TOKEN);