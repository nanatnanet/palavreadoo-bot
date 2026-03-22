const TelegramBot = require('node-telegram-bot-api');
const cron = require('node-cron');

const TOKEN = process.env.TOKEN;

const bot = new TelegramBot(TOKEN, { polling: true });

// Estado do jogo
let game = {
  letters: [],
  center: '',
  scores: {}
};

// Gerar letras
function generateLetters() {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let letters = [];

  while (letters.length < 7) {
    let l = alphabet[Math.floor(Math.random() * alphabet.length)];
    if (!letters.includes(l)) letters.push(l);
  }

  game.letters = letters;
  game.center = letters[Math.floor(Math.random() * letters.length)];
}

// Reset diário
cron.schedule('0 0 * * *', () => {
  generateLetters();
  game.scores = {};
});

// Comando start
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id,
`🎮 *Palavreado*

Letras: ${game.letters.join(' ')}
Letra central: ${game.center}

Envie palavras para jogar!`,
  { parse_mode: "Markdown" });
});

// Jogar palavra
bot.on('message', (msg) => {
  const user = msg.from.id;
  const text = msg.text?.toUpperCase();

  if (!text || text.startsWith('/')) return;

  if (!text.includes(game.center)) {
    return bot.sendMessage(msg.chat.id, "❌ Use a letra central!");
  }

  if (text.length < 4) {
    return bot.sendMessage(msg.chat.id, "❌ Mínimo 4 letras!");
  }

  for (let l of text) {
    if (!game.letters.includes(l)) {
      return bot.sendMessage(msg.chat.id, "❌ Letras inválidas!");
    }
  }

  if (!game.scores[user]) game.scores[user] = 0;

  let points = text.length === 4 ? 1 : text.length;

  let isPangram = game.letters.every(l => text.includes(l));
  if (isPangram) {
    points += 7;
    bot.sendMessage(msg.chat.id, "🔥 PANGRAMA!");
  }

  game.scores[user] += points;

  bot.sendMessage(msg.chat.id,
`✅ ${text}
+${points} pontos
Total: ${game.scores[user]}`
  );
});

// Ranking
bot.onText(/\/ranking/, (msg) => {
  let ranking = Object.entries(game.scores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  let text = "🏆 Ranking\n\n";

  ranking.forEach((r, i) => {
    text += `${i + 1}. ${r[0]} - ${r[1]} pts\n`;
  });

  bot.sendMessage(msg.chat.id, text);
});

// Inicializar
generateLetters();