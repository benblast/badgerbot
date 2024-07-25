import dotenv from 'dotenv';
dotenv.config();
import axios from 'axios'
import fs from 'fs'
import {gameLogic} from './gameLogic.js'
import {createCanvas, loadImage} from 'canvas'



async function downloadImage(filePath) {
    const fileUrl = `https://api.telegram.org/file/bot${process.env.token}/${filePath}`;
    const response = await axios({
        url: fileUrl,
        method: 'GET',
        responseType: 'stream'
    })

    const writer = fs.createWriteStream('downloaded_image.jpg');

    response.data.pipe(writer)

    await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
    });

    console.log('Image downloaded successfully.');
}

async function cleanUp() {
    try {
        // Delete the file synchronously
        fs.unlinkSync('mergedOutput.png');
        fs.unlinkSync('downloaded_image.jpg');
        console.log('File deleted successfully');
      } catch (err) {
        console.error('Failed to delete the file:', err);
      }
}

async function mergeImages(bg, overlay) {
    // Load the background and overlay images
    const backgroundImage = await loadImage(bg); // Load the background image
    const overlayImage = await loadImage(overlay); // Load the image to overlay

    // Get the dimensions of the background image
    const width = backgroundImage.width;
    const height = backgroundImage.height;

    // Create a canvas with the same dimensions as the background image
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Draw the background image on the canvas
    ctx.drawImage(backgroundImage, 0, 0, width, height);

    // Draw the overlay image scaled to the background image's dimensions
    ctx.drawImage(overlayImage, 0, 0, width, height); // This scales the overlay image


    // Convert the canvas to a Buffer
    const buffer = canvas.toBuffer('image/png');

    // Save the buffer to a file asynchronously
    fs.promises.writeFile('mergedOutput.png', buffer).then(() => {
        console.log('Merged image saved successfully!');
    }).catch(err => {
        console.error('Failed to save the merged image:', err);
    });
}

