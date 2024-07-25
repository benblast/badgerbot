import Telegraf from "telegraf"
import {memeBot} from './meme.js'
import {checkCommands} from './checkCommands.js'
import {otherCommands} from './otherCommands.js'
import session from 'telegraf/session.js'
import dotenv from 'dotenv';
import fs from 'fs'
import axios from 'axios'
import path from 'path'
import {ethers} from 'ethers'
dotenv.config();

const bot = new Telegraf(process.env.token)
let startupTime = Date.now(); // Record the bot startup time in milliseconds
let startupWindow = 5000; // Set a startup window of 10 seconds (adjust as needed)
let lastUpdateId = 0;

bot.use(session());
bot.use((ctx, next) => {
    try {
        const messageText = ctx.message?.text ?? "ctx.message.text is undefined";
        if (!/^\/\w+/.test(messageText)) {
            //if the message does not start with "/", it's not a command
            //skip logging and move to the next middleware or handler
            return next();
        }
        const currentUpdateId = ctx.update.update_id;

        //ignore commands received during the startup window
        if (ctx.updateType === 'message' && Date.now() - startupTime < startupWindow) {
            console.log('Ignoring command during startup window:', ctx.update.message.text);
            return;
        }
    
        //ignore commands with update_id less than the last processed update_id
        if (currentUpdateId <= lastUpdateId) {
            console.log('Ignoring old command:', ctx.update.message.text);
            return;
        }
    
        const commandText = messageText.slice(1);
    
        //compare the commandText with the keys of the commands object
        if (Object.keys(checkCommands).includes(commandText) || Object.keys(otherCommands).includes(commandText)) {
            const username = ctx.message.from.username
            const command = ctx.update.message.text
            const time = new Date().toLocaleString()
            const channelName = ctx.chat.username || ctx.chat.title
            const chat_id = ctx.chat.id
            console.log(`Username: ${username}, Command: ${command}, Channel: ${channelName}, Chat ID: ${chat_id} Time: ${time}`)
        }

        if (!ctx.session) {
            ctx.session = {};
        }
    } catch(e) {
        console.log(e, 'could not log event')
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
    
    //category 1 commands
    helpText += '\nCheck level commands:\n';
    Object.keys(checkCommands).forEach(command => {
        helpText += `${command}\n`;
    });
    console.log(helpText)

    helpText += `\n\nMemebot command is /meme to automatically slap a mean badger overlay onto a picture of your choice.\n`
    ctx.reply(helpText);
});

// MEMEBOT PHOTO SHIT
bot.on('photo', memeBot.memePhoto)
bot.on('text', memeBot.memeReply)




// NFT MINTING LISTENING AND SHIT
// infura inshitstantiation
const provider = new ethers.providers.InfuraProvider('mainnet', process.env.infura)

// abi formulations minimalistically brainpowered
const contractABI = [
    "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
    "function tokenURI(uint256 tokenId) external view returns (string memory)"
]

// contractual initializationz0r
const contractAddress = "0xcf24db2b8bDA5E1c93fC4Fa045C78c2cD73Ec991"
const nftContract = new ethers.Contract(contractAddress, contractABI, provider)

// jsonreader
const readJSON = async (tokenId) => {
    try {
        const jsonFolderPath = './assets/images_final'
        const fileName = `${tokenId}.json`
        const filePath = path.join(jsonFolderPath, fileName)
        const fileContent = await fs.readFileSync(filePath, 'utf-8')
        console.log(fileContent, 'fileContent')
        const jsonData = JSON.parse(fileContent)
        console.log(jsonData, 'jsonData')


        return jsonData
    } catch(e) {
        console.log(e)
    }
}

// listen carefully, bucko
nftContract.on('Transfer', async (from, to, tokenId, event) => {
    try {
        if (from === ethers.constants.AddressZero) {  // the zero address from where we mint from
            console.log(`new NFT Minted! Token ID: ${tokenId.toString()}`)
            console.log(`minted to: ${to}`)

            const jsonData = await readJSON(tokenId)
            const attributesMessage = jsonData.attributes.map(attribute => `<b>${attribute.trait_type}</b>: ${attribute.value}`).join('\n')

            const message = `
            OH MY GAWD!!!
            \n<b>Honey Bastard #${tokenId}</b> Just Got Minted Mate!
            \n${attributesMessage}
                  `

          const transactionHash = event.transactionHash

          const inlineKeyboard = {
            inline_keyboard: [
              [
                { text: '🔗 Tx', url: `https://etherscan.io/tx/${transactionHash}` } 
              ]
            ]
          }

          const sleep = (ms) => {
            return new Promise(resolve => setTimeout(resolve, ms));
          }
          await sleep(5000)

          await bot.telegram.sendPhoto(process.env.chat_id, { source: fs.createReadStream(path.join('./assets/images_final', `${tokenId}.png`)) }, { caption: message, parse_mode: 'HTML', reply_markup: inlineKeyboard })
        }
    } catch(e) {
        console.log(e)
    }

})


bot.launch()



process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
