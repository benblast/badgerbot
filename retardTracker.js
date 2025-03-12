import pkg from 'node-persist'
import fs from 'fs/promises'
import path from 'path'
import { verifyMessage } from 'ethers'
import { randomInt } from 'crypto'
import { retardHelpers } from './retardHelpers.js'
import monsters from './monsters.json' assert { type: 'json' }
import weapons from './weapons.json' assert { type: 'json' }
import consumables from './consumables.json' assert { type: 'json' }
const { init, getItem, setItem, values } = pkg
const verificationMessages = new Map()
// start the fuckin node-persist storage
await init({ dir: './user-data' })

export const retardTracker = {
    async getUser(ctx, userId) {
        if(!userId) return console.log('couldnt extract userId from', ctx.from.id)
        let user = await pkg.getItem(userId.toString())
        if(!user) return console.log('no user found')
        return user
    },
    async awardChatXP (ctx, user) {
        const {username, first_name, last_name} = user
        const userId = user.id
        if(!userId) return console.log('couldnt extract userId from', ctx.user)
        let userToAwardXP = await pkg.getItem(userId.toString()) || { 
            username: username, 
            userId: userId,
            first_name: user.first_name, 
            last_name: user.last_name, 
            xp: 0,
            level: 0,
            dumpstars: 0,
            fightTimer: 0,
            messages: 1,
            quests: {
                dailyxp: {
                    timestamp: 0,
                    combo: 0,
                    highscore: 0
                },
                dailyloot: {
                    timestamp: 0,
                    combo: 0,
                    highscore: 0
                },
                monsterHunt: {
                    timestamp: 0,
                    combo: 0,
                    highscore: 0,
                    level: 1
                }
            },
            inventory: {
                equippedWeapon: {1:{}, 2:{}},
                equippedArmor: {1:{}, 2:{}},
                equippedConsumables: {1:{}, 2:{}},
                weapons: {1:{}, 2:{}, 3:{}, 4:{}, 5:{}},
                armor: {1:{}, 2:{}, 3:{}, 4:{}, 5:{}},
                consumables: {1:{}, 2:{}, 3:{}, 4:{}, 5:{}},
                cursed: {1:{}, 2:{}}
            }
        }
        if(userToAwardXP.hasOwnProperty('userId') && userToAwardXP.userId === '') userToAwardXP.userId = userId

        userToAwardXP.messages++

        userToAwardXP.xp += 3 // i dunno, 3 XP per message sounds like a dumb number to award instead of 1
        userToAwardXP = await this.checkLevelUp(ctx, userToAwardXP)
        if (userToAwardXP) await pkg.setItem(userId.toString(), userToAwardXP)
        console.log('successfully added xp from chat', userToAwardXP.first_name, userId)
        return userToAwardXP
    },
    async getXP(userId) {
        const user = await pkg.getItem(userId.toString())
        return user
    },
    async getLeaderboard(limit = 10) {
        const allUsers = await pkg.values()
        return allUsers.sort((a, b) => b.xp - a.xp).slice(0, limit)
    },
    async getDumpstars(limit = 10) {
        const allUsers = await pkg.values()
        return allUsers.sort((a, b) => b.dumpstars - a.dumpstars).slice(0, limit)
    },
    async giveDumpstar(ctx, userId) {
        let user = await pkg.getItem(userId.toString())
        if(!user) {
            console.log(ctx, userId, user)
            throw new Error("user not found or invalid data")
        }
        user.dumpstars++
        user.xp += 100
        user = await this.checkLevelUp(ctx, user)
        if (user) await pkg.setItem(userId.toString(), user)
        return user
    },
    async saveRaffleData(userId, raffleInfo) {
        let user = await pkg.getItem(userId.toString())
        if(!user) {
            console.log(ctx, userId, user)
            throw new Error("user not found or invalid data")
        }
        if(user.hasOwnProperty('raffle')) return false
        user.raffle = raffleInfo
        await pkg.setItem(userId.toString(), user)
        return user
    },
    async removeDumpstar(userId) {
        let user = await pkg.getItem(userId.toString())
        if(!user) {
            console.log(ctx, userId, user)
            throw new Error("user not found or invalid data")
        }
        if(user.dumpstars <= 0) return false 
        user.dumpstars--
        await pkg.setItem(userId.toString(), user)
        return user
    },
    async checkLevelUp(ctx, user) {
        const xpPerLevel = 250  // fixed XP per level (250 XP)

        // function to calculate the XP required for the next level
        const calculateXPForLevel = (level) => {
            // each level requires 250 XP, regardless of the level
            return level * xpPerLevel
        }

        // check if its enough xp for levelling up, also checks for multiple levelups
        let counter = 0 
        while (user.xp >= calculateXPForLevel(user.level + 1)) {
            console.log(user.xp, user.level, calculateXPForLevel(user.level + 1))
            user.level++  // level up the user
            counter++
        }
        if(counter >= 1) await ctx.reply(`🎉${user.first_name} got ${counter} level(s) to reach <b>level ${user.level}</b>!🎉`, {parse_mode:'HTML'});

        // send back user objectaroni to be saved in db
        return user
    },
    async checkLevelDown(ctx, user) {
        const xpPerLevel = 250  // fixed XP per level (250 XP)

        // function to calculate the XP required for the next level
        const calculateXPForLevel = (level) => {
            // each level requires 250 XP, regardless of the level
            return level * xpPerLevel
        }

        let counter = 0
        // while the users XP is less than the required XP for their current level... keep leveling them down
        while (user.xp < calculateXPForLevel(user.level)) {
            if (user.level > 0) {  // prevent leveling down below level 0
                user.level-- // decrease level
                counter++
                console.log(`${user.first_name} has been leveled down to level ${user.level}.`)
            } else {
                break // stop at level 0 (can't go below level 0)
            }
        }

        if(counter >= 1) await ctx.reply(`oh shit ${user.first_name ? `<b>${user.first_name}</b>` : "Hidden"}, you lost ${counter} level(s) and badgered your way DOWN to level ${user.level}!`, {reply_to_message_id: ctx.message.message_id, parse_mode:'HTML'});
        // send back the updated user object to be saved in the fukkin DB
        return user
    },
    async giveXP(ctx, userId, amountToGive) {
        console.log(userId, amountToGive, 'received this in givexp')
        let user = await pkg.getItem(userId.toString())
        if(!user|| !ctx|| !userId|| !amountToGive) {
            console.log(ctx, userId, user)
            throw new Error("user not found or invalid data")
        }
        if(amountToGive <= 0 || amountToGive > 1000) return await ctx.reply('you need to give a number between 1 and 1000', {reply_to_message_id: ctx.message.message_id, parse_mode:'HTML'})
        user.xp += amountToGive
        console.log(user.first_name, 'was given', amountToGive, 'xp')
        user = await this.checkLevelUp(ctx, user)
        if (user) await pkg.setItem(userId.toString(), user)
        return user
    },
    async removeXP(ctx, userId, amountToRemove) {
        console.log(userId, amountToRemove, 'received this in removexp')
        let user = await pkg.getItem(userId.toString())
        if(!user|| !ctx|| !userId|| !amountToRemove) {
            console.log(ctx, userId, user)
            throw new Error("user not found or invalid data")
        }

        if(amountToRemove > user.xp) {
            await ctx.reply('cant subtract more xp than the user has', {reply_to_message_id: ctx.message.message_id, parse_mode:'HTML'})
            return false
        }
        if(amountToRemove <= 0 || amountToRemove > 1000) {
          await ctx.reply('you need to give a number between 1 and 1000', {reply_to_message_id: ctx.message.message_id, parse_mode:'HTML'})  
          return false
        } 
        user.xp -= amountToRemove
        console.log(user.first_name, 'was got', amountToRemove, 'xp removed')
        user = await this.checkLevelDown(ctx, user)
        if (user) await pkg.setItem(userId.toString(), user)
        return user
    },
    async dailyXP(ctx, userId) {
        let user = await pkg.getItem(userId.toString())
        if(!user|| !ctx|| !userId) {
            console.log(ctx, userId, user)
            throw new Error("user not found or invalid data")
        }

        let unix_timestamperoni = Date.now()

        let doubleXp = false 
        for(let key in user.inventory.equippedConsumables) {
            if(user.inventory.equippedConsumables[key].hasOwnProperty('bonusDailyXp')) {
                if(user.inventory.equippedConsumables[key].bonusDailyXp) {
                    doubleXp = true
                }
            }
        }
        console.log(unix_timestamperoni, 'timestamp for dailyxp for', user.first_name)
        let timeDifference = unix_timestamperoni - user.quests.dailyxp.timestamp
        if(timeDifference >= 86400000 && timeDifference <= 172800000) { //check if its been more than 24hours but less than 48hours
            user.quests.dailyxp.timestamp = unix_timestamperoni
            user.quests.dailyxp.combo++
            let bonusXp
            if(user.quests.dailyxp.combo > 0) {
                bonusXp = user.quests.dailyxp.combo * 5
            }
            let theXpToAward = (50 + bonusXp)
            if(doubleXp) {
                theXpToAward = theXpToAward*2
                //"consume" the dailyxp bonus item (if there are two it doesnt matter which one it consumes)
                if(user.inventory.equippedConsumables[1].bonusDailyXp) {
                    user.inventory.equippedConsumables[1] = {}
                } else if (user.inventory.equippedConsumables[2].bonusDailyXp) {
                    user.inventory.equippedConsumables[2] = {}
                }
            }
            user = await this.addXp(ctx, userId, user, theXpToAward)
            return { user, doubleXp }
        } else if(timeDifference >= 86400000 && timeDifference >= 172800000) {
            user.quests.dailyxp.timestamp = unix_timestamperoni
            if(user.quests.dailyxp.combo > user.quests.dailyxp.highscore) {
                user.quests.dailyxp.highscore = user.quests.dailyxp.combo
            } 
            user.quests.dailyxp.combo = 0
            let theXpToAward = 50
            if(doubleXp) {
                theXpToAward = theXpToAward*2
                //"consume" the dailyxp bonus item (if there are two it doesnt matter which one it consumes)
                if(user.inventory.equippedConsumables[1].bonusDailyXp) {
                    user.inventory.equippedConsumables[1] = {}
                } else if (user.inventory.equippedConsumables[2].bonusDailyXp) {
                    user.inventory.equippedConsumables[2] = {}
                }
            }
            user = await this.addXp(ctx, userId, user, theXpToAward)
            return { user, doubleXp }
        }
        user = timeDifference
        return { user, doubleXp } //user here is actually the timeDifference
    },
    async dailyLoot(ctx, userId) {
        if(!ctx||!userId) throw Error('no ctx or userid in dailyloot')
        let user = await pkg.getItem(userId.toString())
        if(!user) throw Error('user not found baby')

        let isConsumablesSlotsFull = await retardHelpers.isInvFull(user.inventory.consumables)
        if(isConsumablesSlotsFull) return await ctx.reply('your 5 consumable item slots are already full, babe', {reply_to_message_id: ctx.message.message_id, parse_mode: 'HTML'})

        let unix_timestamperoni = Date.now()

        console.log(unix_timestamperoni, 'timestamp for dailyloot for', user.first_name)
        let timeDifference = unix_timestamperoni - user.quests.dailyloot.timestamp
        if(timeDifference >= 86400000) { //check if its been more than 24hours

            user.quests.dailyloot.combo++
            user.quests.dailyloot.timestamp = Date.now()
            let randomIntLootDecider = await randomInt(0, consumables.length)
            let theLoot = consumables[randomIntLootDecider]
            let freeSlot = retardHelpers.findFreeSlot(user.inventory.consumables)
            if(!freeSlot) return console.log('no available slots for the dailyloot. something went wrong')

            user.inventory.consumables[freeSlot] = theLoot

            let successMessage = `📦<b>${user.first_name}</b> found <i>${theLoot.name}</i>📦\n\ndescription:\n${theLoot.descr}`
            let success = await pkg.setItem(userId.toString(), user)
            return await ctx.reply(successMessage, {reply_to_message_id: ctx.message.message_id, parse_mode: 'HTML'})
        }
        let timeLeft = await retardHelpers.calculateRemainingTime(timeDifference)
        let failMessage = `📦 wait ${timeLeft} to claim daily loot again 📦`
        return await ctx.reply(failMessage, {reply_to_message_id: ctx.message.message_id, parse_mode: 'HTML'})
    },
    async theShop(ctx, userId) {
        if(!ctx||!userId) throw Error('no ctx or userId in theShop')
        let user = await pkg.getItem(userId.toString())
        if(!user) throw Error('no user found in theShop for userId', userId)
        return user
    },
    async battleMonster(ctx, userId, bossBattle) {
        if(!ctx||!userId) throw Error('no ctx or userid in battlemonster')
        let user = await pkg.getItem(userId.toString())
        if(!user) throw Error('user not found baby')
        if(!monsters) throw Error('monsters list empty of failed to load babe')

        let timeReq = 300000 // 5mins
        let current_unix_timestamperoni = Date.now()
        let timeDiff = current_unix_timestamperoni - user.quests.monsterHunt.timestamp
        if(timeDiff <= timeReq) return ctx.reply(`chill for ${Math.floor((timeReq - timeDiff)/1000)} more seconds, you rowdy badger`, {reply_to_message_id: ctx.message.message_id, parse_mode:'HTML'})

        const randomFightDeciderInt = await randomInt(0, 101)
        let criticalHit = false

        //check for critical hit bonuses
        let criticalDecider = 95
        if(user.inventory.equippedConsumables[1].hasOwnProperty('name') && user.inventory.equippedConsumables[1].bonusCritChance > 0) { //if .name exists it means there is an equipped weapon in this slot
            criticalDecider -= user.inventory.equippedConsumables[1].bonusCritChance
        }
        if(user.inventory.equippedConsumables[2].hasOwnProperty('name') && user.inventory.equippedConsumables[2].bonusCritChance > 0) { //if .name exists it means there is an equipped weapon in this slot
            criticalDecider -= user.inventory.equippedConsumables[2].bonusCritChance
        }
        if(randomFightDeciderInt >= criticalDecider) criticalHit = true

        let theMonsterToFight
        if(!bossBattle) {
            theMonsterToFight = retardHelpers.getRandomMonster(Math.min(3, user.quests.monsterHunt.level+1))
            console.log(user.first_name,'battles',theMonsterToFight)
        } else {
            let bossMonsterLevel = Math.min(2, user.quests.monsterHunt.level)
            if (bossMonsterLevel < 0) bossMonsterLevel = 0
            theMonsterToFight = retardHelpers.getBossMonster(bossMonsterLevel)
            console.log(user.first_name,'bossbattles',theMonsterToFight)
        }


        let bonusChance = Math.floor(user.level/10)
        if(bonusChance > 10) bonusChance = 10

        //calculate attackbonus based on weapons equipped
        let weaponAttackBonus = retardHelpers.calculateTotalWeaponDamage(user.inventory.equippedWeapon)

        //calculate item bonus
        let itemAttackBonus = 0
        let item1 = false
        let item2 = false
        if(user.inventory.equippedConsumables[1].hasOwnProperty('name') && user.inventory.equippedConsumables[1].bonusDamage > 0) { //if .name exists it means there is an equipped consumable item in this slot
            itemAttackBonus += user.inventory.equippedConsumables[1].bonusDamage
            item1 = true
        }
        if(user.inventory.equippedWeapon[2].hasOwnProperty('name') && user.inventory.equippedConsumables[2].bonusDamage > 0) { //if .name exists it means there is an equipped consumable in this slot
            itemAttackBonus += user.inventory.equippedConsumables[2].bonusDamage
            item2 = true
        }

        //calculate curse subtractions
        let itemAttackCurse = 0
        let curse1 = false
        let curse2 = false
        if(user.inventory.cursed[1].hasOwnProperty('name') && user.inventory.cursed[1].curse.weakenDamage > 0) { //if .name exists it means there is a curse in this slot
            itemAttackCurse += user.inventory.cursed[1].curse.weakenDamage
            curse1 = true
        }
        if(user.inventory.cursed[2].hasOwnProperty('name') && user.inventory.cursed[2].curse.weakenDamage > 0) { //if .name exists it means there is a curse in this slot
            itemAttackCurse += user.inventory.cursed[2].curse.weakenDamage
            curse2 = true
        }

        let monsterDifficulty = theMonsterToFight.diff + 30
        let fightChance
        if(criticalHit) {
            fightChance = (randomFightDeciderInt*2) + weaponAttackBonus + bonusChance
        } else {
            fightChance = randomFightDeciderInt + weaponAttackBonus + itemAttackBonus + bonusChance - itemAttackCurse       
        }

        // IF WINNING SCENARIO HERE
        if(fightChance > monsterDifficulty) {

            //change modifierChance to be moded by some item in the future or whatever
            let modifierChance = 0
            const didUserFindLoot = retardHelpers.rollForLoot(modifierChance)
            let loot = 0
            if(didUserFindLoot) {
                // efter armor eller consumables introducerats så måste vi ha logic för att awarda det 
                let awardedWeapon = retardHelpers.getRandomWeapon()

                let userHasFreeSlot = retardHelpers.findFreeSlot(user.inventory.weapons)
                let userHasDuplicate = retardHelpers.findDuplicate(user.inventory.weapons, awardedWeapon.name)

                if(userHasDuplicate) loot = `📦you found <b>${awardedWeapon.name}</b>📦\n📦- but you already got that so i threw it in the bushes\n`
                if(!userHasFreeSlot) loot = `📦you found <b>${awardedWeapon.name}</b>📦\n📦- but you got 5 weapons already so i tossed dat shii!\n`

                if(userHasFreeSlot && !userHasDuplicate) {
                    user.inventory.weapons[userHasFreeSlot] = awardedWeapon //award the weapon in the free slot
                    loot = `📦- you found <b>${awardedWeapon.name}</b>(<i>${awardedWeapon.attack}dmg</i>)!!\n`
                    console.log(awardedWeapon, 'weapon', 'to', userId, user.first_name)
                }
            }
            // AWARD CONSUMABLE ITEM FOR BOSS WIN
            if(bossBattle) {
                let awardedConsumable = retardHelpers.getRandomConsumable()
                let userHasFreeConsumableSlot = retardHelpers.findFreeSlot(user.inventory.consumables)
                let userHasConsumableDuplicate = retardHelpers.findDuplicate(user.inventory.consumables, awardedConsumable.name)

                if(userHasConsumableDuplicate) loot = `⚗️you found <b>${awardedConsumable.name}</b>⚗️\n⚗️- but you already got that so i threw it in the bushes`
                if(!userHasFreeConsumableSlot) loot = `⚗️you found <b>${awardedConsumable.name}</b>⚗️\n⚗️- but you got 5 items already so i tossed dat shii!`
                
                if(userHasFreeConsumableSlot && !userHasConsumableDuplicate) {
                    user.inventory.consumables[userHasFreeConsumableSlot] = awardedConsumable //award the weapon in the free slot
                    if(loot) {
                        loot += `⚗️- you found <b>${awardedConsumable.name}</b>`
                    } else {
                        loot = `⚗️- you found <b>${awardedConsumable.name}</b>`
                    }
                    console.log(awardedConsumable.name, 'consumable item', 'to', userId, user.first_name) 
                }

            }
            let winMessage
            if(!bossBattle) winMessage = `⚔️ <b>a battle begins</b> ⚔️\n`
            if(bossBattle) winMessage = `🦖 <b>A BOSS BATTLE BEGINS</b> 🦖\n`
            winMessage += `🏰- <i>you are on DUNGEON LEVEL ${user.quests.monsterHunt.level+1}!</i>\n`
            winMessage += `👤 <b>${user.first_name}</b> challenges <b>${theMonsterToFight.name}</b> to battle!\n`

            //append curse info if user has any
            console.log(curse1, curse2, 'curses')
            if(curse1||curse2) {
                winMessage += `👹 <b>${user.first_name}</b> is affected by `
                if(curse1&&curse2) {
                    winMessage += ` <i>${user.inventory.cursed[1].name}</i> and <i>${user.inventory.cursed[2].name}</i>!\n`
                } else if(curse1 && !curse2) {
                    winMessage += ` <i>${user.inventory.cursed[1].name}</i>!\n`
                } else if(!curse1 && curse2) {
                    winMessage += ` <i>${user.inventory.cursed[2].name}</i>!\n`
                }
            }

            if(!item1 && !item2) winMessage += `\n`


            winMessage += `🛡️ <b>monster stats</b>:\n`
            winMessage += `- <b>health</b>: <i>${monsterDifficulty} HP</i>\n`
            winMessage += `- <b>attack</b>: <i>${theMonsterToFight.attack} dmg</i>\n\n`
            
            let equippedWeapon1 = user.inventory.equippedWeapon[1] || {}
            let equippedWeapon2 = user.inventory.equippedWeapon[2] || {}

            if(criticalHit) {
                winMessage += `💥<b>YOU GOT CRITICAL HIT!!!</b>💥\n`
            } else {
                winMessage += `💥<b>${user.first_name} STRIKES</b>💥\n`
            }

            //append item info if user has any equipped
            if(item1||item2) {
                winMessage += `🍯 <b>${user.first_name}</b> is invigorated by `
                if(item1&&item2) {
                    winMessage += `<i>${user.inventory.equippedConsumables[1].name}</i> and <i>${user.inventory.equippedConsumables[2].name}</i>!\n\n`
                } else if(item1 && !item2) {
                    winMessage += `<i>${user.inventory.equippedConsumables[1].name}</i>!\n\n`
                } else if(!item1 && item2) {
                    winMessage += `<i>${user.inventory.equippedConsumables[2].name}</i>!\n\n`
                }
            }

            if(!equippedWeapon1.hasOwnProperty('name') && !equippedWeapon2.hasOwnProperty('name')) {
                winMessage += `💥(<b>${bonusChance}</b> lvl bonus + <b>${randomFightDeciderInt}${criticalHit ? `X2 critical` : ``}</b> dmg)💥\n`
            }

            if(equippedWeapon1.hasOwnProperty('name') && !equippedWeapon2.hasOwnProperty('name')) {
                winMessage += `🗡️you fight using <b>${user.inventory.equippedWeapon[1].name}</b>(<i>${user.inventory.equippedWeapon[1].attack}dmg</i>)🗡️\n`
                winMessage += `💥(wpn:<b>${user.inventory.equippedWeapon[1].attack}dmg</b> <b>${bonusChance}</b> lvl dmg + <b>${randomFightDeciderInt}${criticalHit ? `X2 critical` : ``}</b> dmg)💥\n`
            }

            if(!equippedWeapon1.hasOwnProperty('name') && equippedWeapon2.hasOwnProperty('name')) {
                winMessage += `🗡️you fight using <b>${user.inventory.equippedWeapon[2].name}</b>(<i>${user.inventory.equippedWeapon[2].attack}dmg</i>)🗡️\n`
                winMessage += `💥(wpn:<b>${user.inventory.equippedWeapon[2].attack}dmg</b> <b>${bonusChance}</b> lvl dmg + <b>${randomFightDeciderInt}${criticalHit ? `X2 critical` : ``}</b> dmg)💥\n`
            }

            const userIsFullyEquipped = retardHelpers.isInvFull(user.inventory.equippedWeapon)
            if(userIsFullyEquipped) {
                winMessage += `🗡️using <b>${user.inventory.equippedWeapon[1].name}</b>(<i>${user.inventory.equippedWeapon[1].attack}dmg</i>)🗡️\n🗡️and <b>${user.inventory.equippedWeapon[2].name}</b>(<i>${user.inventory.equippedWeapon[2].attack}dmg</i>)🗡️\n`
                winMessage += `💥(wpns:(<b>${user.inventory.equippedWeapon[1].attack}</b> + <b>${user.inventory.equippedWeapon[2].attack}</b>)dmg + <b>${bonusChance}</b> lvl dmg + <b>${randomFightDeciderInt}${criticalHit ? `X2 critical` : ``}</b>dmg)💥\n`
            }

            if(itemAttackBonus > 0) {
                winMessage += `💥(items:(<b>${itemAttackBonus}</b>dmg💥\n`
            }
            if(itemAttackCurse > 0) {
                winMessage += `💥(curse:(<b>-${itemAttackCurse}</b>dmg)💥\n`
            }

            winMessage += `💥<b>YOU HIT FOR ${fightChance} DMG!</b>💥\n\n`

            winMessage += `🔥 <b>victory!</b> 🔥\n`
            user.quests.monsterHunt.combo++
            user.quests.monsterHunt.timestamp = Date.now()
            const didMonstersLevelUp = retardHelpers.checkMonsterLevelUp(user.quests.monsterHunt)
            if(didMonstersLevelUp && !bossBattle) {
                user.quests.monsterHunt.level = Math.min(4, user.quests.monsterHunt.level+1)
                winMessage += `🐊<i>you advanced to </i><b>DUNGEON LEVEL ${user.quests.monsterHunt.level + 1}</b>!!!\n`
            }
            
            if(user.quests.monsterHunt.highscore < user.quests.monsterHunt.combo) {
                user.quests.monsterHunt.highscore = user.quests.monsterHunt.combo
                winMessage += `✨<i>${user.first_name} set a new highscore of ${user.quests.monsterHunt.highscore} monsters killed in a row!</i>\n`
            } else {
                winMessage += `✨<i>${user.first_name} has killed ${user.quests.monsterHunt.combo} monsters in a row!</i>\n`
            }
            winMessage += `- <b>${user.first_name}</b> has vanquished <b>${theMonsterToFight.name}</b>!\n`
            winMessage += `- <b>${theMonsterToFight.xpReward}</b> XP gained!\n`
            winMessage += `- <b>total XP</b>: ${user.xp+theMonsterToFight.xpReward} XP\n\n`

            if(loot === 0) {
                winMessage += '🏆 <b>well fought, brave badger!</b> 🏆'
            } else {
                winMessage += `📦<b>omfg LOOT!!</b>📦\n${loot}`
            }

            // REMOVE ALL CONSUMABLE EFFECTS THAT ARE COMBAT RELATED
            // ALL BUFFS THAT GIVE BONUSDAMAGE, BONUS CRIT, INVULNERABLE
            // AND ALL CURSES THAT WEAKENDAMAGE ETC
            user = retardHelpers.removeAllConsumableCombatEffects(user) 


            await ctx.reply(winMessage, { reply_to_message_id: ctx.message.message_id, parse_mode: 'HTML' })

            user = await this.addXp(ctx, userId, user, theMonsterToFight.xpReward)
        }

        // IF LOSING SCENARIO HERE
        if(fightChance < monsterDifficulty) {
            let invulnerability = false
            let loseMessage
            if(bossBattle) {
                loseMessage = `🦖 <b>A BOSS BATTLE BEGINS!!!</b> 🦖\n`
            } else {
                loseMessage = `⚔️ <b>a battle begins</b> ⚔️\n`                
            }
            loseMessage += `🏰- <i>you are on DUNGEON LEVEL ${user.quests.monsterHunt.level+1}!</i>\n`
            loseMessage += `👤 <b>${user.first_name}</b> challenges <b>${theMonsterToFight.name}</b> to battle!\n`
            //append curse info if user has any
            if(curse1||curse2) {
                loseMessage += `👹 <b>${user.first_name}</b> is affected by `
                if(curse1&&curse2) {
                    loseMessage += ` <i>${user.inventory.cursed[1].name}</i> and <i>${user.inventory.cursed[2].name}</i>!\n`
                } else if(curse1 && !curse2) {
                    loseMessage += ` <i>${user.inventory.cursed[1].name}</i>!\n`
                } else if(!curse1 && curse2) {
                    loseMessage += ` <i>${user.inventory.cursed[2].name}</i>!\n`
                }
            }

            //
            if((user.inventory.equippedConsumables[1].hasOwnProperty('name') && user.inventory.equippedConsumables[1].invulnerable) || (user.inventory.equippedConsumables[2].hasOwnProperty('name') && user.inventory.equippedConsumables[2].invulnerable)) {
                invulnerability = true
            }

            if(!item1 && !item2) loseMessage += `\n`


            loseMessage += `🛡️ <b>monster stats</b>:\n`
            loseMessage += `- <b>health</b>: ${monsterDifficulty} HP\n`
            loseMessage += `- <b>attack</b>: ${theMonsterToFight.attack} dmg\n\n`

            let equippedWeapon1 = user.inventory.equippedWeapon[1] || {}
            let equippedWeapon2 = user.inventory.equippedWeapon[2] || {}

            if(criticalHit) {
                loseMessage += `💥<b>CRITICAL HIT!!!</b>💥\n`
            } else {
                loseMessage += `💥 <b>${user.first_name} STRIKES</b> 💥\n`    
            }

            //append item info if user has any equipped
            if(item1||item2) {
                loseMessage += `🍯 <b>${user.first_name}</b> is invigorated by `
                if(item1&&item2) {
                    loseMessage += ` <i>${user.inventory.equippedConsumables[1].name}</i> and <i>${user.inventory.equippedConsumables[2].name}</i>!\n\n`
                } else if(item1 && !item2) {
                    loseMessage += ` <i>${user.inventory.equippedConsumables[1].name}</i>!\n\n`
                } else if(!item1 && item2) {
                    loseMessage += ` <i>${user.inventory.equippedConsumables[2].name}</i>!\n\n`
                }
            }

            if(!equippedWeapon1.hasOwnProperty('name') && !equippedWeapon2.hasOwnProperty('name')) { // IF NO WEAPONS AT ALL
                loseMessage += `💥 (<b>${bonusChance}</b> lvl bonus + <b>${randomFightDeciderInt}${criticalHit ? `X2 critical` : ``}</b> dmg) 💥\n`
            }

            if(equippedWeapon1.hasOwnProperty('name') && !equippedWeapon2.hasOwnProperty('name')) { // IF WEAPON IN SLOT 1 BUT NOT 2
                loseMessage += `🗡️<b>you fight using ${user.inventory.equippedWeapon[1].name}</b>(<i>${user.inventory.equippedWeapon[1].attack}dmg</i>)🗡️\n`
                loseMessage += `💥(weapons:<b>${user.inventory.equippedWeapon[1].attack}dmg</b> + <b>${bonusChance}</b> lvl dmg + <b>${randomFightDeciderInt}${criticalHit ? `X2 critical` : ``}</b> dmg)💥\n`
            }

            if(!equippedWeapon1.hasOwnProperty('name') && equippedWeapon2.hasOwnProperty('name')) { // IF WEAPON IN SLOT 2 BUT NOT 1
                loseMessage += `🗡️<b>you fight using ${user.inventory.equippedWeapon[2].name}</b>(<i>${user.inventory.equippedWeapon[2].attack}dmg</i>)🗡️\n`
                loseMessage += `💥(weapons:<b>${user.inventory.equippedWeapon[2].attack}dmg</b> + <b>${bonusChance}</b> lvl dmg + <b>${randomFightDeciderInt}${criticalHit ? `X2 critical` : ``}</b> dmg)💥\n`
            }

            if(equippedWeapon1.hasOwnProperty('name') && equippedWeapon2.hasOwnProperty('name')) { // IF WEAPONS IN BOTH SLOTS
                loseMessage += `🗡️<b>using ${user.inventory.equippedWeapon[1].name}</b>(<i>${user.inventory.equippedWeapon[1].attack}dmg</i>)🗡️\n🗡️<b>and ${user.inventory.equippedWeapon[2].name}</b>(<i>${user.inventory.equippedWeapon[2].attack}dmg</i>)🗡️\n`
                loseMessage += `💥(weapons:(<b>${user.inventory.equippedWeapon[1].attack}</b> + <b>${user.inventory.equippedWeapon[2].attack}</b>)dmg + <b>${bonusChance}</b> lvl dmg + <b>${randomFightDeciderInt}${criticalHit ? `X2 critical` : ``}</b> dmg)💥\n`
            }

            if(itemAttackBonus > 0) {
                loseMessage += `💥(items:(<b>${itemAttackBonus}</b>dmg💥\n`
            }
            if(itemAttackCurse > 0) {
                loseMessage += `💥(curse:(<b>-${itemAttackCurse}</b>dmg💥\n`
            }

            loseMessage += `💥<b>YOU HIT FOR ${fightChance} DMG!!</b>💥\n\n`

            loseMessage += `💔<b>defeat!</b>💔\n`
            loseMessage += `- <b>${user.first_name}</b> got pwnd by <b>${theMonsterToFight.name}</b>😞\n`
            loseMessage += `😞<i>your killcombo has been reset from ${user.quests.monsterHunt.combo} to 0</i>\n😞<i>your DUNGEON LEVEL has been reset to 1</i>\n`
            if(invulnerability) {
                loseMessage += `- <b>${theMonsterToFight.attack}</b> XP would be lost in damage <i>BUT YOU ARE INVULNERABLE</i>!\n`
            } else {
                loseMessage += `- <b>${theMonsterToFight.attack}</b> XP lost!\n`                
            }
            loseMessage += `- <b>total XP</b>: ${user.xp} XP\n\n`
            loseMessage += `💪<b>keep foightin, you'll get em next time</b>💪`

            user = retardHelpers.removeAllConsumableCombatEffects(user)

            await ctx.reply(loseMessage, { reply_to_message_id: ctx.message.message_id, parse_mode: 'HTML' })
            user.quests.monsterHunt.combo = 0
            user.quests.monsterHunt.timestamp = Date.now()
            user.quests.monsterHunt.level = 0
            if(invulnerability) {
                user = await this.subtractXp(ctx, userId, user, 0)                
            }
            user = await this.subtractXp(ctx, userId, user, theMonsterToFight.attack)
        }
    },
    async fightUser(ctx, userId, targetUserId) {
        if(!ctx||!userId||!targetUserId) throw Error('didnt receive the proper variables in fightuser')
        if(userId === targetUserId) return await ctx.reply(`you cant fight yourself you lunatic`)
        let user = await pkg.getItem(userId.toString())
        if(!user) throw Error('user not found mayne')
        let targetUser = await pkg.getItem(targetUserId.toString())
        if(!targetUser) throw Error('target user not found mayne')
        let timeReq = 300000 //5mins

        let unix_timestamperoni = Date.now()

        let timeDiff = unix_timestamperoni - user.fightTimer
        if(timeDiff <= timeReq) return await ctx.reply(`wait for ${Math.floor((timeReq - timeDiff)/1000)} seconds until you fight again you rowdy badger`)

        let userDamage = 0
        let userWeapons = []
        let targetUserDamage = 0
        let targetUserWeapons = []

        //assemble damage and weapons for user
        if(user.inventory.equippedWeapon[1].hasOwnProperty('name')) {
            userDamage += user.inventory.equippedWeapon[1].attack
            userWeapons.push(user.inventory.equippedWeapon[1])
        }

        if(user.inventory.equippedWeapon[2].hasOwnProperty('name')) {
            userDamage += user.inventory.equippedWeapon[2].attack
            userWeapons.push(user.inventory.equippedWeapon[2])
        }

        //assemble damage and weapons for targetUser
        if(targetUser.inventory.equippedWeapon[1].hasOwnProperty('name')) {
            targetUserDamage += targetUser.inventory.equippedWeapon[1].attack
            targetUserWeapons.push(targetUser.inventory.equippedWeapon[1])
        }

        if(targetUser.inventory.equippedWeapon[2].hasOwnProperty('name')) {
            targetUserDamage += targetUser.inventory.equippedWeapon[2].attack
            targetUserWeapons.push(targetUser.inventory.equippedWeapon[2])
        }

        let randomDamageInt1 = await randomInt(0, 101)
        let randomDamageInt2 = await randomInt(0, 101)
        let crit1 = false
        let crit2 = false
        if(randomDamageInt1 >= 95) {
            crit1 = true
            randomDamageInt1 = (randomDamageInt1 * 2)
        }
        if(randomDamageInt2 >= 95) {
            crit2 = true
            randomDamageInt2 = (randomDamageInt2 * 2)
        }

        let userBonusChance = Math.floor(user.level/10)
        if(userBonusChance > 10) userBonusChance = 10

        let targetUserBonusChance = Math.floor(targetUser.level/10)
        if(targetUserBonusChance > 10) targetUserBonusChance = 10
        
        userDamage += randomDamageInt1
        targetUserDamage += randomDamageInt2

        userDamage += userBonusChance
        targetUserDamage += targetUserBonusChance

        let message = `🥊<b>${user.first_name}</b> starts a brawl with <b>${targetUser.first_name}</b>🥊\n\n`

        if(crit1) {
            message += `🤜💥<b>${user.first_name}</b> GETS <i>A CRITICAL HIT</i>!!!\n`
        } else {
            message += `🤜💥<b>${user.first_name}</b> STRIKES\n`
        }
        if(userWeapons.length > 0) {
            message += `🤜💥using <b>${userWeapons[0].name}</b>(<i>${userWeapons[0].attack}dmg</i>)\n`
            if(userWeapons.length > 1) {
                message += `🤜💥and <b>${userWeapons[1].name}</b>(<i>${userWeapons[1].attack}dmg</i>)\n`
            }
        }

        message += `🤜💥<b>${user.first_name}</b> does <i>${userDamage}dmg</i>!\n\n`

        if(crit2) {
            message += `<b>${targetUser.first_name}</b> GETS <i>A CRITICAL HIT</i>!!!💥🤛\n`
        } else {
            message += `<b>${targetUser.first_name}</b> strikes!💥🤛\n`            
        }

        if(targetUserWeapons.length > 0) {
            message += `using <b>${targetUserWeapons[0].name}</b>(<i>${targetUserWeapons[0].attack}dmg</i>)💥🤛\n`
            if(targetUserWeapons.length > 1) {
                message += `and <b>${targetUserWeapons[1].name}</b>(<i>${targetUserWeapons[1].attack}dmg</i>)💥🤛\n`
            }
        }

        message += `<b>${targetUser.first_name}</b> does <i>${targetUserDamage}dmg</i>!💥🤛\n\n`

        message += `🔥🔥<b>well fought lads, now hug!</b>!🔥🔥`
        
        await ctx.reply(message, {reply_to_message_id: ctx.message.message_id, parse_mode:'HTML'})
        
        user = await this.subtractXp(ctx, userId, user, userDamage)
        targetUser = await this.subtractXp(ctx, targetUserId, targetUser, targetUserDamage)
        
        console.log(user, targetUser, 'herheherhehrehreh3')

        user.fightTimer = Date.now()

        let success1 = await pkg.setItem(userId.toString(), user)
        let success2 = await pkg.setItem(targetUserId.toString(), targetUser)

    },
    async addXp(ctx, userId, user, xpToAdd) {
        if(!userId || !user || !xpToAdd) throw Error('no userId or xp provided')
        user.xp += xpToAdd
        user = await this.checkLevelUp(ctx, user)
        let success = await pkg.setItem(userId.toString(), user)
        console.log(Date.now(), `added ${xpToAdd} xp to`, user.first_name, userId)
        return user
    },
    async subtractXp(ctx, userId, user, xpToRemove) {
        if(!userId || !user || !xpToRemove) throw Error('no userId or xp provided')
        user.xp -= xpToRemove
        if(user.xp < 0) user.xp = 0
        user = await this.checkLevelDown(ctx, user)
        let success = await pkg.setItem(userId.toString(), user)
        console.log(Date.now(), `removed ${xpToRemove} xp from`, user.first_name, userId)
        return user
    },
    async getInv(ctx, userId) {
        if(!ctx||!userId) throw Error('no ctx or userId in getInv')
        let user = await pkg.getItem(userId.toString())
        if(!user) throw Error('no user found in getInv')

        let inv = `🎒 ${user.first_name}'s STUFF 🎒\n\n`

        let weaponry = []
        let equippedWeaponry = []
        for(let key in user.inventory.weapons) {
            if(user.inventory.weapons[key].hasOwnProperty('name')) {
                weaponry.push(user.inventory.weapons[key])
            }
        }

        for(let key in user.inventory.equippedWeapon) {
            if(user.inventory.equippedWeapon[key].hasOwnProperty('name')) {
                equippedWeaponry.push(user.inventory.equippedWeapon[key])
            }
        }

        if(user.inventory.equippedWeapon[1].hasOwnProperty('name')||user.inventory.equippedWeapon[2].hasOwnProperty('name')) {
            
            inv += `⚔️<b>equipped weapons:</b>⚔️\n[ `
            
            for(let key in user.inventory.equippedWeapon) {
                if(user.inventory.equippedWeapon[key].hasOwnProperty('name')) {
                    inv += `${key}. <b>${user.inventory.equippedWeapon[key].name}</b>(<i>${user.inventory.equippedWeapon[key].attack}dmg</i>)`
                } else {
                    inv += `${key}. <i>empty</i>`
                }

                if(parseInt(key) === 1) {
                    inv += ' | '
                }

                if(parseInt(key) === 2) {
                    inv += ' ]\n\n'
                }
            }
        }

        if(user.inventory.equippedConsumables[1].hasOwnProperty('name')||user.inventory.equippedConsumables[2].hasOwnProperty('name')) {
            
            inv += `⚗️<b>active items:</b>⚗️\n[ `
            
            for(let key in user.inventory.equippedConsumables) {
                if(user.inventory.equippedConsumables[key].hasOwnProperty('name')) {
                    inv += `${key}. <b>${user.inventory.equippedConsumables[key].name}</b>`
                } else {
                    inv += `${key}. <i>empty</i>`
                }

                if(parseInt(key) === 1) {
                    inv += ' | '
                }

                if(parseInt(key) === 2) {
                    inv += ' ]\n\n'
                }
            }
        }

        if(user.inventory.cursed[1].hasOwnProperty('name')||user.inventory.cursed[2].hasOwnProperty('name')) {
            
            inv += `👹<b>active curses:</b>👹\n[ `
            
            for(let key in user.inventory.cursed) {
                if(user.inventory.cursed[key].hasOwnProperty('name')) {
                    inv += `${key}. <b>${user.inventory.cursed[key].name}</b>`
                } else {
                    inv += `${key}. <i>empty</i>`
                }

                if(parseInt(key) === 1) {
                    inv += ' | '
                }

                if(parseInt(key) === 2) {
                    inv += ' ]\n\n'
                }
            }
        }

        inv += "💼<b>weapons inventory</b>💼\n[ "

        for(let key in user.inventory.weapons) {
            if(user.inventory.weapons[key].hasOwnProperty('name')) {
                inv += `${key}. <b>${user.inventory.weapons[key].name}</b>(<i>${user.inventory.weapons[key].attack}dmg</i>)`
            } else {
                inv += `${key}. <i>empty</i>`
            }

            if(parseInt(key) > 0 && parseInt(key) < 5) {
                inv += ' | '
            }

            if(parseInt(key) === 5) {
                inv += ' ]\n\n'
            }
        }

        inv += "⚗️<b>consumable item inventory</b>⚗️\n[ "

        for(let key in user.inventory.consumables) {
            if(user.inventory.consumables[key].hasOwnProperty('name')) {
                inv += `${key}. <b>${user.inventory.consumables[key].name}</b>`
            } else {
                inv += `${key}. <i>empty</i>`
            }

            if(parseInt(key) > 0 && parseInt(key) < 5) {
                inv += ' | '
            }

            if(parseInt(key) === 5) {
                inv += ' ]\n\n'
            }
        }

        await ctx.reply(inv, {reply_to_message_id: ctx.message.message_id, parse_mode: 'HTML'})
    },
    async giveRandomWeapon(ctx, userId) {
        if(!ctx||!userId) throw Error('no userId or ctx in giveRandomWeapon')
        let user = await pkg.getItem(userId.toString())
        if(!user) throw Error('user not found')

        let theWeapons = user.inventory.weapons
        let counter = 0
        let isInvFull = retardHelpers.isInvFull(theWeapons)
        if(isInvFull) return await ctx.reply('this dude has 5 weapons in his inv which is max!')

        const awardedWeapon = retardHelpers.getRandomWeapon()

        let userHasFreeSlot = retardHelpers.findFreeSlot(user.inventory.weapons)
        let userAlreadyHasThatWeapon = retardHelpers.findDuplicate(user.inventory.weapons, awardedWeapon.name)

        if(userHasFreeSlot && !userAlreadyHasThatWeapon) {
            console.log('adding', awardedWeapon.name, 'to', userId, user.first_name)
            user.inventory.weapons[userHasFreeSlot] = awardedWeapon
        }

        if(userAlreadyHasThatWeapon) return await ctx.reply(`you got ${awardedWeapon.name} but you already have that so i threw it in the bushes`, {reply_to_message_id: ctx.message.message_id, parse_mode:'HTML'})

        let success = await pkg.setItem(userId.toString(), user)
        await ctx.reply(`${user.first_name} just found <b>${awardedWeapon.name}</b>!`, {reply_to_message_id: ctx.message.message_id, parse_mode:'HTML'})
        return true
    },
    async giveRandomItem(ctx, userId) {
        if(!ctx||!userId) throw Error('no userId or ctx in giveRandomItem')
        let user = await pkg.getItem(userId.toString())
        if(!user) throw Error('user not found')

        let theItems = user.inventory.consumables
        let isInvFull = retardHelpers.isInvFull(theItems)
        if(isInvFull) return await ctx.reply('this dude has 5 consumable items in his inv which is max!')

        const awardedItem = retardHelpers.getRandomConsumable()

        const userHasFreeSlot = retardHelpers.findFreeSlot(user.inventory.consumables)
        const userAlreadyHasThatItem = retardHelpers.findDuplicate(user.inventory.consumables, awardedItem.name)

        if(userHasFreeSlot && !userAlreadyHasThatItem) {
            console.log('adding', awardedItem.name, 'to', userId, user.first_name)
            user.inventory.consumables[userHasFreeSlot] = awardedItem
        }

        if(userAlreadyHasThatItem) return await ctx.reply(`you got ${awardedItem.name} but you already have that so i threw it in the bushes`)

        let success = await pkg.setItem(userId.toString(), user)
        let message = `📦<b>${user.first_name}</b> found ${awardedItem.name}📦\n\ndescription:\n${awardedItem.descr}`
        await ctx.reply(message, {reply_to_message_id: ctx.message.message_id, parse_mode:'HTML'})
        return true
    },
    async clearInventory(ctx, userId) {
        let user = await pkg.getItem(userId.toString())
        if(!user) throw Error('user not found baby')
        //clear inventory by overwriting it all with the default inv schema
        user.inventory = retardSchemas.defaultInvSchema()
        let success = await pkg.setItem(userId.toString(), user)
        await ctx.reply(`cleared inv for ${user.first_name}`, {reply_to_message_id: ctx.message.message_id, parse_mode:'HTML'})
    },
    async inspectItem(ctx, userId, itemNumberToInspect) {
        if(!ctx || !userId || !itemNumberToInspect) throw Error('missing variables in retardTracker.inspectItem')
        let user = await pkg.getItem(userId.toString())
        if(!user) throw Error('no user found babe')

        let empty = retardHelpers.isInvEmpty(user.inventory.consumables)

        if(empty) return await ctx.reply('mate, you dont have any consumable items.', {reply_to_message_id: ctx.message.message_id, parse_mode:'HTML'})

        if(!user.inventory.consumables[itemNumberToInspect].hasOwnProperty('name')) return await ctx.reply('that inv slot is empty')

        let theItemToInspect = user.inventory.consumables[itemNumberToInspect]

        let message = `⚗️ <b>${theItemToInspect.name}</b> ⚗️\n\ndescription:\n${theItemToInspect.descr}`

        await ctx.reply(message, {parse_mode: 'HTML'})
    },
    async equipConsumable(ctx, userId, itemNumberToEquip) {
        if(!ctx || !userId || !itemNumberToEquip) throw Error('missing variables in retardTracker.equipConsumable')
        let user = await pkg.getItem(userId.toString())
        if(!user) throw Error('no user found babe')

        let empty = retardHelpers.isInvEmpty(user.inventory.consumables)
        if(empty) return await ctx.reply('mate, you dont have any consumable items.', {reply_to_message_id: ctx.message.message_id, parse_mode:'HTML'})

        let theItemToEquip = user.inventory.consumables[itemNumberToEquip]

        //check if inventory is full and if the item used is sticky or not (bonusXp is consumed upon use and doesnt need a free slot.... and curses target another user)
        let isInvFull = retardHelpers.isInvFull(user.inventory.equippedConsumables)
        if(isInvFull && !user.inventory.consumables[itemNumberToEquip].bonusXp && !theItemToEquip.isCurse) return await ctx.reply('mate, your item slots are full', {reply_to_message_id: ctx.message.message_id, parse_mode:'HTML'})
        if(!user.inventory.consumables[itemNumberToEquip].hasOwnProperty('name')) return await ctx.reply('that inv slot is empty', {reply_to_message_id: ctx.message.message_id, parse_mode:'HTML'})

        //instantiate so it can be used outside of "!isCurse" scope
        let bonusXp = false
        let minusXp = false
        let message

        //if the item is NOT a curse we do the simple shit:
        if(!theItemToEquip.isCurse) {
            let userHasDuplicate = retardHelpers.findDuplicate(user.inventory.equippedConsumables, theItemToEquip.name)

            if (userHasDuplicate) return await ctx.reply('you cant equip the same item twice', {reply_to_message_id: ctx.message.message_id, parse_mode:'HTML'})

            message = `⚗️<b>${user.first_name}</b> used <i>${theItemToEquip.name}</i>!⚗️\n\n`

            //if its not a bonusXp-instant-use item then we need to equip it
            if(!theItemToEquip.bonusXp) {
                // CHECK WHICH SLOT IS EMPTY AND EQUIP
                let userHasFreeSlot = retardHelpers.findFreeSlot(user.inventory.equippedConsumables)
                if(!userHasFreeSlot) return await ctx.reply('no free item slots available')
                user.inventory.equippedConsumables[userHasFreeSlot] = theItemToEquip
            } else {
                //if it IS a bonusXP one-time-use item we need to remove it entirely and add the XP
                bonusXp = true
                message += `✨<i>they gain ${theItemToEquip.bonusXp}XP</i>!✨\n`
            }

            message += `<b>${user.first_name}</b> ${theItemToEquip.effect[0]}\n\n${theItemToEquip.effect[1]}`
        }

        //instantiate these so they can be used in the last step outside of "isCurse" scope
        let targetUserId
        let targetUser
        if(theItemToEquip.isCurse) {
            //if it is a curse we need to extract the ID of the targeted user
            //and do the proper checks(if target is a bot etc)
            const repliedMessage = ctx.message.reply_to_message
            if (!repliedMessage) {
                return await ctx.reply('please reply to a message from the user you want to curse.', {reply_to_message_id: ctx.message.message_id, parse_mode:'HTML'});
            }
            targetUserId = repliedMessage.from.id
            if(!targetUserId) return console.log('no id found in useitem/curse')
            console.log(targetUserId, '<-the id of the guy we want to curse', userId, '<-myId')
            if(repliedMessage.from.is_bot) {
                return ctx.reply('you cannot target a bot with a curse.', {reply_to_message_id: ctx.message.message_id, parse_mode:'HTML'})
            }
            if(userId === targetUserId) return await ctx.reply(`dont curse yourself you lunatic!`)
            targetUser = await pkg.getItem(targetUserId.toString())
            if(!targetUser) throw Error('target user not found mayne')

            let targetAlreadyHasThatCurse = retardHelpers.findDuplicate(user.inventory.cursed, theItemToEquip.name)
            if(targetAlreadyHasThatCurse) {
                return await ctx.reply('you cant give em the same curse twice!', {reply_to_message_id: ctx.message.message_id, parse_mode:'HTML'})
            }
            //if target has two curses already, deny curse
            let targetIsFullyCursed = retardHelpers.isInvFull(targetUser.inventory.cursed)
            if(targetIsFullyCursed) {
                return await ctx.reply(`poor little ${targetUser.first_name} is fully cursed with <i>${targetUser.inventory.cursed[1].name}</i> and <i>${targetUser.inventory.cursed[1].name}</i>`, {reply_to_message_id: ctx.message.message_id, parse_mode:'HTML'})
            }



            //FIX CURSE MUTE HERE PROBABLY

            message = `⚗👹<b>${user.first_name}</b> has cursed <b>${targetUser.first_name}</b>!👹⚗️\n\n`

            //if the curse is "sticky" and needs to remain on targetUser, we need to put it in a free slot in .cursed
            console.log(theItemToEquip, 'curse sticky weakenXp part here here here here')
            if(!theItemToEquip.curse.weakenXp&&!theItemToEquip.curse.dispelConsumable) {
                console.log('inside')
                let targetUserHasFreeSlot = retardHelpers.findFreeSlot(targetUser.inventory.cursed)
                if(!targetUser) return await ctx.reply('target is fully cursed')
                targetUser.inventory.cursed[targetUserHasFreeSlot] = theItemToEquip
            } else {
                //if the curse is weakenXp, we just want to remove XP from the target (its not a 'sticky' curse, its consumed upon use)
                if(theItemToEquip.curse.weakenXp > 0) {
                    minusXp = true
                }

            }

            message += `<b>${user.first_name}</b> ${theItemToEquip.effect[0]} <b>${targetUser.first_name}</b>\n\n<b>${targetUser.first_name}</b> ${theItemToEquip.effect[1]}`
        }

        user.inventory.consumables[itemNumberToEquip] = {}
        await ctx.reply(message, {reply_to_message_id: ctx.message.message_id, parse_mode:'HTML'})

        if(bonusXp) user = await this.addXp(ctx, userId, user, theItemToEquip.bonusXp)
        if(minusXp) targetUser = await this.subtractXp(ctx, targetUserId, targetUser, theItemToEquip.curse.weakenXp)
        if(theItemToEquip.curse.dispelConsumable) targetUser = retardHelpers.clearEquippedConsumables(targetUserId, targetUser)

        let success = await pkg.setItem(userId.toString(), user)
        if(theItemToEquip.isCurse) {
            console.log(targetUser, 'updating targetUser after curse')
            let success2 = await pkg.setItem(targetUserId.toString(), targetUser)
        }
        return true
    },
    async equipWeapon(ctx, userId, weaponNumberToEquip) {
        if(!ctx || !userId || !weaponNumberToEquip) throw Error('missing variables in retardTracker.equipWeapon')
        let user = await pkg.getItem(userId.toString())
        if(!user) throw Error('no user found babe')

        let empty = true

        for(let key in user.inventory.weapons) {
            if(user.inventory.weapons[key].hasOwnProperty('name')) {
                empty = false
            }
        }
        if(empty) return await ctx.reply('mate, you dont have any weapons.')

        const isEquippedWeaponsFull = retardHelpers.isInvFull(user.inventory.equippedWeapon)
        if(isEquippedWeaponsFull) return await ctx.reply('mate, you are fully equipped already')
        if(!user.inventory.weapons[weaponNumberToEquip].hasOwnProperty('name')) return await ctx.reply('that inv slot is empty', {reply_to_message_id: ctx.message.message_id, parse_mode:'HTML'})

        let theWeaponToEquip = user.inventory.weapons[weaponNumberToEquip]


        const userHasDuplicate = retardHelpers.findDuplicate(user.inventory.equippedWeapon, theWeaponToEquip.name)
        if (userHasDuplicate) return await ctx.reply('you cant equip the same item twice', {reply_to_message_id: ctx.message.message_id, parse_mode:'HTML'})

        // CHECK WHICH SLOT IS EMPTY AND EQUIP
        const freeSlot = retardHelpers.findFreeSlot(user.inventory.equippedWeapon)
        if(!freeSlot) return await ctx.reply('you do not have a free slot to equip that weapon')
        user.inventory.equippedWeapon[freeSlot] = theWeaponToEquip

        let success = await pkg.setItem(userId.toString(), user)
        return await ctx.reply(`⚔️you have equipped <b>${theWeaponToEquip.name}</b>(<i>${theWeaponToEquip.attack}dmg</i>)⚔️`, {parse_mode:'HTML'})
    },
    async unequipWeapon(ctx, userId, weaponNumberToUnequip) {
        if(!ctx || !userId || !weaponNumberToUnequip) throw Error('missing variables in retardTracker.unequipWeapon')
        let user = await pkg.getItem(userId.toString())
        if(!user) throw Error('no user found babe')
        let isEquippedWeaponsEmpty = retardHelpers.isInvEmpty(user.inventory.equippedWeapon)
        if(isEquippedWeaponsEmpty) return await ctx.reply('mate, you are fully unequipped already', {reply_to_message_id: ctx.message.message_id, parse_mode:'HTML'})

        if(!user.inventory.equippedWeapon[weaponNumberToUnequip].hasOwnProperty('name')) return await ctx.reply('mate, that slot is empty already', {reply_to_message_id: ctx.message.message_id, parse_mode:'HTML'})

        let theUnequippedWeapon = user.inventory.equippedWeapon[weaponNumberToUnequip]
        user.inventory.equippedWeapon[weaponNumberToUnequip] = {}
        let success = await pkg.setItem(userId.toString(), user)
        return await ctx.reply(`⚔️you have unequipped <b>${theUnequippedWeapon.name}</b>(<i>${theUnequippedWeapon.attack}dmg</i>)⚔️`, {reply_to_message_id: ctx.message.message_id, parse_mode:'HTML'})
    },
    async removeWeapon(ctx, userId, itemToRemove) {
        if(!ctx || !userId || !itemToRemove) throw Error('missing variables in retardTracker.removeWeapon')
        let user = await pkg.getItem(userId.toString())
        if(!user) throw Error('no user found babe')
        
        let empty = true
        for(let key in user.inventory.weapons) {
            if(user.inventory.weapons[key].hasOwnProperty('name')) {
                empty = false
            }
        }
        if(empty) throw Error('no weapons in this fellas inv')

        if(!user.inventory.weapons[itemToRemove].hasOwnProperty('name')) {
            return await ctx.reply('that inv slot is empty',{reply_to_message_id: ctx.message.message_id, parse_mode:'HTML'})
        }
        let theRemovedItem = user.inventory.weapons[itemToRemove]

        for(let key in user.inventory.equippedWeapon) {
            if(user.inventory.equippedWeapon[key].name === theRemovedItem.name) {
                return await ctx.reply('you need to /unequip that before throwing it away', {reply_to_message_id: ctx.message.message_id, parse_mode:'HTML'})
            }
        }

        user.inventory.weapons[itemToRemove] = {}
        let success = await pkg.setItem(userId.toString(), user)
        return await ctx.reply(`⚔️you tossed <b>${theRemovedItem.name}</b>(<i>${theRemovedItem.attack}dmg</i>) into the jungle never to be seen again`, {reply_to_message_id: ctx.message.message_id, parse_mode:'HTML'})
    },
    async removeItem(ctx, userId, itemToRemove) {
        if(!ctx || !userId || !itemToRemove) throw Error('missing variables in retardTracker.removeItem')
        let user = await pkg.getItem(userId.toString())
        if(!user) throw Error('no user found babe')
        
        let empty = true
        for(let key in user.inventory.consumables) {
            if(user.inventory.consumables[key].hasOwnProperty('name')) {
                empty = false
            }
        }
        if(empty) throw Error('no items in this fellas inv')

        if(!user.inventory.consumables[itemToRemove].hasOwnProperty('name')) {
            return await ctx.reply('that inv slot is empty',{reply_to_message_id: ctx.message.message_id, parse_mode:'HTML'})
        }

        let theRemovedItem = user.inventory.consumables[itemToRemove]

        user.inventory.consumables[itemToRemove] = {}
        let success = await pkg.setItem(userId.toString(), user)
        return await ctx.reply(`⚔️you tossed <b>${theRemovedItem.name}</b> into the jungle never to be seen again`, {reply_to_message_id: ctx.message.message_id, parse_mode:'HTML'})
    },
    async verifyWallet(ctx, userId) {
        if(!ctx||!userId) throw Error('no ctx or userId in verifyWallet')
        let user = await retardHelpers.getUser(userId)
        if(!user) throw Error('no user found in verifyWallet')
        if(!user.hasOwnProperty('wallet') || !user.hasOwnProperty('isVerified')) {
            user.wallet = {
                ethAddress: '',
                ethSignature: '',
                solAddress: '',
                solSignature: '',
                timestamp: 0
            }
            user.isVerified = false
        }

        if(user.isVerified) return await ctx.reply(`Mr. Badger... you're already verified`)

        //if we find the message in the temporary Map of verificationMessages, we can proceed to extract the signed message and verify it
        if(verificationMessages.get(userId)) {
            const verificationMessage = verificationMessages.get(userId)
            if(!verificationMessage) throw Error('couldnt fetch verificationmessage from verificationMessages')

            // get the fuckin command and the signed message (/verify <signedmessage>)
            const message = ctx.message.text
            if(!message) throw Error('couldnt extract text from /verify message')

            // regex to get the text that starts with 0x after /verify and ignore any extra stuff
            const match = message.match(/^\/verify (0x[A-Za-z0-9]+)$/)

            if (match) {
                // the number is the first captured group
                const theSignedMessage = match[1]
                console.log(verificationMessage, 'the original verificationMessage')
                console.log(theSignedMessage, 'the signed message')
                let recoveredAddress = false
                try {
                    recoveredAddress = verifyMessage(verificationMessage, theSignedMessage)                    
                } catch(e) {
                    return await ctx.reply(`couldnt decode your signed message - please make sure its correct and try again\n\nhere comes the message for you to sign again:\n\n${verificationMessage}`, {reply_to_message_id: ctx.message.message_id})
                }
                if(!recoveredAddress) throw Error('couldnt recover address')
                user.wallet.ethAddress = recoveredAddress
                user.wallet.ethSignature = theSignedMessage
                user.wallet.timestamp = Date.now()
                user.isVerified = true
                verificationMessages.delete(userId)
                let success = await pkg.setItem(userId.toString(), user)
                return await ctx.reply(`🚀<b>${user.first_name} is VERIFIED</b>🚀\n\n🕒<b>at time:</b> ${new Date(user.wallet.timestamp).toLocaleString()}\n\n🐾<i>YOU ARE NOW A VERIFIED BADGER!</i>🐾`, {parse_mode: 'HTML'})
            } else {
                return await ctx.reply(`couldnt extract the signed message you sent, please make sure its correct and try again\n\nhere comes the message for you to sign again:\n\n${verificationMessage}`)
            }
        }

        //here we start the verification process
        const nonce = `verify ownership for ${userId}/${user.first_name} at ${new Date(Date.now()).toLocaleString()}`
        await verificationMessages.set(userId, nonce)
        return await ctx.reply(`1. please go to https://etherscan.io/verifiedSignatures\n\n2. copy the message below EXACTLY and sign it with your wallet:\n\n${nonce}\n\n3. come back here and do /verify <paste signed message>`)
    },
    async checkExistingUserAndCreateNew(user) {
        const userId = user.id
        const {first_name, last_name, username} = user 
        const existsOrNot = await pkg.getItem(userId.toString())
        if (!existsOrNot) {
            const newUser = { 
                username: username||'Hidden', 
                first_name: first_name, 
                last_name: last_name, 
                xp: 0,
                level: 0,
                dumpstars: 0
            }

            await pkg.setItem(userId.toString(), newUser)
        }
        return user
    }
}
