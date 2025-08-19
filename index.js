import { Client, GatewayIntentBits, Partials } from 'discord.js';
import Database from 'better-sqlite3';
import dotenv from 'dotenv';
dotenv.config();

// === CONFIG ===
const TOKEN = process.env.TOKEN;
const CASINO_CHANNEL_ID = '1403139276941824090';
const OWNER_IDS = ['1252406761994977400', '1090051890814918716',]; // li ynajmo zidou/wahdou coins
const VC_COINS_PER_MINUTE = 0.25;
const CHAT_COINS = 0.10;
const CHAT_COOLDOWN_SECONDS = 15;
const DAILY_BONUS = 50;

// === DATABASE SETUP ===
const db = new Database('./coins.db');
db.prepare(`CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, coins INTEGER, lastDaily INTEGER)`).run();

// === HELPER FUNCTIONS ===
function getUser(id) {
  return db.prepare(`SELECT * FROM users WHERE id = ?`).get(id) || { id, coins: 0, lastDaily: 0 };
}

function addCoins(id, amount) {
  const user = getUser(id);
  db.prepare(`INSERT OR REPLACE INTO users (id, coins, lastDaily) VALUES (?, ?, ?)`)
    .run(id, user.coins + amount, user.lastDaily);
}

function setLastDaily(id, timestamp) {
  const user = getUser(id);
  db.prepare(`INSERT OR REPLACE INTO users (id, coins, lastDaily) VALUES (?, ?, ?)`)
    .run(id, user.coins, timestamp);
}

function isAllowed(id) {
  return OWNER_IDS.includes(id);
}

// === BOT CLIENT ===
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
  partials: [Partials.Channel]
});

client.on('ready', () => {
  console.log(`✅ Bot chghal : ${client.user.tag}`);
});

