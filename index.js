require('dotenv').config();

const { 
  Client, 
  GatewayIntentBits, 
  SlashCommandBuilder, 
  Routes, 
  REST, 
  EmbedBuilder 
} = require("discord.js");

const noblox = require("noblox.js");

/* ---------------- ENV ---------------- */

const TOKEN = process.env.TOKEN;
const COOKIE = process.env.COOKIE;
const CLIENT_ID = "1480977689753030759";
const GROUP_ID = 463381711;

/* ---------------- SAFETY ---------------- */

if (!TOKEN) {
  console.error("❌ TOKEN missing (set in Railway Variables)");
  process.exit(1);
}

if (!COOKIE) {
  console.error("❌ COOKIE missing (set in Railway Variables)");
  process.exit(1);
}

console.log("✅ TOKEN loaded");
console.log("✅ COOKIE loaded");

/* ---------------- ROBLOX LOGIN ---------------- */

noblox.setCookie(COOKIE)
  .then(() => console.log("✅ Logged into Roblox"))
  .catch(err => console.error("❌ Roblox login failed:", err));

/* ---------------- CLIENT ---------------- */

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: ["CHANNEL"]
});

const waiting = new Map();

/* ---------------- COMMANDS ---------------- */

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

/* ---------------- REGISTER COMMANDS ---------------- */

const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
  try {
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log("✅ Commands registered");
  } catch (err) {
    console.error("❌ Command register error:", err);
  }
})();

/* ---------------- READY ---------------- */

client.once("clientReady", () => {
  console.log(`🤖 Bot online as ${client.user.tag}`);
});

/* ---------------- COMMAND HANDLER ---------------- */

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  await interaction.deferReply({ flags: 64 });

  const user = interaction.options.getUser("user");
  const department = interaction.options.getString("department");
  const passed = interaction.commandName === "staffapppass";

  const embed = new EmbedBuilder()
    .setColor(0x8B0000)
    .setTitle("STAFF APPLICATION RESULT")
    .setDescription(`
**Applicant:** ${user.username}

**Department:** ${department}

**Result:** ${passed ? "PASSED ✅" : "FAILED ❌"}

Join group:
https://www.roblox.com/groups/${GROUP_ID}
`);

  try {
    await user.send({ embeds: [embed] });

    if (passed) {
      await user.send("📩 Please reply with your Roblox username.");
      waiting.set(user.id, department);
    }

    await interaction.editReply("✅ Application processed.");

  } catch {
    await interaction.editReply("❌ Could not DM user.");
  }
});

/* ---------------- DM HANDLER ---------------- */

client.on("messageCreate", async message => {
  if (message.author.bot) return;
  if (message.channel.type !== 1) return;

  if (!waiting.has(message.author.id)) return;

  const username = message.content;
  const department = waiting.get(message.author.id);

  try {
    const userId = await noblox.getIdFromUsername(username);

    await noblox.setRank(GROUP_ID, userId, department);

    await message.author.send(`✅ You have been ranked as ${department}.`);

  } catch (err) {
    console.error("❌ RANK ERROR:", err);
    await message.author.send("❌ Failed to rank you. Contact staff.");
  }

  waiting.delete(message.author.id);
});

/* ---------------- LOGIN ---------------- */

client.login(TOKEN);