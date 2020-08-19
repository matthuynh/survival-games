/* Most "user-facing" configurable values for a game can be found in this file */

// Defines the logical properties of each type of player
// Used in: StageBase.js
exports.PlayerGenerationTemplate = {
    // default movementSpeed = 7, healthPoints = 100
    "Human": {
        movementSpeed: 7,
        healthPoints: 120,
        radius: 30
    },
    "EasyBot": {
        movementSpeed: 3,
        healthPoints: 50,
        radius: 38,
        colour: "rgb(255,255,255)"
    },
    "MediumBot": {
        movementSpeed: 4,
        healthPoints: 80,
        radius: 30,
        colour: "rgb(255,255,0)"
    },
    "HardBot": {
        movementSpeed: 5,
        healthPoints: 100,
        radius: 20,
        colour: "rgb(0,0,0)"
    },
},

// Defines the abilties and properties of bots
// detectionRange is how close a bot would have to be to a player before the bot starts following the player
// Used in: PlayerBot.js
exports.BotAbilities = {
    "EasyBot": {
        detectionRange: 600,
    },
    "MediumBot": {
        detectionRange: 700,
    },
    "HardBot": {
        detectionRange: 800,
    },
},


// Defines the stage generation settings for a singleplayer game
// Used in LobbySingleplayer.js
exports.SingleplayerStageGenerationSettings = {
    "Small": {
        numBushes: 5,
        numCrates: 4,
        numHPPots: 5,
        numPistolAmmo: 5,
        numRifleAmmo: 5,
        numShotgunAmmo: 3,
        numSpeedBoost: 1,
        numRDS: 0,
        numPistols: 1,
        numRifles: 1,
        numShotguns: 1,
        stageWidth: 1250,
        stageHeight: 1250
    },
    "Medium": {
        numBushes: 10,
        numCrates: 8,
        numHPPots: 10,
        numPistolAmmo: 10,
        numRifleAmmo: 10,
        numShotgunAmmo: 5,
        numSpeedBoost: 1,
        numRDS: 0,
        numPistols: 1,
        numRifles: 1,
        numShotguns: 1,
        stageWidth: 2000,
        stageHeight: 2000
    },
    "Large": {
        numBushes: 14,
        numCrates: 10,
        numHPPots: 20,
        numPistolAmmo: 20,
        numRifleAmmo: 20,
        numShotgunAmmo: 10,
        numSpeedBoost: 1,
        numRDS: 0,
        numPistols: 1,
        numRifles: 1,
        numShotguns: 1,
        stageWidth: 3000,
        stageHeight: 3000
    },
},


// Defines the generation settings for various environment objects in both singleplayer/multiplayer games
// Used in StageBase.js
exports.EnvironmentObjects = {
    "Bush": {
        colour: "rgba(0,61,17,0.95)",
        radius: 80,
    },
    "Crate": {
        colour: "rgb(128,128,128,1)",
        width: 200,
        height: 200,
    },
    "HealthPot": {
        colour: "rgba(255,0,0,0.7)",
        radius: 26,
    },
    "SpeedPot": {
        colour: "rgba(0,0,255,0.7)",
        radius: 26,
    },
    "Pistol": {
        colour: "rgba(255,255,0,1)",
        radius: 65,
    },
    "Rifle": {
        colour: "rgba(255,140,0,1)",
        radius: 65,
    },
    "Shotgun": {
        colour: "rgba(255,0,255,1)",
        radius: 65,
    },
    "AmmoPistol": {
        colour: "rgba(255,255,0,1)",
        radius: 30,
    },
    "AmmoRifle": {
        colour: "rgba(255,140,0,1)",
        radius: 30,
    },
    "AmmoShotgun": {
        colour: "rgba(255,0,255,1)",
        radius: 30,
    },
}