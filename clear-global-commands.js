import { REST, Routes, SlashCommandBuilder } from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();

const { TOKEN, CLIENT_ID, GUILD_ID } = process.env;

const commands = [
  new SlashCommandBuilder().setName('balance').setDescription('Check coin balance').addUserOption(o => o.setName('user').setDescription('User')),
  new SlashCommandBuilder().setName('topcoins').setDescription('Show top coin holders'),
  new SlashCommandBuilder().setName('daily').setDescription('Claim your daily coins'),
  new SlashCommandBuilder().setName('give').setDescription('Give coins to another user').addUserOption(o => o.setName('user').setDescription('User').setRequired(true)).addIntegerOption(o => o.setName('amount').setDescription('Coins').setRequired(true)),
  new SlashCommandBuilder().setName('addcoins').setDescription('Add coins to a user (Admin only)').addUserOption(o => o.setName('user').setDescription('User').setRequired(true)).addIntegerOption(o => o.setName('amount').setDescription('Coins').setRequired(true)),
  new SlashCommandBuilder().setName('removecoins').setDescription('Remove coins from a user (Admin only)').addUserOption(o => o.setName('user').setDescription('User').setRequired(true)).addIntegerOption(o => o.setName('amount').setDescription('Coins').setRequired(true)),
  new SlashCommandBuilder().setName('coinflip').setDescription('Bet coins on a coinflip').addIntegerOption(o => o.setName('amount').setDescription('Coins').setRequired(true)),
  new SlashCommandBuilder().setName('slots').setDescription('Bet coins in a slot machine').addIntegerOption(o => o.setName('amount').setDescription('Coins').setRequired(true)),
  new SlashCommandBuilder().setName('dice').setDescription('Bet coins on a dice roll').addIntegerOption(o => o.setName('amount').setDescription('Coins').setRequired(true))
].map(c => c.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    console.log(`Started refreshing application (/) commands for guild ${GUILD_ID}.`);
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
    console.log('✅ Successfully registered commands.');
  } catch (error) {
    console.error(error);
  }
})();
