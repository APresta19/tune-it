import shuffleArray from "../../backend/services/shuffleArray";

export const prompts = [
  { id: 1,  text: "A song you listened to a lot last week",              category: "Listening History",  fillInBlank: false },
  { id: 2,  text: "A song you've had on repeat this month",              category: "Listening History",  fillInBlank: false },
  { id: 3,  text: "A song that was your most played last year",          category: "Listening History",  fillInBlank: false },
  { id: 4,  text: "A song you discovered recently and can't stop playing", category: "Listening History", fillInBlank: false },
  { id: 5,  text: "A song you always skip but never remove from your playlist", category: "Listening History", fillInBlank: false },
  { id: 6,  text: "A song that reminds you of summer",                   category: "Mood & Feeling",     fillInBlank: false },
  { id: 7,  text: "A song that reminds you of a road trip",              category: "Mood & Feeling",     fillInBlank: false },
  { id: 8,  text: "A song that reminds you of being a kid",              category: "Mood & Feeling",     fillInBlank: false },
  { id: 9,  text: "A song that reminds you of your hometown",            category: "Mood & Feeling",     fillInBlank: false },
  { id: 10, text: "A song that reminds you of a movie or TV show",       category: "Mood & Feeling",     fillInBlank: false },
  { id: 11, text: "A song that makes you feel happy",                    category: "Mood & Feeling",     fillInBlank: false },
  { id: 12, text: "A song that makes you feel nostalgic",                category: "Mood & Feeling",     fillInBlank: false },
  { id: 13, text: "A song that makes you want to cry",                   category: "Mood & Feeling",     fillInBlank: false },
  { id: 14, text: "A song that makes you feel powerful",                 category: "Mood & Feeling",     fillInBlank: false },
  { id: 15, text: "A song that makes you feel calm",                     category: "Mood & Feeling",     fillInBlank: false },
  { id: 16, text: "A song that makes you want to dance",                 category: "Mood & Feeling",     fillInBlank: false },
  { id: 17, text: "A song that makes you want to drive fast",            category: "Mood & Feeling",     fillInBlank: false },
  { id: 18, text: "A song that makes you feel like the main character",  category: "Mood & Feeling",     fillInBlank: false },
  { id: 19, text: "A song you listen to when you're sad",                category: "Mood & Feeling",     fillInBlank: false },
  { id: 20, text: "A song you listen to when you need motivation",       category: "Mood & Feeling",     fillInBlank: false },
  { id: 21, text: "A song you listen to when you can't sleep",           category: "Mood & Feeling",     fillInBlank: false },
  { id: 22, text: "A song you listen to when you're getting ready to go out", category: "Mood & Feeling", fillInBlank: false },
  { id: 23, text: "A song that reminds you of ___",                      category: "Fill In The Blank",  fillInBlank: true  },
  { id: 24, text: "A song that makes you feel ___",                      category: "Fill In The Blank",  fillInBlank: true  },
  { id: 25, text: "A song you associate with ___",                       category: "Fill In The Blank",  fillInBlank: true  },
  { id: 26, text: "A song you'd put on a playlist called ___",           category: "Fill In The Blank",  fillInBlank: true  },
  { id: 27, text: "A song you listen to when you're ___",                category: "Fill In The Blank",  fillInBlank: true  },
  { id: 28, text: "Your go-to song at a party",                          category: "Social",             fillInBlank: false },
  { id: 29, text: "A song everyone knows but nobody admits they like",   category: "Social",             fillInBlank: false },
  { id: 30, text: "A song you'd play to impress someone",                category: "Social",             fillInBlank: false },
  { id: 31, text: "A song you'd be embarrassed to have on your playlist", category: "Social",            fillInBlank: false },
  { id: 32, text: "A song you and a friend have a shared memory of",     category: "Social",             fillInBlank: false },
  { id: 33, text: "A song you'd dedicate to your best friend",           category: "Social",             fillInBlank: false },
  { id: 34, text: "A song you'd play on a first date",                   category: "Social",             fillInBlank: false },
  { id: 35, text: "A song you'd want played at your wedding",            category: "Social",             fillInBlank: false },
  { id: 36, text: "A song you'd want played at your funeral",            category: "Social",             fillInBlank: false },
  { id: 37, text: "A song you'd play to annoy someone",                  category: "Social",             fillInBlank: false },
  { id: 38, text: "Your all time favorite song",                         category: "Identity",           fillInBlank: false },
  { id: 39, text: "A song that defined an era of your life",             category: "Identity",           fillInBlank: false },
  { id: 40, text: "A song that feels like it was written about you",     category: "Identity",           fillInBlank: false },
  { id: 41, text: "A song only you seem to know about",                  category: "Identity",           fillInBlank: false },
  { id: 42, text: "A song from an artist nobody expected you to like",   category: "Identity",           fillInBlank: false },
  { id: 43, text: "A song you're ashamed to admit you love",             category: "Identity",           fillInBlank: false },
  { id: 44, text: "A song that changed how you think about music",       category: "Identity",           fillInBlank: false },
  { id: 45, text: "A song from before you were born that you love",      category: "Identity",           fillInBlank: false },
  { id: 46, text: "A perfect song to start a playlist with",             category: "Playlist Vibes",     fillInBlank: false },
  { id: 47, text: "A perfect song to end a playlist with",               category: "Playlist Vibes",     fillInBlank: false },
  { id: 48, text: "A song that belongs on a late night drive playlist",  category: "Playlist Vibes",     fillInBlank: false },
  { id: 49, text: "A song that belongs on a workout playlist",           category: "Playlist Vibes",     fillInBlank: false },
  { id: 50, text: "A song that belongs on a rainy day playlist",         category: "Playlist Vibes",     fillInBlank: false },
  { id: 51, text: "A song that belongs on a summer BBQ playlist",        category: "Playlist Vibes",     fillInBlank: false },
  { id: 52, text: "A song that belongs on a heartbreak playlist",        category: "Playlist Vibes",     fillInBlank: false },
  { id: 53, text: "A song that belongs on a hype playlist",              category: "Playlist Vibes",     fillInBlank: false },
];

export function getRandomPrompts(count)
{
  const p = prompts.slice(0, count);
  return shuffleArray(p);
}

export function getByCategory(category)
{
  return prompts.filter(p => p.category === category);
}