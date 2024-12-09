import {faker} from '@faker-js/faker'

function getRandomInt(min, max) {
    return Math.floor(Math.random() * 101);
}


export const checkCommands = {
    async checklevel(ctx) {
        const username = ctx.message.from.first_name;
        const percent = getRandomInt(0, 100);
        const profession = faker.person.jobTitle();
    
        ctx.reply(`@${username} is ${percent}% Gay ${profession}!`, {parse_mode: "HTML", reply_to_message_id: ctx.message.message_id});
    },
    async checksquirrellevel(ctx) {
        const username = ctx.message.from.username;

        // generate a random clown level (0-100)
        const clownLevel = getRandomInt();
        const clownLevel2 = getRandomInt();
        const smallNumber = clownLevel/233;

        const customMessages = {
            'Squirrelytickerbitcoin': `is ${clownLevel}% squirrel and his nut storage is ${clownLevel2}% full!`,
        };

        // check if the user triggering the command has a custom message
        if (username in customMessages) {
        // send the custom message
            ctx.reply(`@${username} ${customMessages[username]}`, {parse_mode: "HTML", reply_to_message_id: ctx.message.message_id});
        } else {
            // send the default message
            ctx.reply(`@${username} is like ${smallNumber}% squirrel... it's like barely`, {parse_mode: "HTML", reply_to_message_id: ctx.message.message_id});
        }
    },
    async checkretardlevel(ctx) {
        // Get the username of the user who triggered the command
        const username = ctx.message.from.username;

        // Generate a random clown level (0-100)
        let clownLevel = getRandomInt()

        const customMessages = {
            'angrymachines': `is cool!`,
            'oldmanwithcoin': `is like ${clownLevel + 44}% retard!`,
            'Dennis_56': `is like ${clownLevel + 444}% retard!`
        };

        const val2 = (100 - clownLevel)

        // Check if the user triggering the command has a custom message
        if (username in customMessages) {
        // Send the custom message
            ctx.reply(`@${ctx.message.from.first_name} ${customMessages[username]}`, {parse_mode: "HTML", reply_to_message_id: ctx.message.message_id});
        } else {
            // Send the default message
            ctx.reply(`@${ctx.message.from.first_name} is like ${clownLevel}% retarded.`, {parse_mode: "HTML", reply_to_message_id: ctx.message.message_id});
        }
    },
    async checkcoollevel(ctx) {
        // Get the username of the user who triggered the command
        const username = ctx.message.from.username;

        // Generate a random clown level (0-100)
        let clownLevel = getRandomInt()
        let clownLevel2 = getRandomInt()

        const customMessages = {
            'angrymachines': `is retarded!`,
            'passportbitcoin': `try the clownlevel command instead`
        }
        // Check if the user triggering the command has a custom message
        if (username in customMessages) {
        // Send the custom message
            ctx.reply(`@${username} ${customMessages[username]}`, {parse_mode: "HTML"});
        } else {
            // Send the default message
            ctx.reply(`@${username} is like ${clownLevel}% cool. You absolute bum.`, {parse_mode: "HTML"});
        }
    },
    async checkboblevel(ctx) {
        // Get the username of the user who triggered the command
        const username = ctx.message.from.username;

        // Generate a random clown level (0-100)
        let clownLevel = getRandomInt()
        const val2 = (100 - clownLevel)

        const customMessages = {
            'Bobbiesdobbies': `is 50% Bob and his 50% Dobbs!`,
        };
        // Check if the user triggering the command has a custom message
        if (username in customMessages) {
            // Send the custom message
            ctx.reply(`@${ctx.message.from.first_name} ${customMessages[username]}`, {parse_mode: "HTML"});
        } else {
            // Send the default message
            ctx.reply(`@${ctx.message.from.first_name} is like ${clownLevel}% Bob and ${val2}% Dobbs!`, {parse_mode: "HTML"});
        }
    },
    checkclownlevel(ctx) {
        // Get the username of the user who triggered the command
        const username = ctx.message.from.username;

        // Generate a random clown level (0-100)
        const clownLevel = getRandomInt()
        const clownLevel2 = getRandomInt()

        const customMessages = {
            'Dumpstar93': `is the dev and his h4xX0r level today is ${clownLevel}%! also @passportbitoin is slowly gaining devs trust and currently has ${clownLevel2}% trust. `,
            'Snoosir': `is actually the Sprope and his level of holiness today is ${clownLevel}% !`,
            'passportbitcoin': `is ${clownLevel}% clown! his portfolio is ${clownLevel2}% full of ticker $HOBA.`,
            'vampdotexe': `is actually a fockin vampire and her bloodhunger levels today are ${clownLevel}%`,
            'oldmanwithcoin': `fuck you bitch`,
            'Squirrelytickerbitcoin': `is the travelling samaritan and his blood THC levels are currently ${clownLevel}%!`,
            'Bostwik': `visits the stockholm archipelago once in a while so he is actually ${clownLevel}% swedish now!`,
            'Datdudemate': `is ${clownLevel}% serbian clown!`,
            'CaptainCloud': `is a mighty seafarer who has a captain level of ${clownLevel}% and the skies above him are ${clownLevel2}% cloudy!`,
            'tdmreporter': `is loading the daily meme which today has a funny level of ${clownLevel}%`,
            'rocobaroc': `is ${clownLevel}% annoying today`,
            'rocketgiovanni': `is rocketing towards the moon and has ${clownLevel}000 kilometers left to go`,
            'Bobbiesdobbies': `is a li'l tiny wobby nobby that's ${clownLevel}% hobbly and ${clownLevel2}% bobbly!`
            // add more usernames and custom messages as needed
        };

        // Check if the user triggering the command has a custom message
        if (username in customMessages) {
        // Send the custom message
            ctx.reply(`@${username} ${customMessages[username]}`, {parse_mode: "HTML", reply_to_message_id: ctx.message.message_id});
        } else {
        // Send the default message
            ctx.reply(`@${username} is ${clownLevel}% clown! 🤡`, {parse_mode: "HTML", reply_to_message_id: ctx.message.message_id});
        }
    },
    async checkrosslevel(ctx) {
        const username = ctx.message.from.username
        if (username === "angrymachines") {
            await ctx.reply(`holy fucking shit its ross`, {parse_mode: "HTML", reply_to_message_id: ctx.message.message_id})
        } else {
            await ctx.reply(`${username} is like 0% ross`, {parse_mode: "HTML", reply_to_message_id: ctx.message.message_id})
        }
    },
    async checksnakelevel(ctx) {
        const username = ctx.message.from.username
        await ctx.reply(`ssssssstfu`, {parse_mode: "HTML", reply_to_message_id: ctx.message.message_id})
    },
    async checkcarelevel(ctx) {
        const username = ctx.message.from.first_name
        await ctx.reply(`stfu ${username} idgaf`, {parse_mode: "HTML", reply_to_message_id: ctx.message.message_id})    
    },
    async checkbadgerlevel(ctx) {
        const username = ctx.message.from.username;
        let howGay = getRandomInt()
        let badger = (100 - howGay)
        await ctx.reply(`@${username} is ${badger}% badger! And ${howGay}% gay!`, {parse_mode: "HTML", reply_to_message_id: ctx.message.message_id});
    },
    async checkmanlevel(ctx) {
        const username = ctx.from.username
        let random = Math.floor(Math.random() * 10)
        await ctx.replyWithPhoto({ source: `manlevel_assets/${random}.jpg` }, {caption: `${ctx.from.first_name} is this kind of man ^`,reply_to_message_id: ctx.message.message_id})
    },
    async checklibtardlevel(ctx) {
        const username = ctx.message.from.username
        const name = ctx.message.from.first_name
        const clownLevel = getRandomInt()
        const clownLevel2 = getRandomInt() + 166
        if (username === "KatieCans" || username == "oldmanwithcoin") {
            await ctx.reply(`${name} is ${clownLevel2}% libtard - Biden voter confirmed`, {parse_mode: "HTML", reply_to_message_id: ctx.message.message_id})
        } else {
            await ctx.reply(`${name} is like ${clownLevel}% libtard`, {parse_mode: "HTML", reply_to_message_id: ctx.message.message_id})
        }
    },
    async checkautismlevel(ctx) {
        const username = ctx.message.from.username
        const name = ctx.message.from.first_name
        const clownLevel = getRandomInt()
        let theMessage = `${name} is like ${clownLevel}% autistic. `
        if (clownLevel > 90) {
            theMessage += "Maximum Strength Furbee Collector Energy!"
            await ctx.reply(theMessage, {parse_mode: "HTML", reply_to_message_id: ctx.message.message_id})
        } else if (clownLevel > 80) {
            theMessage += `It's a nonverbal!`
            await ctx.reply(theMessage, {parse_mode: "HTML", reply_to_message_id: ctx.message.message_id})
        } else if (clownLevel > 60) {
            theMessage += `Almost qualifies for government aid!`
            await ctx.reply(theMessage, {parse_mode: "HTML", reply_to_message_id: ctx.message.message_id})
        } else if (clownLevel > 40) {
            theMessage += `Most people don't know that you are normal.`
            await ctx.reply(theMessage, {parse_mode: "HTML", reply_to_message_id: ctx.message.message_id})
        } else if (clownLevel > 20 ) {
            theMessage += `Get back to work in your cubicle 9-5, ${name}.`
            await ctx.reply(theMessage, {parse_mode: "HTML", reply_to_message_id: ctx.message.message_id})
        } else if (clownLevel > 10) {
            theMessage += `Impressive statline, broskiff. What the fuck are you doing in a Honey Badger themed crypto telegram, dawg?`
            await ctx.reply(theMessage, {parse_mode: "HTML", reply_to_message_id: ctx.message.message_id})
        } else if (clownLevel < 10) {
            theMessage += `Welcome, esteemed investor. How can we convince you to purchase more $HOBA and become part of our team? J/K GTFO FAGGOT NWORD`
            await ctx.reply(theMessage, {parse_mode: "HTML", reply_to_message_id: ctx.message.message_id})
        }
    },
        async checkchromosomelevel(ctx) {
        const username = ctx.message.from.username
        const name = ctx.message.from.first_name
        let clownLevel = Math.floor(Math.random() * (25 - 19 + 1)) + 19 //makes a number from 19 to 25
        let theMessage = `I calculated that ${name} has ${clownLevel} chromosomes. `
        if (clownLevel === 19) {
            theMessage += "That's barely enough to breathe on your own. You don't know where you are, do you?"
            await ctx.reply(theMessage, {parse_mode: "HTML", reply_to_message_id: ctx.message.message_id})
        } else if (clownLevel === 20) {
            theMessage += `DO YOU UNDERSTAND WHAT NUMBERS ARE? PURCHASE MORE $HOBA`
            await ctx.reply(theMessage, {parse_mode: "HTML", reply_to_message_id: ctx.message.message_id})
        } else if (clownLevel === 21) {
            theMessage += `A classic chromo-bum. Collect some more and maybe you can skip the wheelchair.`
            await ctx.reply(theMessage, {parse_mode: "HTML", reply_to_message_id: ctx.message.message_id})
        } else if (clownLevel === 22) {
            theMessage += `This is like... almost normal. But you're not, retard. Buy more $HOBA`
            await ctx.reply(theMessage, {parse_mode: "HTML", reply_to_message_id: ctx.message.message_id})
        } else if (clownLevel === 23 ) {
            theMessage += `Get your normie ass out of here, ${name}.`
            await ctx.reply(theMessage, {parse_mode: "HTML", reply_to_message_id: ctx.message.message_id})
        } else if (clownLevel === 24) {
            theMessage += `Congrats you have Down's syndrome. Meet all your best friends here in the $HOBA TG! Everyone has the same affliction.`
            await ctx.reply(theMessage, {parse_mode: "HTML", reply_to_message_id: ctx.message.message_id})
        } else if (clownLevel === 25) {
            theMessage += `Double Down syndrome? Holy shit, mate. That means double government aid - which leaves you more room to purchase $HOBA.`
            await ctx.reply(theMessage, {parse_mode: "HTML", reply_to_message_id: ctx.message.message_id})
        }
    }
}
