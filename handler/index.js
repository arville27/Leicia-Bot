const { glob } = require('glob');
const { promisify } = require('util');
const { Client } = require('discord.js');
const mongoose = require('mongoose');
const { mongooseConnectionString, mongoUser, mongoPass, guildsId } = require('../config.json');
const { stdLog } = require('../utils/Utility');

const globPromise = promisify(glob);

/**
 * @param {Client} client
 */
module.exports = async (client) => {
    // Commands
    const commandFiles = await globPromise(`${process.cwd()}/commands/**/*.js`);
    commandFiles.map((value) => {
        const file = require(value);
        const splitted = value.split('/');
        const directory = splitted[splitted.length - 2];

        if (file.name) {
            const properties = { directory, ...file };
            client.commands.set(file.name, properties);
        }
    });

    // Events
    const eventFiles = await globPromise(`${process.cwd()}/events/*.js`);
    eventFiles.map((value) => require(value));

    // Slash Commands
    const slashCommands = await globPromise(`${process.cwd()}/SlashCommands/*/*.js`);

    const arrayOfSlashCommands = [];
    slashCommands.forEach((value) => {
        const file = require(value);
        if (!file?.name) return;
        console.log(`${file.name} command loaded`);
        // if (file.userPermissions) file.defaultPermission = false;
        client.slashCommands.set(file.name, file);

        arrayOfSlashCommands.push(file);
    });

    client.on('ready', async () => {
        // Register for a single guild
        // Register for all the guilds the bot is in
        // await client.application.commands.set(arrayOfSlashCommands);
        const ids = Object.values(guildsId);
        console.log(ids);
        ids.forEach(async (guildId) => {
            const guild = client.guilds.cache.get(guildId);
            if (!guild) return;
            await guild.commands.set(arrayOfSlashCommands).then((cmd) => {
                const getRoles = (commandName) => {
                    const permissions = arrayOfSlashCommands.find(
                        (x) => commandName === x.name
                    ).userPermissions;

                    if (!permissions) return null;

                    const roles = guild.roles.cache.filter(
                        (x) => x.permissions.has(permissions) && !x.managed
                    );
                    // roles.forEach((role) => {
                    //     console.log(role.name);
                    // });
                    return roles;
                };

                const fullPermissions = cmd.reduce((accumulator, x) => {
                    const roles = getRoles(x.name);
                    if (!roles) return accumulator;

                    const permissions = roles.reduce((a, v) => {
                        return [
                            ...a,
                            {
                                id: v.id,
                                type: 'ROLE',
                                permission: true,
                            },
                        ];
                    }, []);

                    return [
                        ...accumulator,
                        {
                            id: x.id,
                            permissions,
                        },
                    ];
                }, []);

                guild.commands.permissions.set({ fullPermissions });
            });
        });
        // const tks = client.guilds.cache.get('425654507607687178');
        // await tks.commands.set([]);
    });

    // mongoose
    if (!mongooseConnectionString) return;

    const auth = {
        authSource: 'admin',
        user: mongoUser,
        pass: mongoPass,
    };
    mongoose
        .connect(mongooseConnectionString, auth)
        .then(() => stdLog(0, { extra: 'Connected to mongodb' }))
        .catch(() => {
            client.databaseConnected = false;
            stdLog(2, { extra: 'Failed to connect to mongodb' });
        });
};
