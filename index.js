const { Client, GatewayIntentBits, SlashCommandBuilder, Routes, REST, EmbedBuilder } = require("discord.js");
const noblox = require("noblox.js");

const TOKEN = "MTQ4MDk3NzY4OTc1MzAzMDc1OQ.GRbT9F.ZLW0nJPqNiVyDwR-ZxvSLmVom-Qqg8800z3gGk";
const CLIENT_ID = "1480977689753030759";
const COOKIE = "_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_CAEaAhADIhsKBGR1aWQSEzU1MTk4NjY2NTM4NzU1OTc4MzMoAw.yn3LpiQuNotaP2seNt6HPT2MYEOsv5P0D6jMBTAIeq4ixxIIGlJfS4I-W06AHHLUfEUp3hI1Zf2Nx8ksbMRKZ0f1vehk0Z00IqxagAQ_E9ZuPEXVjC5IRJ_QoibQ1gzC07CQzZM2p0bu8jPlgOLJEIJ41JO35D2enkkvzGp8maNmN-DgvzpDCydUM8wNb--rDEGkkFRKJ6x6QTk_qKe4Rl76cCsGQ3M9diujvBAPMxbfBwRBeZOYATdV0NIhQfebHoHWq3gZP3n-fLA-zUPYo-Brw2lzv5QHqR7W4EajWIEt5j555iX0_vTZygxWYK38JENIKDJTqwdjx7WtCLZhFb8bg_IVu5ztRLzCXbW2GD9wgIyK9TTpzGlU8gK0V-q2GpzLN2f496GTLj54I05jcfx73ekT3e5smypdvuRPcAcjzMn8tTwkCLARLPESrchDgit8-Wfuw0FpEoWWllFdDfkihEh2rrFNbsLbpqojkogmYpbVJRREc0nCYVp60ySmpC6sG9cRxcpZJaKSigdLdiMJgbjulfMlgUuDR__1N1GtUJtmtiSAdu5sdjOdEAtB-8uwOfVjDHPeYY2Wth7MZIEDrCsuFxayAsHr7gzUkDvjdmZWGInpiUImBNVZv4EXx-hyE4O9RrIk83XeMYfjqcqVSiQHWoWSYlbak0fFQkE0WGPz_M8Kp9_fEJBZzEsBYLg0wLDzp6Kn9Xm3WGELI5UI1wLN2kdOEzHXARhEerlx8d2JiFUDba5sLESpkLKEDFPgFGy4lfB0_5QyRxiglfKEYejl5iFpiZdKxmD9k5WY3Z6Z";

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

// COMMANDS
const commands = [
  new SlashCommandBuilder()
    .setName("staffapppass")
    .setDescription("Pass staff application")
    .addUserOption(o =>
      o.setName("user")
       .setDescription("Applicant")
       .setRequired(true))
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
      o.setName("user")
       .setDescription("Applicant")
       .setRequired(true))
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

// REGISTER COMMANDS
const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
  await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
  console.log("✅ Commands registered");
})();

client.once("clientReady", () => {
  console.log("🤖 Bot online");
});

// COMMAND HANDLER
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  // ✅ FIXED (no timeout)
  await interaction.deferReply({ flags: 64 });

  const user = interaction.options.getUser("user");
  const department = interaction.options.getString("department");
  const passed = interaction.commandName === "staffapppass";

  const resultEmbed = new EmbedBuilder()
    .setColor(0x8B0000)
    .setTitle("STAFF APPLICATION RESULT")
    .setDescription(`
# STAFF APPLICATION RESULT

**Applicant:** ${user.username}

---

## Department
${department}

---

## Result
${passed ? "**PASSED**" : "**FAILED**"}

---

## IMPORTANT NOTICE

YOU MUST JOIN OUR ROBLOX GROUP TO BE IN THIS SERVER

https://www.roblox.com/share/g/463381711

---

Recruitment Department
`);

  try {
    await user.send({ embeds: [resultEmbed] });

    if (passed) {

      // ✅ USERNAME EMBED
      const usernameEmbed = new EmbedBuilder()
        .setColor(0x8B0000)
        .setTitle("ROBLOX USERNAME REQUIRED")
        .setDescription(`
# ROBLOX USERNAME REQUIRED

Please provide your Roblox username to proceed.

---

## Instructions

- Enter your **exact Roblox username**
- Do NOT use display name

---

## Time Limit

You have **10 hours** to reply.

---

Recruitment Department
`);

      await user.send({ embeds: [usernameEmbed] });

      waiting.set(user.id, department);
    }

    await interaction.editReply("✅ Application processed.");

  } catch {
    await interaction.editReply("❌ Could not DM user.");
  }
});

// DM HANDLER
client.on("messageCreate", async message => {
  if (message.author.bot) return;
  if (message.channel.type !== 1) return;

  if (!waiting.has(message.author.id)) return;

  const username = message.content;
  const department = waiting.get(message.author.id);

  console.log("Username:", username);
  console.log("Department:", department);

  try {
    const id = await noblox.getIdFromUsername(username);

    await noblox.setRank(463381711, id, department);

    await message.author.send(`✅ You have been ranked as ${department}.`);

  } catch (err) {
    console.error("❌ RANK ERROR:", err);
    await message.author.send("❌ Failed to rank you. Contact staff.");
  }

  waiting.delete(message.author.id);
});

client.login(TOKEN);