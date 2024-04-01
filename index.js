import { Telegraf } from "telegraf"
import {memeBot} from './meme.js'
import {checkCommands} from './checkCommands.js'
import {otherCommands} from './otherCommands.js'
import dotenv from 'dotenv';
dotenv.config();

const bot = new Telegraf(process.env.token)

bot.use((ctx, next) => {
    const messageText = ctx.message.text;
    if (!/^\/\w+/.test(messageText)) {
        // If the message does not start with "/", it's not a command
        // Skip logging and move to the next middleware or handler
        return next();
    }

    const commandText = messageText.slice(1);

    // compare the commandText with the keys of the commands object
    if (Object.keys(checkCommands).includes(commandText) || Object.keys(otherCommands).includes(commandText)) {
        const username = ctx.message.from.username
        const command = ctx.update.message.text
        const time = new Date().toLocaleString()
        const channelName = ctx.chat.username || ctx.chat.title
        console.log(`Username: ${username}, Command: ${command}, Channel: ${channelName}, Time: ${time}`)
    }

    return next()
})

Object.entries(checkCommands).forEach(([commandName, commandFunction]) => {
    bot.command(commandName, commandFunction);
});

Object.entries(otherCommands).forEach(([commandName, commandFunction]) => {
    bot.command(commandName, commandFunction);
});

bot.command('listcommands', (ctx) => {
    let helpText = 'Available commands:\n';
    
    // Category 1 commands
    helpText += '\nCheck level commands:\n';
    Object.keys(checkCommands).forEach(command => {
        helpText += `${command}\n`;
    });
    console.log(helpText)

    helpText += `\n\nMemebot command is /meme to automatically slap a mean badger overlay onto a picture of your choice.\n`
    ctx.reply(helpText);
});

// MEMEBOT PHOTO SHIT
bot.on('photo', memeBot.memePhoto);
bot.on('text', memeBot.memeReply);




bot.launch()



process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
