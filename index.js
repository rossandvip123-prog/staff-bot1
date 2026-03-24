require('dotenv').config();

const { Client, GatewayIntentBits, SlashCommandBuilder, Routes, REST, EmbedBuilder } = require("discord.js");
const noblox = require("noblox.js");

const TOKEN = process.env.TOKEN;
const COOKIE = process.env.COOKIE;
const CLIENT_ID = "1480977689753030759";

if (!TOKEN) {
  console.log("❌ TOKEN MISSING");
  process.exit(1);
}

if (!COOKIE) {
  console.log("❌ COOKIE MISSING");
  process.exit(1);
}

console.log("✅ TOKEN LOADED");
console.log("✅ COOKIE LOADED");

// Roblox login
noblox.setCookie(COOKIE)
  .then(() => console.log("✅ Logged into Roblox"))
  .catch(err => console.error("❌ Roblox login failed:", err));

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: ["CHANNEL"]
});

const waiting = new Map();

/* COMMANDS */

const commands = [
  new SlashCommandBuilder()
    .setName("staffapppass")
    .setDescription("Pass staff application")
    .addUserOption(o =>
      o.setName("user").setDescription("Applicant").setRequired(true))
    .addStringOption(o =>
      o.setName("department")
       .setDescription("Department")
       .setRequired(true)
       .addChoices(
         { name: "Flight Deck", value: "Flight Deck" },
         { name: "Cabin Crew", value: "Cabin Crew" },
         { name: "Security Officer", value: "Security Officer" },
         { name: "Ground Operations", value: "Ground Operations" }
       )),

  new SlashCommandBuilder()
    .setName("staffappfail")
    .setDescription("Fail staff application")
    .addUserOption(o =>
      o.setName("user").setDescription("Applicant").setRequired(true))
    .addStringOption(o =>
      o.setName("department")
       .setDescription("Department")
       .setRequired(true)
       .addChoices(
         { name: "Flight Deck", value: "Flight Deck" },
         { name: "Cabin Crew", value: "Cabin Crew" },
         { name: "Security Officer", value: "Security Officer" },
         { name: "Ground Operations", value: "Ground Operations" }
       ))
].map(c => c.toJSON());

/* REGISTER */

const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
  try {
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log("✅ Commands registered");
  } catch (err) {
    console.error("❌ Command register error:", err);
  }
})();

/* READY */

client.once("clientReady", () => {
  console.log("🤖 Bot online");
});

/* COMMAND HANDLER */

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  await interaction.deferReply({ flags: 64 });

  const user = interaction.options.getUser("user");
  const department = interaction.options.getString("department");
  const passed = interaction.commandName === "staffapppass";

  try {
    await user.send(`Result: ${passed ? "PASSED ✅" : "FAILED ❌"}\nDepartment: ${department}`);

    if (passed) {
      await user.send("Send your Roblox username.");
      waiting.set(user.id, department);
    }

    await interaction.editReply("✅ Done");

  } catch {
    await interaction.editReply("❌ Could not DM user");
  }
});

/* DM HANDLER */

client.on("messageCreate", async message => {
  if (message.author.bot) return;
  if (message.channel.type !== 1) return;

  if (!waiting.has(message.author.id)) return;

  const username = message.content;
  const department = waiting.get(message.author.id);

  try {
    const id = await noblox.getIdFromUsername(username);
    await noblox.setRank(463381711, id, department);

    await message.author.send(`✅ Ranked as ${department}`);

  } catch (err) {
    console.error(err);
    await message.author.send("❌ Failed to rank you");
  }

  waiting.delete(message.author.id);
});

/* LOGIN */

client.login(TOKEN);