// === INTERACTION HANDLER ===
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName, options, user, channelId } = interaction;

  const casinoGames = ['coinflip', 'slots', 'dice'];
  if (casinoGames.includes(commandName) && channelId !== CASINO_CHANNEL_ID) {
    return interaction.reply({ content: `❌ Hadhom les commands ken fil casino <#${CASINO_CHANNEL_ID}>`, ephemeral: true });
  }

  // BALANCE
  if (commandName === 'balance') {
    const target = options.getUser('user') || user;
    const data = getUser(target.id);
    return interaction.reply(`💰 ${target.username} 3andou **${data.coins}** coins.`);
  }

  // LEADERBOARD
  if (commandName === 'topcoins') {
    const rows = db.prepare(`SELECT * FROM users ORDER BY coins DESC LIMIT 10`).all();
    const list = rows.map((u, i) => `${i + 1}. <@${u.id}> — **${u.coins}** coins`).join('\n');
    return interaction.reply(`🏆 **Top 10 coins:**\n${list}`);
  }

  // DAILY
  if (commandName === 'daily') {
    const data = getUser(user.id);
    const now = Date.now();
    if (now - data.lastDaily < 24 * 60 * 60 * 1000) {
      const remaining = 24 * 60 * 60 * 1000 - (now - data.lastDaily);
      const hours = Math.floor(remaining / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      return interaction.reply(`⏳ 3andek daily ba3d **${hours}h ${minutes}m**`);
    }
    addCoins(user.id, DAILY_BONUS);
    setLastDaily(user.id, now);
    return interaction.reply(`✅ Bravo! Khdhit **${DAILY_BONUS}** coins lyom.`);
  }

  // GIVE
  if (commandName === 'give') {
    const target = options.getUser('user');
    const amount = options.getInteger('amount');
    if (amount <= 0) return interaction.reply({ content: "❌ Amount yelzem ykoun > 0", ephemeral: true });
    const senderData = getUser(user.id);
    if (senderData.coins < amount) return interaction.reply({ content: "❌ M3andekch coins kifkif", ephemeral: true });
    addCoins(user.id, -amount);
    addCoins(target.id, amount);
    return interaction.reply(`💸 3titou **${amount}** coins lil ${target.username}`);
  }

  // ADD COINS
  if (commandName === 'addcoins') {
    if (!isAllowed(user.id)) return interaction.reply({ content: "❌ Ma3andekch droit", ephemeral: true });
    const target = options.getUser('user');
    const amount = options.getInteger('amount');
    if (amount <= 0) return interaction.reply({ content: "❌ Amount yelzem > 0", ephemeral: true });
    addCoins(target.id, amount);
    return interaction.reply(`✅ Zidna **${amount}** coins lil ${target.username}`);
  }

  // REMOVE COINS
  if (commandName === 'removecoins') {
    if (!isAllowed(user.id)) return interaction.reply({ content: "❌ Ma3andekch droit", ephemeral: true });
    const target = options.getUser('user');
    const amount = options.getInteger('amount');
    if (amount <= 0) return interaction.reply({ content: "❌ Amount yelzem > 0", ephemeral: true });
    addCoins(target.id, -amount);
    return interaction.reply(`✅ Na9asna **${amount}** coins men ${target.username}`);
  }

  // COINFLIP
  if (commandName === 'coinflip') {
    const amount = options.getInteger('amount');
    const data = getUser(user.id);
    if (amount <= 0) return interaction.reply({ content: "❌ Bet > 0", ephemeral: true });
    if (data.coins < amount) return interaction.reply({ content: "❌ M3andekch coins kifkif", ephemeral: true });

    const win = Math.random() < 0.25;
    if (win) {
      addCoins(user.id, amount);
      return interaction.reply(`🪙 Heads! Rb7et **${amount}** coins!`);
    } else {
      addCoins(user.id, -amount);
      return interaction.reply(`🪙 Tails! Khssart **${amount}** coins.`);
    }
  }

  // SLOTS
  if (commandName === 'slots') {
    const amount = options.getInteger('amount');
    const data = getUser(user.id);
    if (amount <= 0) return interaction.reply({ content: "❌ Bet > 0", ephemeral: true });
    if (data.coins < amount) return interaction.reply({ content: "❌ M3andekch coins kifkif", ephemeral: true });

    const symbols = ["🍒","🍋","🍉","⭐","💎"];
    const roll = () => symbols[Math.floor(Math.random()*symbols.length)];
    const slot1 = roll(), slot2 = roll(), slot3 = roll();
    const result = `${slot1} | ${slot2} | ${slot3}`;

    const winChance = Math.random() < 0.25;
    if (winChance) {
      if (slot1===slot2 && slot2===slot3) {
        addCoins(user.id, amount*5);
        return interaction.reply(`🎰 ${result} — JACKPOT! Rb7et **${amount*5}** coins!`);
      } else {
        addCoins(user.id, amount*2);
        return interaction.reply(`🎰 ${result} — Rb7et **${amount*2}** coins!`);
      }
    } else {
      addCoins(user.id, -amount);
      return interaction.reply(`🎰 ${result} — Khssart **${amount}** coins.`);
    }
  }

  // DICE
  if (commandName==='dice') {
    const amount = options.getInteger('amount');
    const data = getUser(user.id);
    if (amount<=0) return interaction.reply({ content:"❌ Bet >0", ephemeral:true });
    if(data.coins<amount) return interaction.reply({ content:"❌ M3andekch coins kifkif", ephemeral:true });

    const playerRoll = Math.floor(Math.random()*6)+1;
    const botRoll = Math.floor(Math.random()*6)+1;
    const winChance = Math.random()<0.25;

    if(winChance){
      addCoins(user.id, amount);
      return interaction.reply(`🎲 Rollet ${playerRoll} vs ${botRoll} — Rb7et **${amount}** coins!`);
    } else {
      addCoins(user.id, -amount);
      return interaction.reply(`🎲 Rollet ${playerRoll} vs ${botRoll} — Khssart **${amount}** coins.`);
    }
  }

});

client.login(TOKEN);
