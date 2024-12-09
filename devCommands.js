import { retardTracker } from './retardTracker.js'

const adminUserIds = [6485160380, 1972765402]
async function calculateRemainingTime(timeSinceClaim) {
	let remainingTimeInMs = 86400000 - timeSinceClaim
    // Calculate hours, minutes, and seconds from milliseconds
    const hours = Math.floor(remainingTimeInMs / 3600000); // 1 hour = 3600000 ms
    const minutes = Math.floor((remainingTimeInMs % 3600000) / 60000); // 1 minute = 60000 ms
    const seconds = Math.floor((remainingTimeInMs % 60000) / 1000); // 1 second = 1000 ms

    // Return a formatted string
    return `you can claim your free daily xp in ${hours}h${minutes}min${seconds}s.`;
}

export const devCommands = {
	async givedumpstar(ctx) {
		try {
			const userId = ctx.from.id
			console.log(userId, 'in givedumpstar')
			if(adminUserIds.includes(userId)) console.log(userId, 'is in adminuserids')
		    if (!adminUserIds.includes(userId)) return

		    console.log(userId,'got past the guardclause for dumpstars')
    	    const repliedMessage = ctx.message.reply_to_message
    	    console.log(repliedMessage)
		    if (!repliedMessage) {
		        return ctx.reply('please reply to a message to give a dumpstar.');
		    }
		    const targetUserId = repliedMessage.from.id
		    console.log(targetUserId, 'the id of the guy we want to give stars to')
		    if(repliedMessage.from.is_bot) {
		    	return ctx.reply('you cannot give a dumpstar to a bot, they are not worthy. sadface for me.')
		    }
        	const user = await retardTracker.giveDumpstar(ctx, targetUserId)
        	console.log(user, 'giving dumpstars to this fool')
        	if (user) ctx.reply(`🌟${user.first_name} GOT A FACKIN' DUMPSTAR!!!(and +100xp)🌟\nin total this bitch has <b>${user.dumpstars}</b> dumpstars, and <b>${user.xp}XP</b>!!`, {parse_mode: 'HTML'})
		} catch(e) {
			console.log(e, 'smth with givedumpstar command')
		}
	},
	async removedumpstar(ctx) {
		try {
			const userId = ctx.from.id
		    if (!adminUserIds.includes(userId)) return

    	    const repliedMessage = ctx.message.reply_to_message
		    if (!repliedMessage) {
		        return ctx.reply('please reply to a message from a user to remove a dumpstar from.');
		    }
		    const targetUserId = repliedMessage.from.id
		    if(repliedMessage.from.is_bot) {
		    	return ctx.reply('bots cannot own dumpstars, they are not worthy. sadface for me.')
		    }
        	const user = await retardTracker.removeDumpstar(targetUserId)
        	if (user) {
        		ctx.reply(`christ man you fucked up big this time ${repliedMessage.from.first_name}, you doofus!!! a dumpstar was removed and now you have have ${user.dumpstars} dumpstars!`)
			}

			if (!user) {
				ctx.reply('user prolly already has zero dumpstars')
			}
		} catch(e) {
			console.log(e, 'smth with givedumpstar command')
		}
	},
	async givexp(ctx) {
		try {
			const userId = ctx.from.id
			console.log(userId, 'in giveXP')
			if(adminUserIds.includes(userId)) console.log(userId, 'is in adminuserids')
		    if (!adminUserIds.includes(userId)) return

		    console.log(userId,'got past the guardclause for givexp')
    	    const repliedMessage = ctx.message.reply_to_message
    	    console.log(repliedMessage)
		    if (!repliedMessage) {
		        return ctx.reply('please reply to a message from a user to give xp to.');
		    }
		    const targetUserId = repliedMessage.from.id
		    console.log(targetUserId, 'the id of the guy we want to give xp to')
		    if(repliedMessage.from.is_bot) {
		    	return ctx.reply('you cannot give a xp to a bot, they are not worthy. sadface for me.')
		    }

	        // get the fuckin command and number of xp to remove from the message
		    const message = ctx.message.text

		    // regex to get ze number after /removexp and ignore any extra stuff
		    const match = message.match(/^\/givexp (\d+)/)

	        if (match) {
		        // the number is the first captured group
		        const xpToGive = parseInt(match[1])

		        // validate that the number is between 1 and 1000
		        if (xpToGive >= 1 && xpToGive <= 1000) {
		            // remove the XP
		            console.log(targetUserId, 'sending this into giveXP')
		            const userWhoWasGivenXP = await retardTracker.giveXP(ctx, targetUserId, xpToGive)
        			if (userWhoWasGivenXP) return ctx.reply(`🎉 ${userWhoWasGivenXP.first_name} got ${xpToGive} XP cuz he's a lovely son of a gun!!! 🎉 \nin total this b*tch now has <b>${userWhoWasGivenXP.xp}</b> xp and is at <b>level ${userWhoWasGivenXP.level}</b>!`, {parse_mode: 'HTML'})
        			if (!userWhoWasGivenXP) return ctx.reply('smth went wrong m8')
		        } else {
		            ctx.reply("dude... gimme a reasonable number, between 1 and 1000. should be enough right?");
		        }
	        }
		} catch(e) {
			console.log(e, 'smth with giveXP command')
		}
	},
	async removexp(ctx) {
		try {
			const userId = ctx.from.id
			if(!adminUserIds.includes(userId)) return

			const repliedMessage = ctx.message.reply_to_message
		    if (!repliedMessage) {
		        return ctx.reply('please reply to a message from a user to remove a xp from.');
		    }

		    const targetUserId = repliedMessage.from.id

		    if(repliedMessage.from.is_bot) {
		    	return ctx.reply('bots cannot have xp, they are not worthy. sadface for me.')
		    }

	        // get the fuckin command and number of xp to remove from the message
		    const message = ctx.message.text

		    // regex to get ze number after /removexp and ignore any extra stuff
		    const match = message.match(/^\/removexp (\d+)/)

	        if (match) {
		        // the number is the first captured group
		        const xpToRemove = parseInt(match[1])

		        // validate that the number is between 1 and 1000
		        if (xpToRemove >= 1 && xpToRemove <= 1000) {
		            // remove the XP
		            console.log(targetUserId, 'sending this into removeXP')
		            const userWhoWasRemovedXPFrom = await retardTracker.removeXP(ctx, targetUserId, xpToRemove)
        			if (userWhoWasRemovedXPFrom) ctx.reply(`💩${userWhoWasRemovedXPFrom.first_name} got deducted ${xpToRemove} XP cuz he's a b*tch!!!💩 \nin total this b*tch now has ${userWhoWasRemovedXPFrom.xp} xp at level ${userWhoWasRemovedXPFrom.level}!`)
        			if (!userWhoWasRemovedXPFrom) ctx.reply('smth went wrong m8')
		        } else {
		            await ctx.reply("dude... gimme a reasonable number, between 1 and 1000. that oughta show em");
		        }
		    } else {
		        await ctx.reply("Invalid command format. Please use `/removexp <number>` (e.g., `/removexp 100`).");
		    }

		} catch(e) {
			console.log(e, 'smth went wrong with removexp')
		}
	},
	async giverandomweapon(ctx) {
		try{
			const userId = ctx.from.id
			console.log(userId, 'in giverandomweapon')
			if(adminUserIds.includes(userId)) console.log(userId, 'is in adminuserids')
		    if (!adminUserIds.includes(userId)) return

		    console.log(userId,'got past the guardclause for giverandomweapon')
    	    const repliedMessage = ctx.message.reply_to_message
    	    console.log(repliedMessage)
		    if (!repliedMessage) {
		        return await ctx.reply('please reply to a message from a user to give random weapon to.');
		    }
		    const targetUserId = repliedMessage.from.id
		    console.log(targetUserId, 'the id of the guy we want to give random weapon to')
		    if(repliedMessage.from.is_bot) {
		    	return await ctx.reply('you cannot give weapons to a bot, they are not worthy. sadface for me.')
		    }

		    let user = retardTracker.giveRandomWeapon(ctx, targetUserId)
		}catch(e) {
			console.log(e, 'some error during giverandomweapon')
		}
	},
	async giverandomitem(ctx) {
		try{
			const userId = ctx.from.id
			console.log(userId, 'in giverandomitem')
			if(adminUserIds.includes(userId)) console.log(userId, 'is in adminuserids')
		    if (!adminUserIds.includes(userId)) return

		    console.log(userId,'got past the guardclause for giverandomitem')
    	    const repliedMessage = ctx.message.reply_to_message
    	    console.log(repliedMessage)
		    if (!repliedMessage) {
		        return await ctx.reply('please reply to a message from a user to give random item to.');
		    }
		    const targetUserId = repliedMessage.from.id
		    console.log(targetUserId, 'the id of the guy we want to give random item to')
		    if(repliedMessage.from.is_bot) {
		    	return await ctx.reply('you cannot give item to a bot, they are not worthy. sadface for me.')
		    }

		    let user = retardTracker.giveRandomItem(ctx, targetUserId)
		}catch(e) {
			console.log(e, 'some error during giverandomitem')
		}
	},
	async clearinventory(ctx) {
		try{
			const userId = ctx.from.id
			console.log(userId, 'in clearinventory')
			if(adminUserIds.includes(userId)) console.log(userId, 'is in adminuserids')
		    if (!adminUserIds.includes(userId)) return

		    console.log(userId,'got past the guardclause for clearinventory')
    	    const repliedMessage = ctx.message.reply_to_message
    	    console.log(repliedMessage)
		    if (!repliedMessage) {
		        return ctx.reply('please reply to a message from a user to clear inventory for.');
		    }
		    const targetUserId = repliedMessage.from.id
		    console.log(targetUserId, 'the id of the guy we want to clear inventory of')
		    if(repliedMessage.from.is_bot) {
		    	return await ctx.reply('you cannot target a bot.')
		    }

		    let user = await retardTracker.clearInventory(ctx, targetUserId)
		}catch(e) {
			console.log(e, 'some error during clearinventory')
		}
	}
}
