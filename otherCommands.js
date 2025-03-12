import axios from 'axios'
import {gameLogic} from './gameLogic.js'
import he from 'he'
import fs from 'fs'
import path from 'path'
import { retardTracker } from './retardTracker.js'

async function sendToApi(q, username) {
    let response = await axios.post('http://localhost:5000/query', {
        question: q,
        user: username
      })
      console.log(response.data.response.choices[0])
    const ai_bullshit_reply = response.data.response.choices[0].text
    const startIndex = ai_bullshit_reply.indexOf("### Response:");

    // Take the substring after "A: [/INST]"
    const extractedText = ai_bullshit_reply.substring(startIndex + 13)

    console.log(extractedText)
    return extractedText
}


export const otherCommands = {
    async raffle(ctx) {
        try {
            if (!ctx) return;
            const userId = ctx.from.id

            // Get the message text
            const message = ctx.message.text
            return await ctx.reply('no active raffles atm')

            // Extract the input after "/raffle" and trim it
            const match = message.replace(/^\/raffle\s*/, '').trim();
            let addy = '';

            if (match) {
                console.log(match);

                // Validate the Ethereum address
                if (!match.startsWith('0x') || match.length !== 42) {
                    return await ctx.reply('that eth address is not correctly formatted');
                }

                // Assign the validated Ethereum address
                addy = match;
            } else {
                return await ctx.reply('you need to format the ETH address correctly.');
            }
            let tehUser = await retardTracker.getUser(ctx, userId)

            // Gather user information
            const userInfo = {
                id: ctx.from.id,
                username: ctx.from.username || null,
                first_name: ctx.from.first_name || null,
                last_name: ctx.from.last_name || null,
                raffleName: 'hoba bday raffle',
                timestamp: new Date().toISOString(),
                eth_address: addy,
            };
            if(tehUser.hasOwnProperty('raffle') && tehUser.raffle.raffleName === 'hoba bday raffle') return await ctx.reply(`🎟️ you already entered the ${userInfo.raffleName}!\ncheck back here to know the results soon.`)

            // Update and save raffle data
            await retardTracker.saveRaffleData(ctx.from.id, userInfo);

            // Notify the user
            await ctx.reply(
                '🎟️ you entered the $hoba birthday raffle!\ncheck back in the channel soon and bitch at mods to know who won!'
            );
        } catch (e) {
            console.log(e, 'some error in raffle')
            return await ctx.reply('some error happened while processing your raffle shit')
        }
    },
    async myentry(ctx) {
        try {
            if(!ctx) return console.log('no ctx in myentry')
            const userId = ctx.from.id
            let user = await retardTracker.getUser(ctx, userId)
            if(!user.hasOwnProperty('raffle')) return await ctx.reply('you are not entered into a raffle')
            if(user.hasOwnProperty('raffle')) {
                let message = `🎟️🎲🤞${user.first_name} entered into the ${user.raffle.raffleName} at ${user.raffle.timestamp}`
                return await ctx.reply(message)
            }
        } catch(e) {
            console.log(e, 'some error during myentry')
        }
    },
    async biteballs(ctx) {
        const username = ctx.message.from.first_name
        try {
            const insult = await axios.get('https://insult.mattbas.org/api/insult')
        
            let insult_display = insult.data.toLowerCase()
            let message = `stfu ${username} ${insult_display}`
            await ctx.replyWithMarkdown(message, {parse_mode: "HTML", reply_to_message_id: ctx.message.message_id})
        } catch(err) {
            console.log(err)
            await ctx.reply(`uhh stfu ${username}`)
        }
    },
    async askbadger(ctx) {
        const username = ctx.message.from.first_name
        try {
            const commandText = ctx.message.text.replace('/askbadger', '').trim();
            if(commandText.length < 9) return
            const aiResponse = await sendToApi(commandText, username)
            await ctx.replyWithMarkdown(aiResponse, {parse_mode: "HTML", reply_to_message_id: ctx.message.message_id})
        } catch(err) {
            console.log(err)
            await ctx.reply(`uhh stfu ${username}`)
        }
    },
    async number(ctx) {
        if(ctx.session.gameLive === true || gameLogic.gameRunningGetter()) {
            ctx.reply(`you already have a game running.`)
        } else {
            const randomNumber = Math.floor(Math.random() * 100) + 1
            ctx.session.randomNumber = randomNumber
            ctx.session.attempts = 1
            ctx.session.gameLive = true
            gameLogic.setGameRunning(true)
            console.log(`starting numbers game: ${ctx.message.from.username} attempt ${ctx.session.attempts} guessing the number ${randomNumber}`)
            ctx.reply('badger thinks of a number between 1 and 100... which is it?')
        }
    },
    async hangman(ctx) {
        try {
            if(ctx.session.gameLive === true || gameLogic.gameRunningGetter()) {
                ctx.reply(`there is a game running.`)
            } else {
                ctx.session.game = {}
                const userId = ctx.from.id
                const theWord = await gameLogic.pickRandomWord()
                const replacedString = theWord.replace(/[^ ]/g, '?')
                ctx.session.game = {
                    wordToGuess: `${theWord}`,
                    guessedWord: replacedString,
                    attempts: 0,
                    maxAttempts: 6,
                    get attemptsLeft() { return this.maxAttempts - this.attempts; },
                    guessedLetters: []
                }
                ctx.session.gameLive = true
                gameLogic.setGameRunning(true)
                console.log(`starting hangbadger for ${ctx.from.username} the word is: ${ctx.session.game.wordToGuess}`)
                await ctx.reply(`*${ctx.from.first_name}*\n\n${gameLogic.hangmanStages[0]}\n\nwelcome to hangbadger, bitch! guess a letter or the whole word. type quit to quit.\n\n THE WORD TO GUESS: ${ctx.session.game.guessedWord}`)
            }
        } catch (e) {
            console.log(e, 'error starting hangman')
        }
    },
    async trivia(ctx) {
        try {
            if(ctx.session.gameLive === true || gameLogic.gameRunningGetter()) {
                ctx.reply(`there is a game running.`)
                return
            }
            delete ctx.session.game
            let fetchQs = await axios.get('https://opentdb.com/api.php?amount=2&category=27&difficulty=medium')
            fetchQs = fetchQs.data.results
            ctx.session.game = {
                trivia: 0,
                questions: fetchQs
            }
            ctx.session.gameLive = true
            await gameLogic.setGameRunning(true)
            fetchQs[0].question = he.decode(fetchQs[0].question)
            console.log(`starting trivia for ${ctx.from.username}, ${fetchQs[0].question}`)

            if(fetchQs[0].type === "multiple") {

                const answerArray = await gameLogic.makeMultipleChoiceQuestion(fetchQs[0])
                ctx.session.game.question = fetchQs[0].question
                ctx.session.game.correct_answer = answerArray.correct_answer
                await ctx.reply(`${ctx.from.first_name} wants to play shitty animal trivia\n\n${fetchQs[0].question}\n\n${answerArray.answerString}`)
            } else {
                ctx.session.game.question = fetchQs[0].question
                ctx.session.game.correct_answer = fetchQs[0].correct_answer
                await ctx.reply(`${ctx.from.first_name} wants to play shitty animal trivia\n\n${fetchQs[0].question}\n\nTRUE or FALSE?`)
            }
        } catch(e) {
            console.log(e, 'trivia error')
            delete ctx.session.game
            ctx.session.gameLive = false
            await gameLogic.setGameRunning(false)
            ctx.reply(`*error with retard trivia API*`)
        }
    }
}
