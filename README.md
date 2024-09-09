# JSM
JSM is a simple and easy to use music bot built with discord.js using pipedproxy and pipedapi instead of connecting directly to youtube to avoid getting ip blocked.

## Setup
You need to have a discord bot token to use this bot. You can get one by creating a new application on the [discord developer portal](https://discord.com/developers/applications) and adding a bot to it. You can then copy the token from the bot tab and use it in the configuration file.
### Easy Setup (Compiled)
1. Download the latest release that matches your operating system from the [releases page](https://github.com/NotPiny/JSM/releases)
2. Run the file from the terminal or command prompt with the command `./bot` or `bot.exe` respectively (You may need to make the file executable on linux with `chmod +x bot`)
3. Fill in the required information in the config file that will be generated in the same folder as the executable
4. Run the bot again and it should be good to go

### Manual Setup (Node.js)
You are expected to have node.js and npm installed on your system to use this method
1. Clone the repository with `git clone https://github.com/NotPiny/JSM.git`
2. Enter the directory with `cd JSM`
3. Install the required packages with `npm install`
4. Run index.js with `npm start`
5. Fill in the required information in the config file that will be generated in the same folder as the executable
6. Run index.js again through your preferred method (e.g. `node index.js` or `pm2 start index.js`) and it should be good to go

## Configuration
The configuration file will be generated in the same folder as the executable or index.js file and will be named `config.json`. The file will look like this:
```json
{
    "piped_instances": [
        "https://pipedapi.kavin.rocks"
    ],
    "token": "YOUR.BOT.TOKEN",
    "prefix": "%"
}
```
You can add more piped instances to the array if you want to use more than one. The bot will automatically switch between them if one of them goes down.

You can also remove the `token` field from the configuration file if you would rather use the `TOKEN` environment variable to store your bot token.

The `prefix` field will default to `%` if not provided.

## Commands
### Play
> `%play <song name | video link>` - Play a song from youtube<br/>
This command will play the song that you provide. If there is already a song playing, it will be added to the queue.

### Skip
> **COMING SOON**<br/>
> `%skip` - Skip the current song<br/>
This command will skip the current song and play the next song in the queue.

### Stop (alias: Leave)
> **COMING SOON**<br/>
> `%stop` - Stop the current song and leave the voice channel<br/>
This command will stop the current song and leave the voice channel. The queue will be cleared.