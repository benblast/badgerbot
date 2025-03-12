import { retardSchemas } from './retardSchemas.js'
import { randomInt } from 'crypto'
import monsters from './monsters.json' assert { type: 'json' }
import weapons from './weapons.json' assert { type: 'json' }
import consumables from './consumables.json' assert { type: 'json' }
import pkg from 'node-persist'

export const retardHelpers = {
	async getUser(userId) {
		if(!userId) throw Error('no userId in getUser')
		const user = await pkg.getItem(userId.toString())
		if(!user) throw Error('no user found in getUser')
		return user
	},
	calculateRemainingTime(timeSinceClaim) {
		let remainingTimeInMs = 86400000 - timeSinceClaim
	    // calculate hours, minutes, and seconds from milliseconds
	    const hours = Math.floor(remainingTimeInMs / 3600000) // 1 hour = 3600000 ms
	    const minutes = Math.floor((remainingTimeInMs % 3600000) / 60000) // 1 minute = 60000 ms
	    const seconds = Math.floor((remainingTimeInMs % 60000) / 1000) // 1 second = 1000 ms

	    // return a formatted string
	    return `${hours}h${minutes}min${seconds}s`
	},
	isInvFull(obj) {
	    for (let key in obj) {
	        if (!obj[key].hasOwnProperty('name')) {
	            return false // return false immediately if a key doesn't have 'name' object on it
	        }
	    }
	    return true // all keys passed the check (everything has a subobject with .name)
	},
	isInvEmpty(obj) {
	    for (let key in obj) {
	        if (obj[key].hasOwnProperty('name')) {
	            return false // return false immediately if a key doesn't have 'name' object on it
	        }
	    }
	    return true // all keys passed the check (everything has a subobject with .name)
	},
	clearEquippedConsumables(userId, user) {
		if(!userId||!user) throw Error('missing variables in clearEquippedConsumables')
		console.log('in clearEquippedConsumables')
		user.inventory.equippedConsumables = retardSchemas.invSchemaSmall()
		console.log('cleared equipped consumables for', userId, user.first_name, 'at time', Date.now())
		return user
	},
	calculateTotalWeaponDamage(obj) {
		let weaponDamage = 0
		for(let key in obj) {
			if(obj[key].hasOwnProperty('attack')) {
				weaponDamage += obj[key].attack
			}
		}
		return weaponDamage
	},
	rollForLoot(modifier) {
	    const baseChance = 30 // base chance foor l00t is 30%
	    
	    // ensure the final chance stays between 0% and 100%
	    // if it exceeds 100, Math.min returns 100
	    // if it goes below 0, Math.max returns 0 
	    const finalChance = Math.max(0, Math.min(100, baseChance + modifier))

	    const randomValue = randomInt(0, 101)

	    // return true if the random number is within the finalChance range
	    return randomValue < finalChance
	},
	findFreeSlot(obj) {
		//this thing finds a free slot and returns the key name
		//if it doesnt find any free slots, it returns false
        for (let key in obj) {
            if (!obj[key].hasOwnProperty('name')) {
                return key
            }
        }
        return false
	},
	findDuplicate(obj, nameToFind) {
		//takes in the object to look inside and a keyname to find
        for(let key in obj) {
            if(obj[key].hasOwnProperty('name')) {
                if(obj[key].name === nameToFind) {
                    return true
                }
            }
        }
        return false
	},
	getRandomWeapon(){
        const randomWeapon = randomInt(0, weapons.length)
        const awardedWeapon = weapons[randomWeapon]
        return awardedWeapon
	},
	getRandomMonster(level){
        const randomNumber = randomInt(0, monsters[level].length)
        const randomMonster = monsters[level][randomNumber]
        return randomMonster
	},
	getRandomConsumable(){
        const randomNumber = randomInt(0, consumables.length)
        const randomConsumable = consumables[randomNumber]
        return randomConsumable
	},
	getBossMonster(level){
		console.log(level, 'LEVEL OF BOSS BEING PICKED')
        const bossMonster = monsters['boss'][level]
        return bossMonster
	},
	checkMonsterLevelUp(monsterHuntObject) {
		if(monsterHuntObject.combo % 3 === 0) {
			if(monsterHuntObject.level <= 5) return true // monsters cant level up past 5 right now
		}
		return false
	},
	removeAllConsumableCombatEffects(user) {
        // REMOVE ALL CONSUMABLE EFFECTS THAT ARE COMBAT RELATED
        // ALL BUFFS THAT GIVE BONUSDAMAGE, BONUS CRIT, INVULNERABLE
       	let buffs = user.inventory.equippedConsumables
       	let curses = user.inventory.cursed
        for(let key in buffs) {
            if(buffs[key].hasOwnProperty('name') && buffs[key].bonusDamage > 0) {
            	console.log('removing', buffs[key], 'from', user.first_name)
                buffs[key] = {}
            }
            if(buffs[key].hasOwnProperty('name') && buffs[key].bonusCritChance > 0) {
            	console.log('removing', buffs[key], 'from', user.first_name)
                buffs[key] = {}
            }
            if(buffs[key].hasOwnProperty('name') && buffs[key].invulnerable) {
            	console.log('removing', buffs[key], 'from', user.first_name)
                buffs[key] = {}
            }
        }
        //REMOVE ALL CURSES THAT WEAKENDAMAGE
        for(let key in curses) {
            if(curses[key].hasOwnProperty('name') && curses[key].curse.weakenDamage > 0) {
            	console.log('removing', curses[key], 'from', user.first_name)
                curses[key] = {}
            }
        }
        user.inventory.equippedConsumables = buffs
        user.inventory.cursed = curses
        return user
	}
}
