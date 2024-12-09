import pkg from 'node-persist'
import fs from 'fs/promises'
import path from 'path'
import { randomInt } from 'crypto'
import monsters from './monsters.json' assert { type: 'json' }
import weapons from './weapons.json' assert { type: 'json' }
const { init, getItem, setItem, values } = pkg
// start the fuckin node-persist storage
await init({ dir: './user-data' })

let userSchema = { 
            username: '', 
            first_name: '', 
            last_name: '', 
            xp: 0,
            level: 0,
            dumpstars: 0,
            quests: {
                dailyxp: {
                    timestamp: 0,
                    combo: 0
                }
            }
        }

export const retardTracker = {
    async awardChatXP (ctx, user) {
        const {username, first_name, last_name} = user
        const userId = user.id
        let userToAwardXP = await pkg.getItem(userId.toString()) || { 
            username: username || 'Hidden', 
            first_name: first_name || '', 
            last_name: last_name || '', 
            xp: 0,
            level: 0,
            dumpstars: 0 
        }
        userToAwardXP.xp += 3 // i dunno, 3 XP per message sounds like a dumb number to award instead of 1
        userToAwardXP = await this.checkLevelUp(ctx, userToAwardXP)
        if (userToAwardXP) await pkg.setItem(userId.toString(), userToAwardXP)
        console.log('successfully added xp from chat', userToAwardXP, userId)
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
        if(counter >= 1) await ctx.reply(`🎉${user.first_name} got ${counter} level(s) to reach <b>level ${user.level}</b> you crazy bastard!🎉`, {parse_mode: 'HTML'});

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

        if(counter >= 1) await ctx.reply(`oh shit ${user.first_name ? `<b>${user.first_name}</b>` : "Hidden"}!!\n\n you lost ${counter} level(s) and badgered your way DOWN to level ${user.level} you crazy bastard!`, {parse_mode: 'HTML'});
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
        console.log(user, user.xp, 'before oeprations in givexp')
        if(amountToGive <= 0 || amountToGive > 1000) return ctx.reply('you need to give a number between 1 and 1000')
        user.xp += amountToGive
        console.log(user, user.xp, 'after operations in givexp')
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
        console.log(user, user.xp, 'before oeprations')
        if(amountToRemove > user.xp) {
            ctx.reply('cant subtract more xp than the user has')
            return false
        }
        if(amountToRemove <= 0 || amountToRemove > 1000) {
          ctx.reply('you need to give a number between 1 and 1000')  
          return false
        } 
        user.xp -= amountToRemove
        console.log(user, user.xp, 'after operations')
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
        console.log(user.quests.dailyxp, 'does he have a highscore property on dailyxp? answer:', user.quests.dailyxp.hasOwnProperty('highscore'))
        console.log(user.quests.monsterHunt, 'does he have a highscore property on monsterHunt? answer:', user.quests.monsterHunt.hasOwnProperty('highscore'))

        if (!user.quests.dailyxp.hasOwnProperty('highscore')) {
            user.quests.dailyxp.highscore = 0
        }
        if (!user.quests.monsterHunt.hasOwnProperty('highscore')) {
            user.quests.monsterHunt.highscore = 0
            console.log('set monsterhunt highscore because it was missing', user.first_name, userId)
        }
        if(!user.quests) {
            user.quests = {
                dailyxp: {
                    timestamp: 0,
                    combo: 0,
                    highscore: 0
                },
                monsterHunt: {
                    timestamp: 0,
                    combo: 0,
                    highscore: 0
                }
            }
        }
        console.log(unix_timestamperoni, 'timestamp')
        let timeDifference = unix_timestamperoni - user.quests.dailyxp.timestamp
        if(timeDifference >= 86400000 && timeDifference <= 172800000) { //check if its been more than 24hours but less than 48hours
            user.quests.dailyxp.timestamp = unix_timestamperoni
            user.quests.dailyxp.combo++
            let bonusXp
            if(user.quests.dailyxp.combo > 0) {
                bonusXp = user.quests.dailyxp.combo * 5
                user.xp += bonusXp
            }
            user.xp += 50
            user = await this.checkLevelUp(ctx, user)
            let success = await pkg.setItem(userId.toString(), user)
            return user
        } else if(timeDifference >= 86400000 && timeDifference >= 172800000) {
            user.quests.dailyxp.timestamp = unix_timestamperoni
            if(user.quests.dailyxp.combo > user.quests.dailyxp.highscore) {
                user.quests.dailyxp.highscore = user.quests.dailyxp.combo
            } 
            user.quests.dailyxp.combo = 0
            user.xp += 50
            user = await this.checkLevelUp(ctx, user)
            let success = await pkg.setItem(userId.toString(), user)
            return user
        }
        return timeDifference
    },
    async battleMonster(ctx, userId) {
        let user = await pkg.getItem(userId.toString())
        if(!user) throw Error('user not found baby')
        if(!monsters) throw Error('monsters list empty of failed to load babe')
        if(!user.quests) {
            user.quests = {
                dailyxp: {
                    timestamp: 0,
                    combo: 0,
                    highscore: 0
                },
                monsterHunt: {
                    timestamp: 0,
                    combo: 0,
                    highscore: 0
                }
            }
        }
        if(!user.quests.monsterHunt) {
            user.quests.monsterHunt = {
                timestamp: 0,
                combo: 0,
                highscore: 0
            }
        }
        if(!user.inventory) { //florp
            user.inventory = {
                equippedWeapon: [],
                equippedArmor: [],
                weapons: [],
                armor: []
            }
        }
        let timeReq = 300000 // 5mins
        let current_unix_timestamperoni = Date.now()
        let timeDiff = current_unix_timestamperoni - user.quests.monsterHunt.timestamp
        if(timeDiff <= timeReq) return ctx.reply(`chill for ${Math.floor((timeReq - timeDiff)/1000)} more seconds, you rowdy badger`)

        const randomMonsterInt = await randomInt(0, monsters.length)
        //const randomMonsterInt = Math.floor(Math.random() * monsters.length)
        const randomFightDeciderInt = await randomInt(0, 101)

        const theMonsterToFight = monsters[randomMonsterInt]

        let bonusChance = Math.floor(user.level/10)
        if(bonusChance > 10) bonusChance = 10
        let weaponAttackBonus = 0
        if(user.inventory.equippedWeapon.length > 0) {
            for(let i = 0; i < user.inventory.equippedWeapon.length; i++){
                weaponAttackBonus = weaponAttackBonus + user.inventory.equippedWeapon[i].attack
            }
        }
        let monsterDifficulty = theMonsterToFight.diff + 30
        let fightChance = randomFightDeciderInt + weaponAttackBonus + bonusChance

        // IF WINNING SCENARIO HERE
        if(fightChance > monsterDifficulty) {

            const randomChanceForLoot = await randomInt(0, 2)
            let loot = 0
            if(randomChanceForLoot === 0) {
                // efter armor eller consumables introducerats så måste vi ha logic för att awarda det 
                const randomWeapon = await randomInt(0, weapons.length)
                const awardedWeapon = weapons[randomWeapon]
                if(user.inventory.weapons.length < 5) {
                    const found = user.inventory.weapons.find(obj => obj.name === awardedWeapon.name)
                    if(!found) {
                        user.inventory.weapons.push(awardedWeapon)
                        loot = `📦you found <b>${awardedWeapon.name}</b>!!📦`
                        console.log(awardedWeapon, 'weapon')
                    } else {
                        loot = `📦you found ${awardedWeapon.name}📦\n📦but you already got that so i threw it in the bushes📦`
                        console.log(awardedWeapon, 'weapon discarded')
                    }
                } else {
                    loot = `📦you found <b>${awardedWeapon.name}</b> but you got 5 weapons already!!📦`
                }
            }
            let winMessage = `
⚔️ <b>a battle begins</b> ⚔️

👤 <b>${user.first_name}</b> challenges <b>${theMonsterToFight.name}</b> to battle!

🛡️ <b>monster stats</b>:
- <b>health</b>: ${monsterDifficulty} HP
- <b>attack</b>: ${theMonsterToFight.attack} dmg

`

if(user.inventory.equippedWeapon.length <= 0) {
    winMessage += `💥<b>you strike for ${fightChance} dmg!</b>💥
💥(<b>${bonusChance}</b> lvl bonus + <b>${randomFightDeciderInt}</b> random dmg)💥
`
}

if(user.inventory.equippedWeapon.length === 1) {
    winMessage += `💥<b>you strike</b>💥\n💥<b>you fight using ${user.inventory.equippedWeapon[0].name}</b>(<i>${user.inventory.equippedWeapon[0].attack}dmg</i>)💥\n💥<b>YOU HIT FOR ${fightChance} DMG!!</b>💥
💥(weapon:<b>${user.inventory.equippedWeapon[0].attack}dmg</b> <b>${bonusChance}</b> lvl dmg + <b>${randomFightDeciderInt}</b> random dmg)💥
`
}

if(user.inventory.equippedWeapon.length === 2) {
    winMessage += `💥<b>you strike</b>💥\n💥<b>using ${user.inventory.equippedWeapon[0].name}(<i>${user.inventory.equippedWeapon[0].attack}dmg</i>)</b>💥\n💥<b>and ${user.inventory.equippedWeapon[1].name}(<i>${user.inventory.equippedWeapon[1].attack}dmg</i>)</b>💥\n💥<b><i>YOU HIT FOR ${fightChance} DMG!!</i></b>💥
💥(weapons:(<b>${user.inventory.equippedWeapon[0].attack}</b> + <b>${user.inventory.equippedWeapon[1].attack}</b>)dmg + <b>${bonusChance}</b> lvl dmg + <b>${randomFightDeciderInt}</b> random dmg)💥
`
}

winMessage += `
🔥 <b>victory!</b> 🔥
- <b>${user.first_name}</b> has vanquished <b>${theMonsterToFight.name}</b>!
- <b>${theMonsterToFight.xpReward}</b> XP gained!
- <b>total XP</b>: ${user.xp} XP
`

if(loot === 0) {
    winMessage += '\n🏆 <b>well fought, brave badger!</b> 🏆'
} else {
    winMessage += `\n📦<b>omfg LOOT!!</b>📦\n${loot}`
}

await ctx.reply(winMessage, { parse_mode: 'HTML' })

            user = await this.addXp(ctx, userId, user, theMonsterToFight.xpReward)
            user.quests.monsterHunt.combo++
            user.quests.monsterHunt.timestamp = Date.now()
            let success = await pkg.setItem(userId.toString(), user)

            //ctx.reply(`⚔️${user.first_name} starts a fight with ${theMonsterToFight.name}!⚔️\nthe enemy has <b>${monsterDifficulty}HP</b> and you swung for 👊 <b>${fightChance} damage</b> 👊\n ${user.first_name} has vanquished the foul beast!\n\n+${theMonsterToFight.xpReward}XP (total: ${user.xp})`, {parse_mode: 'HTML'})
        }

        // IF LOSING SCENARIO HERE
        if(fightChance < monsterDifficulty) {

            let loseMessage = `
⚔️ <b>a battle begins</b> ⚔️

👤 <b>${user.first_name}</b> challenges <b>${theMonsterToFight.name}</b> to battle!

🛡️ <b>monster stats</b>:
- <b>health</b>: ${monsterDifficulty} HP
- <b>attack</b>: ${theMonsterToFight.attack} dmg

`

if(user.inventory.equippedWeapon.length <= 0) {
    loseMessage += `💥 <b>you strike for ${fightChance} dmg!</b> 💥
💥💥 (<b>${bonusChance}</b> lvl bonus + <b>${randomFightDeciderInt}</b> random dmg) 💥💥
`
}

if(user.inventory.equippedWeapon.length === 1) {
    loseMessage += `💥 <b>you strike</b> 💥\n💥<b>you fight using ${user.inventory.equippedWeapon[0].name}</b>(<i>${user.inventory.equippedWeapon[0].attack}dmg</i>)💥\n💥<b>YOU HIT FOR ${fightChance} DMG!!</b>💥
💥(weapons:<b>${user.inventory.equippedWeapon[0].attack}dmg</b> + <b>${bonusChance}</b> lvl dmg + <b>${randomFightDeciderInt}</b> random dmg)💥
`
}

if(user.inventory.equippedWeapon.length === 2) {
    loseMessage += `💥 <b>you strike</b> 💥\n💥<b>using ${user.inventory.equippedWeapon[0].name}</b>(<i>${user.inventory.equippedWeapon[0].attack}dmg</i>)💥\n💥<b>and ${user.inventory.equippedWeapon[1].name}</b>(<i>${user.inventory.equippedWeapon[1].attack}dmg</i>)💥\n💥<b>YOU HIT FOR ${fightChance} DMG!!</b>💥
💥(weapons:(<b>${user.inventory.equippedWeapon[0].attack}</b> + <b>${user.inventory.equippedWeapon[1].attack}</b>)dmg + <b>${bonusChance}</b> lvl dmg + <b>${randomFightDeciderInt}</b> random dmg)💥
`
}

loseMessage += `
💔<b>defeat!</b>💔
- <b>${user.first_name}</b> got pwnd by <b>${theMonsterToFight.name}</b>😞
- <b>${theMonsterToFight.attack}</b> XP lost!
- <b>total XP</b>: ${user.xp} XP

💪<b>keep foightin, you'll get em next time</b>💪
`

await ctx.reply(loseMessage, { parse_mode: 'HTML' })

            user = await this.subtractXp(ctx, userId, user, theMonsterToFight.attack)
            user.quests.monsterHunt.combo = 0
            user.quests.monsterHunt.timestamp = Date.now()
            let success = await pkg.setItem(userId.toString(), user)

            //ctx.reply(`⚔️${user.first_name} starts a fight with ${theMonsterToFight.name}!⚔️\nthe enemy has <b>${monsterDifficulty}HP</b> and you swung for 👊 <b>${fightChance} damage</b> 👊\n ${theMonsterToFight.name} kicked your poopy badger butt!\n\n-${theMonsterToFight.attack}XP`, {parse_mode: 'HTML'})
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
        if(!user.fightTimer) {
            user.fightTimer = Date.now() - timeReq - 10
        }

        let unix_timestamperoni = Date.now()

        let timeDiff = unix_timestamperoni - user.fightTimer
        if(timeDiff <= timeReq) return await ctx.reply(`wait for ${Math.floor((timeReq - timeDiff)/1000)} seconds until you fight again you rowdy badger`)

        let userDamage = 0
        let userWeapons = []
        let targetUserDamage = 0
        let targetUserWeapons = []

        if(!user.inventory.equippedWeapon || !user.inventory) {
            user.inventory = {
                equippedWeapon: [],
                equippedArmor: [],
                weapons: [],
                armor: []
            }
        }

        if(!targetUser.inventory || !targetUser.inventory.equippedWeapon) {
            targetUser.inventory = {
                equippedWeapon: [],
                equippedArmor: [],
                weapons: [],
                armor: []
            }
        }

        console.log(user, targetUser, 'herheherhehrehreh')

        if(user.inventory.equippedWeapon.length > 0) {
            for(let i = 0; i<user.inventory.equippedWeapon.length; i++) {
                userDamage += user.inventory.equippedWeapon[i].attack
                userWeapons.push(user.inventory.equippedWeapon[i])
                if(i > user.inventory.equippedWeapon.length - 1) {
                    userWeapons += " and "
                }
            }
        }

        if(targetUser.inventory.equippedWeapon.length > 0) {
            for(let i = 0; i<targetUser.inventory.equippedWeapon.length; i++) {
                targetUserDamage += targetUser.inventory.equippedWeapon[i].attack
                targetUserWeapons.push(targetUser.inventory.equippedWeapon[i])
                if(i > targetUser.inventory.equippedWeapon.length - 1) {
                    targetUserWeapons += " and "
                }
            }
        }
        console.log(user, targetUser, 'herheherhehrehreh2')


        const randomDamageInt1 = await randomInt(0, 101)
        const randomDamageInt2 = await randomInt(0, 101)

        let userBonusChance = Math.floor(user.level/10)
        if(userBonusChance > 10) userBonusChance = 10

        let targetUserBonusChance = Math.floor(targetUser.level/10)
        if(targetUserBonusChance > 10) targetUserBonusChance = 10
        
        userDamage += randomDamageInt1
        targetUserDamage += randomDamageInt2

        userDamage += userBonusChance
        targetUserDamage += targetUserBonusChance

        let message = `🥊<b>${user.first_name}</b> starts a brawl with <b>${targetUser.first_name}</b>🥊\n\n`
        message += `🤜💥<b>${user.first_name}</b> strikes!`
        if(userWeapons.length > 0) {
            message += `\n🤜💥using <b>${userWeapons[0].name}</b>(<i>${userWeapons[0].attack}dmg</i>)`
            if(userWeapons.length > 1) {
                message += `\n🤜💥and <b>${userWeapons[1].name}</b>(<i>${userWeapons[1].attack}dmg</i>)`
            }
        }

        message += `\n🤜💥<b>${user.first_name}</b> does <i>${userDamage}dmg</i>!`

        message += `\n\n<b>${targetUser.first_name}</b> strikes!💥🤛`

        if(targetUserWeapons.length > 0) {
            message += `\nusing <b>${targetUserWeapons[0].name}</b>(<i>${targetUserWeapons[0].attack}dmg</i>)💥🤛`
            if(targetUserWeapons.length > 1) {
                message += `\nand <b>${targetUserWeapons[1].name}</b>(<i>${targetUserWeapons[1].attack}dmg</i>)💥🤛`
            }
        }

        message += `\n<b>${targetUser.first_name}</b> does <i>${targetUserDamage}dmg</i>!💥🤛`

        message += `\n\n🔥🔥<b>well fought lads, now hug!</b>!🔥🔥`
        
        await ctx.reply(message, {parse_mode: 'HTML'})
        
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
        return user
    },
    async subtractXp(ctx, userId, user, xpToRemove) {
        if(!userId || !user || !xpToRemove) throw Error('no userId or xp provided')
        user.xp -= xpToRemove
        if(user.xp < 0) user.xp = 0
        user = await this.checkLevelDown(ctx, user)
        let success = await pkg.setItem(userId.toString(), user)
        return user
    },
    async getInv(ctx, userId) {
        if(!ctx||!userId) throw Error('no ctx or userId in getInv')
        const user = await pkg.getItem(userId.toString())
        if(!user) throw Error('no user found in getInv')
        if(!user.inventory) {
            await ctx.reply('no inventory yet - try /monsterhunt to find some stuff')
        }

        let inv = `🎒 ${user.first_name}'s STUFF 🎒\n\n`

        let weaponry = user.inventory.weapons
        console.log(weaponry, 'weaponry')

        if (weaponry.length > 0) {

            if(user.inventory.equippedWeapon.length > 0) {
                inv += `⚔️<b>equipped weapons:</b>⚔️\n[ `

                for(let x = 0; x < user.inventory.equippedWeapon.length; x++) {
                    inv += `${x + 1}.<b>${user.inventory.equippedWeapon[x].name}</b>(<i>${user.inventory.equippedWeapon[x].attack}dmg</i>)`
                    if (x < user.inventory.equippedWeapon.length - 1) {
                        inv += " | "
                    }
                }
                inv += ` ]\n\n`
            }

            inv += "💼<b>weapons inventory</b>💼\n[ "
            for (let i = 0; i < weaponry.length; i++) {
                console.log(weaponry[i])
                inv += `${i + 1}. <b>${weaponry[i].name}</b> (<i>${weaponry[i].attack} dmg</i>)`
                if (i < weaponry.length - 1) {
                    inv += " | "
                }
            }
            inv += " ]"
        } else {
            inv += "no weapons in your inventory."
        }

        await ctx.reply(inv, {parse_mode: 'HTML'})
    },
    async giveRandomItem(ctx, userId) {
        let user = await pkg.getItem(userId.toString())
        if(!user) throw Error('user not found')
        if(!user.inventory) {
            user.inventory = {
                equippedWeapon: [],
                equippedArmor: [],
                weapons: [],
                armor: []
            }
        }
        if(user.inventory.weapons.length > 5) return await ctx.reply('this dude has 5 weapons in his inv which is max!')

        const randomWeaponInt = await randomInt(0, weapons.length)
        const awardedWeapon = weapons[randomWeaponInt]

        let loot

        const found = user.inventory.weapons.find(obj => obj.name === awardedWeapon.name)
        if(!found) {
            console.log('didnt find', found, 'moving to add', awardedWeapon)
            user.inventory.weapons.push(awardedWeapon)
            loot = awardedWeapon
            console.log(awardedWeapon, 'weapon')
        } else {
            loot = false
            console.log(awardedWeapon, 'weapon discarded')
        }

        if(!loot) return await ctx.reply(`you got ${awardedWeapon.name} but you already have that so i threw it in the bushes`)

        let success = await pkg.setItem(userId.toString(), user)
        await ctx.reply(`${user.first_name} just found <b>${loot.name}</b>!`, {parse_mode: 'HTML'})
        return true
    },
    async clearInventory(ctx, userId) {
        let user = await pkg.getItem(userId.toString())
        if(!user) throw Error('user not found baby')
        if(!user.inventory) {
                user.inventory = {
                equippedWeapon: [],
                equippedArmor: [],
                weapons: [],
                armor: []
            }
        }
        user.inventory.weapons = []
        user.inventory.equippedWeapon = []
        let success = await pkg.setItem(userId.toString(), user)
        await ctx.reply(`cleared inv for ${user.first_name}`)
    },
    async equipWeapon(ctx, userId, weaponNumberToEquip) {
        if(!ctx || !userId || !weaponNumberToEquip) throw Error('missing variables in retardTracker.equipWeapon')
        let user = await pkg.getItem(userId.toString())
        if(!user) throw Error('no user found babe')
        if(!user.inventory || !user.inventory.weapons) return await ctx.reply('mate, you dont have any weapons.')
        if(user.inventory.equippedWeapon.length > 1) return await ctx.reply('mate, you are fully equipped already')
        if(!user.inventory.weapons[weaponNumberToEquip-1]) return await ctx.reply('that inv slot is empty')

        weaponNumberToEquip--
        let theWeaponToEquip = user.inventory.weapons[weaponNumberToEquip]
        const found = user.inventory.equippedWeapon.find(obj => obj.name === theWeaponToEquip.name)
        if(found) {
            return await ctx.reply('you cant equip the same item twice')
        }
        user.inventory.equippedWeapon.push(theWeaponToEquip)
        let success = await pkg.setItem(userId.toString(), user)
        return await ctx.reply(`⚔️you have equipped <b>${theWeaponToEquip.name}</b>(<i>${theWeaponToEquip.attack}dmg</i>)⚔️`, {parse_mode:'HTML'})
    },
    async unequipWeapon(ctx, userId, weaponNumberToUnequip) {
        if(!ctx || !userId || !weaponNumberToUnequip) throw Error('missing variables in retardTracker.unequipWeapon')
        let user = await pkg.getItem(userId.toString())
        if(!user) throw Error('no user found babe')
        if(user.inventory.equippedWeapon.length < 1) return await ctx.reply('mate, you are fully unequipped already')

        weaponNumberToUnequip--
        let theUnequippedWeapon = user.inventory.equippedWeapon[weaponNumberToUnequip]
        user.inventory.equippedWeapon.splice(weaponNumberToUnequip, 1)
        let success = await pkg.setItem(userId.toString(), user)
        return await ctx.reply(`⚔️you have unequipped <b>${theUnequippedWeapon.name}</b>(<i>${theUnequippedWeapon.attack}dmg</i>)⚔️`, {parse_mode:'HTML'})
    },
    async removeWeapon(ctx, userId, itemToRemove) {
        if(!ctx || !userId || !itemToRemove) throw Error('missing variables in retardTracker.removeWeapon')
        let user = await pkg.getItem(userId.toString())
        if(!user) throw Error('no user found babe')
        if(!user.inventory) throw Error('no inventory on this fella')
        if(user.inventory.weapons.length < 1) throw Error('no weapons in this fellas inv')

        itemToRemove--
        let theRemovedItem = user.inventory.weapons[itemToRemove]

        const found = user.inventory.equippedWeapon.find(obj => obj.name === theRemovedItem.name)
        if(found) {
            return await ctx.reply('you need to /unequip that before throwing it away')
        }

        user.inventory.weapons.splice(itemToRemove, 1)
        let success = await pkg.setItem(userId.toString(), user)
        return await ctx.reply(`⚔️you tossed <b>${theRemovedItem.name}</b>(<i>${theRemovedItem.attack}dmg</i>) into the jungle never to be seen again`, {parse_mode:'HTML'})
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
