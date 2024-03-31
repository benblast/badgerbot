import { Telegraf } from "telegraf"
import {memeBot} from './meme.js'
import {checkCommands} from './checkCommands.js'
import {otherCommands} from './otherCommands.js'
import dotenv from 'dotenv';
dotenv.config();

const bot = new Telegraf(process.env.token)

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
