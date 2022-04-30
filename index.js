const Minecraft = require("mineflayer");
const Config = require("./config.json");

const bots = [];

let target = null;

const createBot = () => {

	if (bots.length >= Config.botCount)
		return;

	const bot = Minecraft.createBot({
		host: Config.serverHost,
		port: Config.serverPort,
		version: Config.serverVersion,
		username: Config.botsPrefix + (bots.length + 1),
		checkTimeoutInterval: 60 * 1000
	});

	bot.lastAttack = 0;
	bot.direction = Math.PI * 2 / Config.botCount * bots.length;

	if (bots.length === 0) {

		bot.on("entityHurt", (victim) => {

			if (victim.username !== Config.bossName && !bots.some((bot) => bot.username === victim.username))
				return;

			const entities = Object.values(bot.entities)
				.filter((entity) => entity.username !== Config.bossName && !bots.some((bot) => bot.username === entity.username))
				.sort((a, b) => (a.position.xzDistanceTo(victim.position) - b.position.xzDistanceTo(victim.position)));

			if (entities[0]) {
				target = entities[0];
				console.log(victim.username + " attacked, target set to " + target.username || target.mobType);
			}
		});

		bot.on("entityGone", (entity) => {
			if (entity === target)
				target = null;
		});
	}

	bot.on("move", () => {

		let boss = bot.players[Config.bossName];
		if (!boss) return;

		boss = boss.entity;
		if (!boss) return;

		const location = target && target ? target.position :
			boss.position.offset(Math.sin(bot.direction + boss.yaw) * Config.bossSpace, 0, Math.cos(bot.direction + boss.yaw) * Config.bossSpace);

		bot.lookAt(location);

		if (target && Date.now() > bot.lastAttack + Config.attackCooldown * 1000) {
			bot.lastAttack = Date.now();
			bot.attack(target);
		}

		if (bot.entity.position.xzDistanceTo(location) > Config.bossSpace) {
			bot.setControlState("forward", true);
			bot.setControlState("sprint", true);
		}
	});

	bots.push(bot);
	setTimeout(createBot, Config.botSpawnCooldown * 1000);
}

createBot();