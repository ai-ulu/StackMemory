/**
 * AI-ULU Slack Bot
 * 
 * Commands:
 * - /remember <text> - Store a memory
 * - /recall <query> - Search memories
 * - /search <query> - Semantic search
 * - /stats - Get memory stats
 */

const { App } = require('@slack/bolt')
const fetch = require('node-fetch')

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN
})

const API_URL = process.env.API_URL || 'http://backend:8000'

// Store user tokens (in production, use a database)
const userTokens = new Map()

// /remember command
app.command('/remember', async ({ command, ack, respond }) => {
  await ack()

  const { text, user_id } = command
  
  if (!text) {
    await respond('Usage: /remember <text>')
    return
  }

  try {
    const token = userTokens.get(user_id)
    if (!token) {
      await respond('Please authenticate first: /aiulu-auth')
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
        source: 'slack'
      })
    })

    if (!response.ok) {
      throw new Error('Failed to store memory')
    }

    await respond({
      text: `✅ Remembered: "${text}"`,
      response_type: 'ephemeral'
    })
  } catch (error) {
    console.error('Remember error:', error)
    await respond('❌ Failed to store memory. Please try again.')
  }
})

// /recall command
app.command('/recall', async ({ command, ack, respond }) => {
  await ack()

  const { text, user_id } = command
  
  if (!text) {
    await respond('Usage: /recall <query>')
    return
  }

  try {
    const token = userTokens.get(user_id)
    if (!token) {
      await respond('Please authenticate first: /aiulu-auth')
      return
    }

    const response = await fetch(`${API_URL}/api/memory/recall`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: text })
    })

    if (!response.ok) {
      throw new Error('Failed to recall memories')
    }

    const { memories } = await response.json()

    if (memories.length === 0) {
      await respond('No memories found.')
      return
    }

    const blocks = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Found ${memories.length} memories:*`
        }
      },
      { type: 'divider' },
      ...memories.slice(0, 5).map(m => ({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `• ${m.content}\n_${new Date(m.created_at).toLocaleDateString()}_`
        }
      }))
    ]

    await respond({
      blocks,
      response_type: 'ephemeral'
    })
  } catch (error) {
    console.error('Recall error:', error)
    await respond('❌ Failed to recall memories. Please try again.')
  }
})

// /search command
app.command('/search', async ({ command, ack, respond }) => {
  await ack()

  const { text, user_id } = command
  
  if (!text) {
    await respond('Usage: /search <query>')
    return
  }

  try {
    const token = userTokens.get(user_id)
    if (!token) {
      await respond('Please authenticate first: /aiulu-auth')
      return
    }

    const response = await fetch(`${API_URL}/api/memory/search?q=${encodeURIComponent(text)}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      throw new Error('Failed to search memories')
    }

    const { results } = await response.json()

    if (results.length === 0) {
      await respond('No results found.')
      return
    }

    const blocks = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Search results for "${text}":*`
        }
      },
      { type: 'divider' },
      ...results.slice(0, 5).map(r => ({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `• ${r.content}\n_Score: ${r.score.toFixed(2)}_`
        }
      }))
    ]

    await respond({
      blocks,
      response_type: 'ephemeral'
    })
  } catch (error) {
    console.error('Search error:', error)
    await respond('❌ Failed to search memories. Please try again.')
  }
})

// /stats command
app.command('/stats', async ({ command, ack, respond }) => {
  await ack()

  const { user_id } = command

  try {
    const token = userTokens.get(user_id)
    if (!token) {
      await respond('Please authenticate first: /aiulu-auth')
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

    await respond({
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*📊 Your Memory Stats*'
          }
        },
        { type: 'divider' },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Total Memories:*\n${stats.total_memories}`
            },
            {
              type: 'mrkdwn',
              text: `*This Week:*\n${stats.this_week}`
            },
            {
              type: 'mrkdwn',
              text: `*Facts:*\n${stats.by_type.fact || 0}`
            },
            {
              type: 'mrkdwn',
              text: `*Preferences:*\n${stats.by_type.preference || 0}`
            }
          ]
        }
      ],
      response_type: 'ephemeral'
    })
  } catch (error) {
    console.error('Stats error:', error)
    await respond('❌ Failed to get stats. Please try again.')
  }
})

// Start the app
;(async () => {
  await app.start()
  console.log('⚡️ AI-ULU Slack bot is running!')
})()
