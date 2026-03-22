const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');

const token = process.env.TOKEN;
const bot = new TelegramBot(token, { polling: true });

// carregar palavras (rápido com Set)
const wordSet = new Set(
  fs.readFileSync('words.txt', 'utf-8')
  .split('\n')
  .map(w => w.trim().toUpperCase())
);

// jogo
let game = {
  letters: ['D', 'P', 'Q', 'T', 'J', 'F', 'C'],
  center: 'P',
  scores: {}
};

// filtro
function isValidWord(word) {
  if (word.length < 4) return false;
  
  // precisa ter letra central
  if (!word.includes(game.center)) return false;
  
  // bloquear plural
  if (word.endsWith('S')) return false;
  
  // apenas letras
  if (!/^[A-Z]+$/.test(word)) return false;
  
  return true;
}

// start
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id,
    `🎮 Palavreado

Letras: ${game.letters.join(' ')}
Letra central: ${game.center}

Envie palavras para jogar!`);
});

// ranking
bot.onText(/\/ranking/, (msg) => {
  let ranking = Object.entries(game.scores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  
  let text = "🏆 Ranking Palavreado\n\n";
  
  ranking.forEach((r, i) => {
    text += `${i + 1}. ${r[0]} - ${r[1]} pts\n`;
  });
  
  bot.sendMessage(msg.chat.id, text);
});

// receber palavras
bot.on('message', (msg) => {
  const text = msg.text?.toUpperCase();
  const user = msg.from.first_name;
  
  if (!text || text.startsWith('/')) return;
  
  // validar palavra
  if (!wordSet.has(text) || !isValidWord(text)) {
    return bot.sendMessage(msg.chat.id, "❌ Palavra inválida!");
  }
  
  // pontuação
  let points = text.length === 4 ? 1 : text.length;
  
  // salvar pontuação
  if (!game.scores[user]) game.scores[user] = 0;
  game.scores[user] += points;
  
  bot.sendMessage(msg.chat.id,
    `✅ ${text}
⭐ +${points} pontos
🏆 Total: ${game.scores[user]}`);
});