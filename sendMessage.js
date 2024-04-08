import axios from 'axios';
import readline from 'readline';
import dotenv from 'dotenv';
dotenv.config();

// Function to send a message to the Telegram bot
async function sendMessage(message) {
    const botToken = process.env.token;
    const chatId = '-1002143402114';

    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const payload = {
        chat_id: chatId,
        text: message
    };

    await axios.post(url, payload);
}

// function to hook into commandline and prompt for a message and send it to the tg bot
async function sendMessages() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    let continueSending = true;

    while (continueSending) {
        // prompt for a message from the command line
        const message = await new Promise((resolve) => {
            rl.question('what you wanna say (or type "exit" to quit): ', (message) => {
                resolve(message);
            });
        });

        // Check if the user wants to exit
        if (message.toLowerCase() === 'exit') {
            continueSending = false;
        } else {
            try {
                // Send the message to the Telegram bot
                await sendMessage(message);
                console.log('message sent!');
            } catch (error) {
                console.error('error:', error);
            }
        }
    }

    rl.close();
}


sendMessages();
