require('dotenv').config();

const noblox = require('noblox.js');
const fs = require('fs');
const path = require('path');

const lastUserId = path.join(__dirname, 'lastUser.id');

let currentUserId = 1;

if (fs.existsSync(lastUserId)) {
    currentUserId = Number(fs.readFileSync(lastUserId));
    if (isNaN(currentUserId)) currentUserId = 1;
    currentUserId = Math.floor(currentUserId);
}

// #region Death

const DEATH = require('like-process');
const { setTimeout } = require('timers/promises');

let hasDied = false;
let hasFileWrite = false;

DEATH.on('cleanup', () => {
	if (hasFileWrite) return;
	hasFileWrite = true;

	fs.writeFileSync(lastUserId, currentUserId.toString());

	try {
		process.exit(-1);
	} catch (_) { /* empty */ }
});
// 'uncaughtException'
DEATH.handle(['unhandledRejection', 'exit', 'SIGHUP', 'SIGINT', 'SIGTERM', 'SIGQUIT', 'SIGUSR1', 'SIGUSR2'], (evt, err) => {
	if (hasDied) return;
	hasDied = true;

	// try {
	// 	logger.info(`[DEATH] Event: ${evt} Error: ${err}`);
	// } catch (_) {
		console.log(`[DEATH] Event: ${evt} Error: ${err}`);
	// }
});
// #endregion

(async () => {
    // Set the users cookie so we can "login" as them aka allow us to use .follow(UserID)
    const currentUser = await noblox.setCookie(process.env.ROBLOSECURITY);
    console.log(`Logged in as ${currentUser.UserName} [${currentUser.UserID}]`);

    setInterval(async () => {
        let hasError = false;
        console.log(`Attempting to follow ${currentUserId}`);
        await noblox.follow(currentUserId).catch((res) => {
            hasError = true;
            console.error(res);
        }).then((res) => {
            if (!hasError) currentUserId += 1;
        });
        // currentUserId += 1;
    }, process.env.retry ?? 15000);

    // eslint-disable-next-line no-constant-condition
    while (true) {
        await setTimeout(1000, () => { /* empty */ });
    }
})();