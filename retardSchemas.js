
export const retardSchemas = {
    defaultInvSchema() {
        return {
                equippedWeapon: {1:{}, 2:{}},
                equippedArmor: {1:{}, 2:{}},
                equippedConsumables: {1:{}, 2:{}},
                weapons: {1:{}, 2:{}, 3:{}, 4:{}, 5:{}},
                armor: {1:{}, 2:{}, 3:{}, 4:{}, 5:{}},
                consumables: {1:{}, 2:{}, 3:{}, 4:{}, 5:{}},
                cursed: {1:{}, 2:{}}
            }
    },
    invSchemaSmall() {
		return {1:{}, 2:{}}
	},
    invSchemaBig() {
        return {1:{}, 2:{}, 3:{}, 4:{}, 5:{}}
    },
    defaultQuestSchema() {
        return {
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
                        highscore: 0
                    }
            }
        }
    },
    questSchemaSmall() {
        return {
                timestamp: 0,
                combo: 0,
                highscore: 0
            }
    }
}
