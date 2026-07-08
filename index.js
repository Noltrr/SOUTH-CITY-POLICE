require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  Events,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

const fs = require("fs");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

const DATA_FILE = "./data.json";

let users = {};

if (fs.existsSync(DATA_FILE)) {
  users = JSON.parse(fs.readFileSync(DATA_FILE));
}

function saveData() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2));
}

client.once(Events.ClientReady, async () => {
  console.log(`${client.user.tag} جاهز`);

  const channel = await client.channels.fetch("1523857691141996564");

  const embed = new EmbedBuilder()
    .setColor("#0c4dce")
    .setTitle("SOUTH CITY POLICE")
    .setDescription(`
**🚨 نظام تسجيل الحضور للعساكر 🚨**


مرحبًا بكم في نظام تسجيل الحضور الخاص بعساكرنا! 🚔

🚔 تسجيل دخول:
• اضغط على زر "تسجيل دخول" 🚔 عند بدء الخدمة.
• سيتم تسجيل وقت دخولك تلقائيًا.

😴 وضع الغفوه:
• اضغط على زر "غفوه/عودة" 😴 عند الحاجة للخروج المؤقت (AFK).
• اضغط عليه مرة أخرى عند العودة لإكمال الخدمة.

🔴 تسجيل خروج:
• اضغط على زر "تسجيل خروج" 🔴 عند إنهاء الخدمة.
• سيتم تسجيل وقت خروجك وحساب عدد ساعات الخدمة.

📋 عرض الحضور:
• اضغط على زر "عرض الحضور" 📋 لعرض قائمة بالعساكر الذين قاموا بتسجيل الدخول حاليًا.
• يمكنك رؤية الرتبة والرتب التي يحملها كل فرد بسهولة.

ملاحظات:
• تأكد من تسجيل دخولك وخروجك في الوقت المحدد للحفاظ على سجلك.
• أي تأخير في التسجيل قد يؤثر على سجل حضورك.
• مع التزامك بالنظام الإداري لجميع العساكر.
`)
    .setFooter({ text: "South City Police" });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("login")
      .setLabel("تسجيل دخول🚔")
      .setStyle(ButtonStyle.Success),

    new ButtonBuilder()
      .setCustomId("afk")
      .setLabel("غفوه/عودة😴")
      .setStyle(ButtonStyle.Secondary),

    new ButtonBuilder()
      .setCustomId("logout")
      .setLabel("تسجيل خروج🔴")
      .setStyle(ButtonStyle.Danger),

    new ButtonBuilder()
      .setCustomId("stats")
      .setLabel(" عرض الحضور📋")
      .setStyle(ButtonStyle.Secondary)
  );

  await channel.send({
    embeds: [embed],
    components: [row]
  });
});
client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isButton()) return;

    const id = interaction.user.id;

if (!users[id]) {
    users[id] = {
        total: 0,
        login: null,
        afk: false,
        afkStart: null
    };
}

    if (interaction.customId === "login") {

        if (users[id].login) {
            return interaction.reply({
                content: "أنت مسجل دخول بالفعل.",
                ephemeral: true
            });
        }

        users[id].login = Date.now();
        saveData();

        return interaction.reply({
            content: "✅ تم تسجيل دخولك.",
            ephemeral: true
        });
    }

    if (interaction.customId === "logout") {

        if (!users[id].login) {
            return interaction.reply({
                content: "أنت غير مسجل دخول.",
                ephemeral: true
            });
        }

        let time = Math.floor((Date.now() - users[id].login) / 1000);

if (users[id].afk && users[id].afkStart) {
    time -= Math.floor((Date.now() - users[id].afkStart) / 1000);
}

        users[id].total += time;
        users[id].login = null;

        saveData();

        return interaction.reply({
            content: `✅ تم تسجيل خروجك.\nمدة الخدمة: ${Math.floor(time / 60)} دقيقة`,
            ephemeral: true
        });
    }

    if (interaction.customId === "stats") {

    const online = Object.entries(users)
        .filter(([_, user]) => user.login)
        .map(([userId, user]) => {
            const minutes = Math.floor((Date.now() - user.login) / 60000);
            return `👮 <@${userId}> - ${minutes} دقيقة`;
        });

    return interaction.reply({
        content: online.length
            ? `**📋 الأعضاء الموجودون في الخدمة:**\n\n${online.join("\n")}`
            : "لا يوجد أي شخص مسجل دخول حالياً.",
        ephemeral: true
    });
}

if (interaction.customId === "afk") {

    if (!users[id].login) {
        return interaction.reply({
            content: "❌ لازم تسجل دخول أول.",
            ephemeral: true
        });
    }

    if (!users[id].afk) {

        users[id].afk = true;
        users[id].afkStart = Date.now();

        saveData();

        return interaction.reply({
            content: "✅ اختبار الغفوة الجديد شغال",
            ephemeral: true
        });

    } else {

        const afkTime = Date.now() - users[id].afkStart;

        users[id].total += afkTime / 1000;

        users[id].afk = false;
        users[id].afkStart = null;

        users[id].login = Date.now();

        saveData();

        return interaction.reply({
            content: "✅ تم إنهاء الغفوة، تم استكمال الوقت.",
            ephemeral: true
        });
    }
}
});
client.login(process.env.TOKEN);