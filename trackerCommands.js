import { retardTracker } from './retardTracker.js'

async function calculateRemainingTime(timeSinceClaim) {
	let remainingTimeInMs = 86400000 - timeSinceClaim
    // Calculate hours, minutes, and seconds from milliseconds
    const hours = Math.floor(remainingTimeInMs / 3600000); // 1 hour = 3600000 ms
    const minutes = Math.floor((remainingTimeInMs % 3600000) / 60000); // 1 minute = 60000 ms
    const seconds = Math.floor((remainingTimeInMs % 60000) / 1000); // 1 second = 1000 ms

    // Return a formatted string
    return `${hours}h${minutes}min${seconds}s`;
}

export const trackerCommands = {
	async gameguide(ctx) {
		try {
			let message = "🦡<b>badgering retard rpg guide</b>🦡\n"
			message += `<i>a retarded game built by retards for retards where you collect XP and juicy loot by chatting, tweeting and killing monsters in a radical text-based rpg</i>\n\n`
			message += `⚔️ fight a random monster with <b>/monsterhunt</b>\n`
			message += `🎒 collect loot and equip items via <b>/inventory</b>\n\n`
			message += `⚠️ <i>be careful because you can lose xp too!</i>\n\n`
			message += `🔮 <i>come back every day to collect free xp using /dailyxp</i>\n`
			message += `⚗️ <i>use /dailyloot to get a free consumable item every 24h!</i>\n\n`
			message += `📜 <b>/gamecommands</b> to find all commands\n\n`
			message += `🤜 <i>challenge another user with /fight</i>🤛\n`
			message += `🤜 <i>(both of you will lose XP, there is no winner in fighting)</i>🤛`
			await ctx.replyWithPhoto({ source: 'assets/other/hoba_king.png' },
		    {
		        caption: message, 
		        parse_mode: 'HTML',
		    })
		} catch (e) {
			console.log(e, 'smth wrong with gameguide')
		}
	},
	async mystats(ctx) {
		try {
			const userId = ctx.from.id
  			const user = await retardTracker.getXP(userId)
  			const message = `📈 <b>${user.first_name}'s stats</b> 📈\n\n✨ <b>total XP:</b> ${user.xp}\n🏆 <b>level:</b> ${user.level}\n⭐ <b>dumpstars:</b> ${user.dumpstars}\n\ndaily xp combo: ${user.quests.dailyxp.combo}`
  			await ctx.reply(message, {reply_to_message_id: ctx.message.message_id, parse_mode:'HTML'})
		} catch(e) {
			console.log(e, 'some error during myxp execution')
		}
	},
	async dailyxp(ctx) {
		try{
			const userId = ctx.from.id
			if(!userId) return await ctx.reply('cant find userId')
			const { user, doubleXp } = await retardTracker.dailyXP(ctx, userId)
			let doubleXpMessage = ""
			if(user && user.hasOwnProperty('xp')) { //if this exists then it was successful - otherwise we will receive back a unix timestamp that tells us the time left
				if(user.quests.dailyxp.combo > 0) {
					console.log('daily xp added by', userId, user, Date.now())
					if(doubleXp) doubleXpMessage = `\n\n🔥you used a consumable that <b>DOUBLED</b> it to <i>${((user.quests.dailyxp.combo*5)+50)*2}</i>XP!🔥`
					await ctx.reply(`🔮${user.first_name} claimed their daily 50xp plus a bonus <b>${user.quests.dailyxp.combo * 5}xp</b> for checking back <i>${user.quests.dailyxp.combo}</i> days in a row!${doubleXpMessage}`, {reply_to_message_id: ctx.message.message_id,parse_mode: 'HTML'})
				} else {
					if(doubleXp) doubleXpMessage = `\n\n🔥you used a consumable that <b>DOUBLED</b> it to <i>${50*2}</i>XP!🔥`
					await ctx.reply(`🔮${user.first_name} just claimed their daily 50xp bonus!${doubleXpMessage}`, {reply_to_message_id: ctx.message.message_id,parse_mode: 'HTML'})									
				}
			} else {
				console.log(user.first_name, 'dailyxp denied', userId)
				let timeLeft = await calculateRemainingTime(user) //calculate time left (in this scenario user actually contains the timedifference)
				let reply = `you can collect your free daily xp in ${timeLeft}`
				return await ctx.reply(reply, { reply_to_message_id: ctx.message.message_id, parse_mode: 'HTML'})
			}
		} catch(e) {
			console.log(e, 'some error during dailyxp')
		}
	},
	async dailyloot(ctx) {
		try{
			const userId = ctx.from.id
			if(!userId) return await ctx.reply('cant find userId')
			const user = await retardTracker.dailyLoot(ctx, userId)

		} catch(e) {
			console.log(e, 'some error during dailyxp')
		}
	},
	async leaderboard(ctx) {
	    try {
	        const leaderboard = await retardTracker.getLeaderboard();

	        // Set the maximum row width (29 characters)
	        const maxRowWidth = 29; // Maximum width for a row (including separators)

	        // Limit the number of users to display
	        const maxUsers = 10;
	        const leaderboardSubset = leaderboard.slice(0, maxUsers);

	        // Set fixed widths for columns based on the available space (29 characters total)
	        const usernameWidth = 20;  // Max username length (increased to 20 characters)
	        const xpWidth = 10;        // Max XP (10 characters to fit 1,000,000 XP with commas)
	        const levelWidth = 3;      // Max level (3 characters)
	        const dumpstarsWidth = 3;  // Max dumpstars (3 characters)

	        // Function to format XP with commas
	        const formatXP = (xp) => {
	            return new Intl.NumberFormat().format(xp);
	        };

	        // Create the header row (adjusting padding for proper alignment)
	        const header = `user${' '.repeat(usernameWidth - 4)}|xp${' '.repeat(xpWidth - 2)}|lvl|dumpStars`;

	        // Create the separator row (based on total row width)
	        const separator = '─'.repeat(42);

	        // Create the data rows
	        const rows = leaderboardSubset.map(({ username, first_name, xp, level, dumpstars }) => {
	            // Truncate the username if it's longer than usernameWidth
	            const name = (username || first_name || 'Unknown').slice(0, usernameWidth).padEnd(usernameWidth, ' ');
	            const xpFormatted = formatXP(xp).padStart(xpWidth, ' ');
	            const levelFormatted = level.toString().padStart(levelWidth, ' ');
	            const dumpstarsFormatted = dumpstars.toString().padStart(dumpstarsWidth, ' ');

	            return `${name}|${xpFormatted}|${levelFormatted}|${dumpstarsFormatted}`;
	        }).join('\n');

	        // combine all parts to form the complete leaderboard message (with the title outside the backticks)
	        const message = `🏆 Badgering Retard Leaderboards 🏆\n\`\`\`\n${header}\n${separator}\n${rows}\n${separator}\`\`\``;

	        // Ensure the message length does not exceed the 4096 character limit
	        if (message.length > 4096) {
	            await ctx.reply("Leaderboard is too long to display in one message. Showing the top 10 users:", {reply_to_message_id: ctx.message.message_id, parse_mode:'HTML'})
	            await ctx.reply(message, {reply_to_message_id: ctx.message.message_id, parse_mode:'HTML'})
	        } else {
	            // Send the leaderboard message
	            ctx.reply(message, { reply_to_message_id: ctx.message.message_id, parse_mode: 'MarkdownV2' });
	        }

	    } catch (e) {
	        console.log(e, 'Some error during leaderboard execution');
	    }
	},
	async dumpstars(ctx) {
	    try {
	        const leaderboard = await retardTracker.getDumpstars()

	        // set the maximum row width (29 characters)
	        const maxRowWidth = 29 // maximum width for a row (including separators)

	        // limit the number of users to display
	        const maxUsers = 10
	        const leaderboardSubset = leaderboard.slice(0, maxUsers)

	        // set fixed widths for columns based on the available space (29 characters total)
	        const usernameWidth = 20  // max username length (fixed at 20 characters)
	        const dumpstarsWidth = 5  // max dumpstars (5 characters to allow for formatting like ⭐x3)

	        // create the header row (adjusting padding for proper alignment)
	        const header = `User${' '.repeat(usernameWidth - 4)}|Dumpstars`

	        // create the separator row (based on total row width)
	        const separator = '─'.repeat(maxRowWidth)

	        // create the data rows (sorted by dumpstars in descending order)
	        const rows = leaderboardSubset
	            .sort((a, b) => b.dumpstars - a.dumpstars) // Sort by dumpstars in descending order
	            .map(({ username, first_name, dumpstars }) => {
	                // Truncate the username if it's longer than usernameWidth
	                const name = (username || first_name || 'Unknown').slice(0, usernameWidth).padEnd(usernameWidth, ' ')
	                const dumpstarsFormatted = `⭐x${dumpstars}`.padStart(dumpstarsWidth, ' ') // format dumpstars

	                return `${name}|${dumpstarsFormatted}`
	            }).join('\n')

	        // Combine all parts to form the complete leaderboard message (with the title outside the backticks)
	        const message = `🏆 Dumpstar Leaderboards 🏆\n\n\`\`\`\n${header}\n${separator}\n${rows}\n${separator}\`\`\``

	        // Ensure the message length does not exceed the 4096 character limit
	        if (message.length > 4096) {
	            ctx.reply("leaderboard is too fuggin long to display in one message... showing the top 10 users:", {reply_to_message_id: ctx.message.message_id, parse_mode:'HTML'})
	            ctx.reply(message, {reply_to_message_id: ctx.message.message_id, parse_mode:'HTML'})
	        } else {
	            // send the leaderboard message
	            ctx.reply(message, { reply_to_message_id: ctx.message.message_id, parse_mode: 'MarkdownV2' })
	        }

	    } catch (e) {
	        console.log(e, 'some error during dumpstars leaderboard execution')
	    }
	},
	async monsterhunt(ctx) {
		try{
			const userId = ctx.from.id
			if(!userId) return console.log('cant find userId for monsterhunt')
			const user = await retardTracker.battleMonster(ctx, userId)
			
		} catch(e) {
			console.log(e, 'some error during monsterhunt')
		}
	},
	async fight(ctx) {
		try{
			const userId = ctx.from.id

    	    const repliedMessage = ctx.message.reply_to_message
    	    console.log(repliedMessage)
		    if (!repliedMessage) {
		        return await ctx.reply('please reply to a message from the user you want to fight.', {reply_to_message_id: ctx.message.message_id, parse_mode:'HTML'});
		    }
		    const targetUserId = repliedMessage.from.id
		    console.log(targetUserId, 'the id of the guy we want to fight', userId, 'myId')
		    if(repliedMessage.from.is_bot) {
		    	return ctx.reply('you cannot target a bot.', {reply_to_message_id: ctx.message.message_id, parse_mode:'HTML'})
		    }

		    let user = await retardTracker.fightUser(ctx, userId, targetUserId)
		}catch(e) {
			console.log(e, 'some error during fight')
		}
	},
	async inventory(ctx) {
		try{
			const userId = ctx.from.id
			if(!userId) return console.log('cant find userId for inventory')
			const user = await retardTracker.getInv(ctx, userId)
			if(user){console.log('successfully gave random weapon')}
		}catch(e) {
			console.log(e, 'some error during inventory')
		}
	},
	async inv(ctx) {
		try{
			const userId = ctx.from.id
			if(!userId) return console.log('cant find userId for inventory')
			const user = await retardTracker.getInv(ctx, userId)
			if(user){console.log('successfully gave random weapon')}
		}catch(e) {
			console.log(e, 'some error during inventory')
		}
	},
	async equipweapon(ctx) {
		try {
			const userId = ctx.from.id
			if(!userId) throw Error('no userid')

	        // get the fuckin command and weaponnumber to unequip
		    const message = ctx.message.text

		    // regex to get ze number after /equipweapon and ignore any extra stuff
		    const match = message.match(/^\/equipweapon (\d+)/)

	        if (match) {
		        // the number is the first captured group
		        const weaponToEquip = parseInt(match[1])

		        // validate that the number is between 1 and 5
		        if (weaponToEquip >= 1 && weaponToEquip <= 5) {
		            // equip the weapon by putting it in inventory.equippedWeapons[]
		            const user = await retardTracker.equipWeapon(ctx, userId, weaponToEquip)

		        } else {
		            await ctx.reply("you only have 5 inv slots to choose from.", {reply_to_message_id: ctx.message.message_id, parse_mode:'HTML'});
		        }
		    } else {
		        await ctx.reply(`gotta write it like /equipweapon <number>`, {reply_to_message_id: ctx.message.message_id, parse_mode:'HTML'});
		    }
		}catch(e) {
			console.log(e, 'smth went wrong in equipweapon')
		}
	},
	async unequipweapon(ctx) {
		try {
			const userId = ctx.from.id
			if(!userId) throw Error('no userid')

	        // get the fuckin command and weaponnumber to unequip
		    const message = ctx.message.text

		    // regex to get ze number after /unequipweapon and ignore any extra stuff
		    const match = message.match(/^\/unequipweapon (\d+)/)

	        if (match) {
		        // the number is the first captured group
		        const weaponToUnequip = parseInt(match[1])

		        // validate that the number is between 1 and 2
		        if (weaponToUnequip >= 1 && weaponToUnequip <= 2) {
		            // unequip the weapon by removing it from inventory.equippedWeapons[]
		            const user = await retardTracker.unequipWeapon(ctx, userId, weaponToUnequip)

		        } else {
		            await ctx.reply("you only have 2 equipped slots to choose from.", {reply_to_message_id: ctx.message.message_id, parse_mode:'HTML'})
		        }
		    } else {
		        await ctx.reply(`gotta write it like /unequipweapon <number>`, {reply_to_message_id: ctx.message.message_id, parse_mode:'HTML'})
		    }
		}catch(e) {
			console.log(e, 'smth went wrong in unequipweapon')
		}
	},
	async destroyweapon(ctx) {
		try {
			const userId = ctx.from.id
			if(!userId) throw Error('no userid')

	        // get the fuckin command and index number of the weapon to remove
		    const message = ctx.message.text

		    // regex to get ze number after /destroyweapon and ignore any extra stuff
		    const match = message.match(/^\/destroyweapon (\d+)/)

	        if (match) {
		        // the number is the first captured group
		        const itemToRemove = parseInt(match[1])

		        // validate that the number is between 1 and 5
		        if (itemToRemove >= 1 && itemToRemove <= 5) {
		            // remove the item from users inventory 
		            const user = await retardTracker.removeWeapon(ctx, userId, itemToRemove)

		        } else {
		            await ctx.reply("you fucked up somehow, doofus", {reply_to_message_id: ctx.message.message_id, parse_mode:'HTML'})
		        }
		    } else {
		        await ctx.reply(`gotta write it like /destroyweapon <number between 1-5>`, {reply_to_message_id: ctx.message.message_id, parse_mode:'HTML'})
		    }
		}catch(e) {
			console.log(e, 'smth went wrong in destroyweapon')
		}
	},
	async inspectitem(ctx) {
		try {
			const userId = ctx.from.id
			if(!userId) throw Error('no userid')

	        // get the fuckin command and item number to use
		    const message = ctx.message.text

		    // regex to get ze number after /inspectitem and ignore any extra stuff
		    const match = message.match(/^\/inspectitem (\d+)/)

	        if (match) {
		        // the number is the first captured group
		        const itemToInspect = parseInt(match[1])

		        // validate that the number is between 1 and 5
		        if (itemToInspect >= 1 && itemToInspect <= 5) {
		            const user = await retardTracker.inspectItem(ctx, userId, itemToInspect)
		        } else {
		            await ctx.reply("you only have 5 inv slots to choose from.", {reply_to_message_id: ctx.message.message_id, parse_mode:'HTML'})
		        }
		    } else {
		        await ctx.reply(`gotta write it like /inspectitem <number>`, {reply_to_message_id: ctx.message.message_id, parse_mode:'HTML'})
		    }
		}catch(e) {
			console.log(e, 'smth went wrong in inspectitem')
		}
	},
	async useitem(ctx) {
		try {
			const userId = ctx.from.id
			if(!userId) throw Error('no userid')

	        // get the fuckin command and item number to use
		    const message = ctx.message.text

		    // regex to get ze number after /useitem and ignore any extra stuff
		    const match = message.match(/^\/useitem (\d+)/)

	        if (match) {
		        // the number is the first captured group
		        const itemToUse = parseInt(match[1])

		        // validate that the number is between 1 and 5
		        if (itemToUse >= 1 && itemToUse <= 5) {
		            // use the item by putting it in inventory.equippedConsumables[]
		            const user = await retardTracker.equipConsumable(ctx, userId, itemToUse)

		        } else {
		            await ctx.reply("you only have 5 inv slots to choose from.", {reply_to_message_id: ctx.message.message_id, parse_mode:'HTML'})
		        }
		    } else {
		        await ctx.reply(`gotta write it like /useitem <number>`, {reply_to_message_id: ctx.message.message_id, parse_mode:'HTML'})
		    }
		}catch(e) {
			console.log(e, 'smth went wrong in useitem')
		}
	},
	async destroyitem(ctx) {
		try {
			const userId = ctx.from.id
			if(!userId) throw Error('no userid')

	        // get the fuckin command and index number of the item to remove
		    const message = ctx.message.text

		    // regex to get ze number after /destroyitem and ignore any extra stuff
		    const match = message.match(/^\/destroyitem (\d+)/)

	        if (match) {
		        // the number is the first captured group
		        const itemToRemove = parseInt(match[1])

		        // validate that the number is between 1 and 5
		        if (itemToRemove >= 1 && itemToRemove <= 5) {
		            // remove the item from users inventory 
		            const user = await retardTracker.removeItem(ctx, userId, itemToRemove)

		        } else {
		            await ctx.reply("you fucked up somehow, doofus", {reply_to_message_id: ctx.message.message_id, parse_mode:'HTML'})
		        }
		    } else {
		        await ctx.reply(`gotta write it like /removeitem <number between 1-5>`, {reply_to_message_id: ctx.message.message_id, parse_mode:'HTML'})
		    }
		}catch(e) {
			console.log(e, 'smth went wrong in removeitem')
		}
	}
}