export const memeBot = {
    async memePhoto(ctx) {
        try {
            // Check if the photo message has a caption and if it matches '/meme'
            if (ctx.message.caption && ctx.message.caption.toLowerCase().includes('/meme')) {
                // Get the file ID of the photo
                const fileId = ctx.message.photo[ctx.message.photo.length - 1].file_id;

                //let filePath = await axios.get(`https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`)
                //console.log('FUCKING FILEPATH FUCK GOUY TELEGRAM', filePath)

                const downloadUrl = `https://api.telegram.org/bot${process.env.token}/getFile?file_id=${fileId}`
                const res = await axios.get(downloadUrl)
                const filePath = res.data.result.file_path;
                await downloadImage(filePath)

                await mergeImages('downloaded_image.jpg', 'tv_logo.png')

                //await sharp(layers[0].input).composite(layers).toFile('./assets/the_meme_to_send.png')

                // You can then process the photo as needed. For simplicity, this example just echoes the photo back.
                await ctx.replyWithPhoto({ source: 'mergedOutput.png' }, {caption: `nice meme ${ctx.from.first_name}`,reply_to_message_id: ctx.message.message_id})

                await cleanUp()
            }
        } catch(e) {
            ctx.reply('uhh smth went wrong')
        }
    },
    async memeReply(ctx) {
        try {
            if (ctx.message.text.trim() === '/meme' && ctx.message.reply_to_message && ctx.message.reply_to_message.photo) {
                // Get the largest available photo size
                const photo = ctx.message.reply_to_message.photo[ctx.message.reply_to_message.photo.length - 1];
                
                // Extract the file_id of the photo
                const fileId = photo.file_id;
                const downloadUrl = `https://api.telegram.org/bot${process.env.token}/getFile?file_id=${fileId}`
                const res = await axios.get(downloadUrl)
                const filePath = res.data.result.file_path
                await downloadImage(filePath)
                await mergeImages('downloaded_image.jpg', 'tv_logo.png')
                await ctx.replyWithPhoto({ source: 'mergedOutput.png' }, {caption: `nice meme ${ctx.from.first_name}`,reply_to_message_id: ctx.message.message_id})
                await cleanUp();
            }
    
            if(gameLogic.getGameTimer() != 0 && Date.now() - gameLogic.getGameTimer() >= 2*60*1000 && ctx.session.gameLive) {
                gameLogic.setGameRunning(false)
                ctx.session.gameLive = false
                ctx.reply(`two minute timer over. ending hangman.`)
            }
    
            //if .game exists on the session object, a hangman game is ongoing
            //console.log(ctx.session)
            if(ctx.session?.game?.wordToGuess) {
                const twoMinsInMilli = 2 * 60 * 1000
                const timestamp = gameLogic.getGameTimer()
                //check if the game timer is passed 2mins or if the user typed quit
                if(Date.now() - timestamp >= twoMinsInMilli || ctx.message.text.toLowerCase() === "quit") {
                    if(ctx.message.text.toLowerCase() === "quit") {
                        ctx.reply(`ALRIGHT YA BUM.\n\n the word was ${ctx.session.game.wordToGuess.toUpperCase()} \n\nending game`)
                    } else {
                        ctx.reply(`YOUR TWO MINUTES ARE UP, YA SLOW BUM.\n\n the word was ${ctx.session.game.wordToGuess.toUpperCase()} \n\nending game`)
                    }
                    delete ctx.session.game
                    ctx.session.gameLive = false
                    gameLogic.setGameRunning(false)
                } else {
                    //get some of the data needed from the session variables
                    const userId = ctx.from.id
                    const newGuess = ctx.message.text
                    const theWord = ctx.session.game.wordToGuess
                    const theGuessedWord = ctx.session.game.guessedWord
    
                    //sanitize the user's guess from retardation
                    const sanitizedGuess = await gameLogic.sanitizeGuess(newGuess)
                    console.log(`${theWord} - ${theGuessedWord} - ${sanitizedGuess}`)
                    if(sanitizedGuess && sanitizedGuess.length === 0) {
                        ctx.reply('guess a letter or the word, broskiff')
                    }
    
                    if(sanitizedGuess.length === 1) {
                        //check if already guessed the letter
                        if(ctx.session.game.guessedLetters.includes(sanitizedGuess)) {
                            const guessedLetters = ctx.session.game.guessedLetters.join(', ')
                            ctx.reply(`*${ctx.from.first_name} playing hangman*\n${gameLogic.hangmanStages[ctx.session.game.attempts]}\n\nyou already guessed that letter.\n\nyou have guessed the letters ${guessedLetters.toUpperCase()}`)
                        } else {
                            //push new letter guess into guessedLetters to keep track of what has been guessed lol
                            ctx.session.game.guessedLetters.push(sanitizedGuess)
                            const correctBool = theWord.includes(sanitizedGuess)
                            if(correctBool) {
                                const newGuessedWord = await gameLogic.updateGuessedWord(theWord, theGuessedWord, sanitizedGuess)
                                ctx.session.game.guessedWord = newGuessedWord
                                if (newGuessedWord === theWord) {
                                    await ctx.reply(`GZ YOU WON! you beat hangbadger and guessed ${theWord.toUpperCase()} with ${ctx.session.game.attempts} errors`)
                                    delete ctx.session.game
                                    ctx.session.gameLive = false
                                    await gameLogic.setGameRunning(false)
                                } else {
                                    const guessedLetters = ctx.session.game.guessedLetters.join(', ')
                                    await ctx.reply(`*${ctx.from.first_name} playing hangman*\n${gameLogic.hangmanStages[ctx.session.game.attempts]}\n\n${sanitizedGuess.toUpperCase()} is CORRECT!!!\n\n${newGuessedWord.toUpperCase()}\n\nnext guess?\n\nyou have guessed the letters ${guessedLetters.toUpperCase()}`)
                                }
        
                            } else {
                                ctx.session.game.attempts++
                                if(ctx.session.game.attempts >= ctx.session.game.maxAttempts) {
                                    await ctx.reply(`*${ctx.from.first_name} playing hangman*\n${gameLogic.hangmanStages[ctx.session.game.attempts]}\n\ni was looking for: '${ctx.session.game.wordToGuess.toUpperCase()}'\n\nLOSER. game ending.`)
                                    delete ctx.session.game
                                    ctx.session.gameLive = false
                                    await gameLogic.setGameRunning(false)
                                } else {
                                    const guessedLetters = ctx.session.game.guessedLetters.join(', ')
                                    await ctx.reply(`*${ctx.from.first_name} playing hangman*\n${gameLogic.hangmanStages[ctx.session.game.attempts]}\n\nwrong. you have ${ctx.session.game.attemptsLeft} attempts left.\n\n${ctx.session.game.guessedWord.toUpperCase()}\n\nyou have guessed the letters ${guessedLetters.toUpperCase()}`)
                                }
                            }
                        }
                    }
    
                    if(sanitizedGuess.length > 1) {
                        if (sanitizedGuess === theWord) {
                            ctx.reply(`GZ YOU WON! you beat hangbadger and guessed ${theWord.toUpperCase()} with ${ctx.session.game.attempts} errors`)
                            delete ctx.session.game
                            ctx.session.gameLive = false
                            await gameLogic.setGameRunning(false)
                        } else {
                            ctx.session.game.attempts++
                            if(ctx.session.game.attempts >= ctx.session.game.maxAttempts) {
                                await ctx.reply(`*${ctx.from.first_name} playing hangman*\n${gameLogic.hangmanStages[ctx.session.game.attempts]}\n\ni was looking for: '${ctx.session.game.wordToGuess.toUpperCase()}'\n\nLOSER. game ending.`)
                                delete ctx.session.game
                                ctx.session.gameLive = false
                                await gameLogic.setGameRunning(false)
                            } else {
                                const guessedLetters = ctx.session.game.guessedLetters.join(', ')
                                await ctx.reply(`*${ctx.from.first_name} playing hangman*\n${gameLogic.hangmanStages[ctx.session.game.attempts]}\n\nwrong. you have ${ctx.session.game.attemptsLeft} attempts left.\n\n${ctx.session.game.guessedWord.toUpperCase()}\n\nyou have guessed the letters ${guessedLetters.toUpperCase()})`)
                            }
                        }
                    }
                }
            }
    
    
            //logic for numbersgame
            if(ctx.session?.randomNumber) {
                try {
                    const guess = parseInt(ctx.message.text);
                    const randomNumber = ctx.session?.randomNumber;
                    const attempts = ctx.session?.attempts 
                    console.log('Numbers Game:\n', ctx.from.username, guess, ctx.session?.randomNumber, ctx.session?.attempts)
                    if (guess && guess >= 1 && guess <= 100 && !isNaN(guess) && attempts <= 15) {
                        ctx.session.attempts++
                
                        if (guess === randomNumber) {
                            ctx.reply(`OHHH MOI GAWWWD MAYTE!!!!1 you guessed the number ${randomNumber} in ${attempts} attempts!!!`);
                            delete ctx.session.randomNumber
                            delete ctx.session.attempts
                            delete ctx.session.kill
                            ctx.session.gameLive = false
                            gameLogic.setGameRunning(false)
                        } else if (guess < randomNumber) {
                            ctx.reply('too low bitch!');
                        } else {
                            ctx.reply('too high!');
                        }
                    } else {
                        
                        if(ctx.session.kill || ctx.session.attempts >= 15) {
                            ctx.reply('quitting the number game.')
                            delete ctx.session.kill
                            delete ctx.session.randomNumber
                            delete ctx.session.attempts
                            ctx.session.gameLive = false
                            gameLogic.setGameRunning(false)
                        } else {
                            ctx.session.kill = true
                            ctx.reply('please enter a valid number you stupid sonofabitch. one more time and we quit this game.')
                        }
                    }
                } catch(e) {
                    console.log(e)
                }
    
            }
    
            //logic for trivia game
            if(ctx.session?.game?.correct_answer && gameLogic.gameRunningGetter()) {
                let message = ctx.message.text
                message = message.toLowerCase()
                console.log(message, ctx.session.game.correct_answer)
                let correctAnswerString = ctx.session.game.correct_answer.toString()
                correctAnswerString = correctAnswerString.toLowerCase()
                if(message === correctAnswerString) {
                    ctx.reply(`wow you guessed correctly well done whoa so smart hooray`)
                    delete ctx.session.game
                    ctx.session.gameLive = false
                    await gameLogic.setGameRunning(false)
                } else {
                    ctx.reply(`the correct answer was ${ctx.session.game.correct_answer.toUpperCase()}.\n\nyou are a fool.`)
                    delete ctx.session.game
                    ctx.session.gameLive = false
                    await gameLogic.setGameRunning(false)
                }
            }
        } catch(e) {
            ctx.reply('uhh smth went wrong')
        }

    }
}


