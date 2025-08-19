import { REST, Routes, SlashCommandBuilder } from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();

// --- CONFIGURATION ---
// Ensure your .env file has CLIENT_ID and GUILD_ID
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
const TOKEN = process.env.TOKEN;

if (!TOKEN || !CLIENT_ID || !GUILD_ID) {
  console.error('Error: TOKEN, CLIENT_ID, and GUILD_ID must be defined in your .env file.');
  process.exit(1);
}

// --- COMMAND DEFINITIONS ---
const commands = [
  new SlashCommandBuilder().setName('balance').setDescription('Check your coin balance.'),
  new SlashCommandBuilder().setName('topcoins').setDescription('See the leaderboard of the richest users.'),
  new SlashCommandBuilder().setName('daily').setDescription('Claim your free daily coin bonus.'),
  new SlashCommandBuilder()
    .setName('give')
    .setDescription('Give coins to another user.')
    .addUserOption(option => option.setName('user').setDescription('The user to give coins to').setRequired(true))
    .addIntegerOption(option => option.setName('amount').setDescription('The amount of coins to give').setRequired(true)),
  
  // Casino Commands
  new SlashCommandBuilder()
    .setName('coinflip')
    .setDescription('Flip a coin and bet your coins.')
    .addIntegerOption(option => option.setName('amount').setDescription('The amount to bet').setRequired(true)),
  new SlashCommandBuilder()
    .setName('slots')
    .setDescription('Play the slot machine.')
    .addIntegerOption(option => option.setName('amount').setDescription('The amount to bet').setRequired(true)),
  new SlashCommandBuilder()
    .setName('dice')
    .setDescription('Roll a dice against the bot.')
    .addIntegerOption(option => option.setName('amount').setDescription('The amount to bet').setRequired(true)),

  // Admin Commands
  new SlashCommandBuilder()
    .setName('addcoins')
    .setDescription('[Admin] Add coins to a user.')
    .addUserOption(option => option.setName('user').setDescription('The user to add coins to').setRequired(true))
    .addIntegerOption(option => option.setName('amount').setDescription('The amount of coins to add').setRequired(true))
    .setDefaultMemberPermissions(0), // Admin only
  new SlashCommandBuilder()
    .setName('removecoins')
    .setDescription('[Admin] Remove coins from a user.')
    .addUserOption(option => option.setName('user').setDescription('The user to remove coins from').setRequired(true))
    .addIntegerOption(option => option.setName('amount').setDescription('The amount of coins to remove').setRequired(true))
    .setDefaultMemberPermissions(0), // Admin only

].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);

// --- DEPLOYMENT LOGIC ---
(async () => {
  try {
    // 1. Clear all existing commands for this bot in this guild.
    console.log(`Started clearing ${commands.length} application (/) commands for guild ${GUILD_ID}.`);
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: [] } // An empty array clears the commands
    );
    console.log('Successfully cleared old application (/) commands.');

    // 2. Register the new commands.
    console.log('Started refreshing application (/) commands.');
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands },
    );
    console.log('Successfully reloaded application (/) commands.');

  } catch (error) {
    console.error('Failed to deploy commands:', error);
  }
})();
