
export const motivationalQuotes = [
  "The secret of getting ahead is getting started. - Mark Twain",
  "It always seems impossible until it's done. - Nelson Mandela",
  "Don't watch the clock; do what it does. Keep going. - Sam Levenson",
  "The future depends on what you do today. - Mahatma Gandhi",
  "Believe you can and you're halfway there. - Theodore Roosevelt",
  "Success is not final, failure is not fatal: it is the courage to continue that counts. - Winston Churchill",
  "The only way to do great work is to love what you do. - Steve Jobs",
  "Your limitation—it's only your imagination.",
  "Push yourself, because no one else is going to do it for you.",
  "Great things never come from comfort zones.",
  "Dream it. Wish it. Do it.",
  "Success doesn't just find you. You have to go out and get it.",
  "The harder you work for something, the greater you'll feel when you achieve it.",
  "Dream bigger. Do bigger.",
  "Don't stop when you're tired. Stop when you're done.",
  "Wake up with determination. Go to bed with satisfaction.",
  "Do something today that your future self will thank you for.",
  "Little things make big days.",
  "It's going to be hard, but hard does not mean impossible.",
  "Don't wait for opportunity. Create it.",
  "Sometimes we're tested not to show our weaknesses, but to discover our strengths.",
  "The key to success is to focus on goals, not obstacles.",
  "Dream it. Believe it. Build it.",
  "Your only limit is you.",
  "Sometimes later becomes never. Do it now.",
  "One day or day one. You decide.",
  "The best time to plant a tree was 20 years ago. The second best time is now.",
  "You don't have to be great to start, but you have to start to be great. - Zig Ziglar",
  "A journey of a thousand miles begins with a single step. - Lao Tzu",
  "What you get by achieving your goals is not as important as what you become by achieving your goals. - Henry David Thoreau"
];

export function getRandomQuote(): string {
  const randomIndex = Math.floor(Math.random() * motivationalQuotes.length);
  return motivationalQuotes[randomIndex];
}

export function getDailyQuote(dateString: string): string {
  // Use date as seed for consistent quote per day
  const date = new Date(dateString);
  const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000);
  const index = dayOfYear % motivationalQuotes.length;
  return motivationalQuotes[index];
}
