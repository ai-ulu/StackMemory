/**
 * AI-ULU Telegram Bot
 * 
 * Commands:
 * - /remember <text> - Store a memory
 * - /recall <query> - Search memories
 * - /search <query> - Semantic search
 * - /stats - Get memory stats
 */

const TelegramBot = require('node-telegram-bot-api')
const fetch = require('node-fetch')

const token = process.env.TELEGRAM_TOKEN
const bot = new TelegramBot(token, { polling: true })

const API_URL = process.env.API_URL || 'http://backend:8000'
const userTokens = new Map()

// /start command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id
  bot.sendMessage(chatId, `
🧠 *Welcome to AI-ULU!*

Your personal AI memory assistant.

*Commands:*
/remember <text> - Store a memory
/recall <query> - Search memories
/search <query> - Semantic search
/stats - Get your stats
/help - Show this message

First, authenticate with /auth
  `, { parse_mode: 'Markdown' })
})

// /help command
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id
  bot.sendMessage(chatId, `
*AI-ULU Commands:*

/remember <text> - Store a memory
/recall <query> - Search memories
/search <query> - Semantic search
/stats - Get your stats

*Examples:*
/remember I prefer dark mode
/recall what do I prefer
/search preferences
  `, { parse_mode: 'Markdown' })
})

// /remember command
bot.onText(/\/remember (.+)/, async (msg, match) => {
  const chatId = msg.chat.id
  const userId = msg.from.id
  const text = match[1]

  try {
    const token = userTokens.get(userId)
    if (!token) {
      bot.sendMessage(chatId, '❌ Please authenticate first with /auth')
      return
    }

    const response = await fetch(`${API_URL}/api/memory`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: text,
        type: 'fact',
        source: 'telegram'
      })
    })

    if (!response.ok) {
      throw new Error('Failed to store memory')
    }

    bot.sendMessage(chatId, `✅ Remembered: "${text}"`)
  } catch (error) {
    console.error('Remember error:', error)
    bot.sendMessage(chatId, '❌ Failed to store memory. Please try again.')
  }
})

// /recall command
bot.onText(/\/recall (.+)/, async (msg, match) => {
  const chatId = msg.chat.id
  const userId = msg.from.id
  const query = match[1]

  try {
    const token = userTokens.get(userId)
    if (!token) {
      bot.sendMessage(chatId, '❌ Please authenticate first with /auth')
      return
    }

    const response = await fetch(`${API_URL}/api/memory/recall`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query })
    })

    if (!response.ok) {
      throw new Error('Failed to recall memories')
    }

    const { memories } = await response.json()

    if (memories.length === 0) {
      bot.sendMessage(chatId, 'No memories found.')
      return
    }

    let message = `*Found ${memories.length} memories:*\n\n`
    memories.slice(0, 5).forEach((m, i) => {
      const date = new Date(m.created_at).toLocaleDateString()
      message += `${i + 1}. ${m.content}\n   _${date}_\n\n`
    })

    bot.sendMessage(chatId, message, { parse_mode: 'Markdown' })
  } catch (error) {
    console.error('Recall error:', error)
    bot.sendMessage(chatId, '❌ Failed to recall memories. Please try again.')
  }
})

// /search command
bot.onText(/\/search (.+)/, async (msg, match) => {
  const chatId = msg.chat.id
  const userId = msg.from.id
  const query = match[1]

  try {
    const token = userTokens.get(userId)
    if (!token) {
      bot.sendMessage(chatId, '❌ Please authenticate first with /auth')
      return
    }

    const response = await fetch(
      `${API_URL}/api/memory/search?q=${encodeURIComponent(query)}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    )

    if (!response.ok) {
      throw new Error('Failed to search memories')
    }

    const { results } = await response.json()

    if (results.length === 0) {
      bot.sendMessage(chatId, 'No results found.')
      return
    }

    let message = `*Search results for "${query}":*\n\n`
    results.slice(0, 5).forEach((r, i) => {
      message += `${i + 1}. ${r.content}\n   _Score: ${r.score.toFixed(2)}_\n\n`
    })

    bot.sendMessage(chatId, message, { parse_mode: 'Markdown' })
  } catch (error) {
    console.error('Search error:', error)
    bot.sendMessage(chatId, '❌ Failed to search memories. Please try again.')
  }
})

// /stats command
bot.onText(/\/stats/, async (msg) => {
  const chatId = msg.chat.id
  const userId = msg.from.id

  try {
    const token = userTokens.get(userId)
    if (!token) {
      bot.sendMessage(chatId, '❌ Please authenticate first with /auth')
      return
    }

    const response = await fetch(`${API_URL}/api/memory/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      throw new Error('Failed to get stats')
    }

    const stats = await response.json()

    const message = `
📊 *Your Memory Stats*

Total Memories: ${stats.total_memories}
This Week: ${stats.this_week}
Facts: ${stats.by_type.fact || 0}
Preferences: ${stats.by_type.preference || 0}
    `

    bot.sendMessage(chatId, message, { parse_mode: 'Markdown' })
  } catch (error) {
    console.error('Stats error:', error)
    bot.sendMessage(chatId, '❌ Failed to get stats. Please try again.')
  }
})

console.log('⚡️ AI-ULU Telegram bot is running!')
