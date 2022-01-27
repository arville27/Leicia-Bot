## How to use
    1. Setup working nodejs environment
    2. Clone this repo
    3. Provide a configuration file (config.json)
    4. 'npm install' to install all required dependancies
    5. 'node index.js' to start the project

## Sample config.json
    {
        "token": <DiscordBot Token>, // required
        "guildsId": { "1": <guild uuid>, "2": <guild uuid> }, // required at least one
        "spotifyClientID": <Spotify Client ID>, // required
        "spotifyClientSecret": <Spotify Client Secret>, // required
        "FacebookScrapperAPIKey": "", // private api key, ignore this
        "subsonicHost": <Subsonic host>, // optional
        "subsonicUser": <Subsonic user>, // optional
        "subsonicPassword": <Subsonic password>, // optional
        "prefix": "!", // prefix for chat command
        "mongooseConnectionString": "example --> mongodb://localhost:27017/",
        "mongoUser": "mongodb user",
        "mongoPass": "mongodb password"
    }
Place config.json at root project directory