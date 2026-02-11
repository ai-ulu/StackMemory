/**
 * AI-ULU Discord Bot
 * 
 * Commands:
 * - /remember <text> - Store a memory
 * - /recall <query> - Search memories
 * - /search <query> - Semantic search
 * - /stats - Get memory stats
 */

const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes } = require('discord.js')
const fetch = require('node-fetch')

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages
  ]
})

const API_URL = process.env.API_URL || 'http://backend:8000'
const userTokens = new Map()

// Register slash commands
const commands = [
  new SlashCommandBuilder()
    .setName('remember')
    .setDescription('Store a memory')
    .addStringOption(option =>
      option.setName('text')
        .setDescription('What to remember')
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName('recall')
    .setDescription('Search your memories')
    .addStringOption(option =>
      option.setName('query')
        .setDescription('What to search for')
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName('search')
    .setDescription('Semantic search')
    .addStringOption(option =>
      option.setName('query')
        .setDescription('Search query')
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Get your memory stats')
].map(command => command.toJSON())

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN)

// Register commands
;(async () => {
  try {
    console.log('Registering slash commands...')
    await rest.put(
      Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
      { body: commands }
    )
    console.log('✅ Slash commands registered!')
  } catch (error) {
    console.error('Failed to register commands:', error)
  }
})()

client.on('ready', () => {
  console.log(`⚡️ AI-ULU Discord bot logged in as ${client.user.tag}!`)
})

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return

  const { commandName, user } = interaction

  try {
    const token = userTokens.get(user.id)
    if (!token) {
      await interaction.reply({
        content: '❌ Please authenticate first with `/auth`',
        ephemeral: true
      })
      return
    }

    switch (commandName) {
      case 'remember':
        await handleRemember(interaction, token)
        break
      case 'recall':
        await handleRecall(interaction, token)
        break
      case 'search':
        await handleSearch(interaction, token)
        break
      case 'stats':
        await handleStats(interaction, token)
        break
    }
  } catch (error) {
    console.error(`Command error (${commandName}):`, error)
    await interaction.reply({
      content: '❌ An error occurred. Please try again.',
      ephemeral: true
    })
  }
})

async function handleRemember(interaction, token) {
  const text = interaction.options.getString('text')

  const response = await fetch(`${API_URL}/api/memory`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      content: text,
      type: 'fact',
      source: 'discord'
    })
  })

  if (!response.ok) {
    throw new Error('Failed to store memory')
  }

  await interaction.reply({
    content: `✅ Remembered: "${text}"`,
    ephemeral: true
  })
}

async function handleRecall(interaction, token) {
  const query = interaction.options.getString('query')

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
    await interaction.reply({
      content: 'No memories found.',
      ephemeral: true
    })
    return
  }

  const embed = {
    color: 0x0099ff,
    title: `Found ${memories.length} memories`,
    fields: memories.slice(0, 5).map(m => ({
      name: new Date(m.created_at).toLocaleDateString(),
      value: m.content
    })),
    timestamp: new Date()
  }

  await interaction.reply({
    embeds: [embed],
    ephemeral: true
  })
}

async function handleSearch(interaction, token) {
  const query = interaction.options.getString('query')

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
    await interaction.reply({
      content: 'No results found.',
      ephemeral: true
    })
    return
  }

  const embed = {
    color: 0x0099ff,
    title: `Search results for "${query}"`,
    fields: results.slice(0, 5).map(r => ({
      name: `Score: ${r.score.toFixed(2)}`,
      value: r.content
    })),
    timestamp: new Date()
  }

  await interaction.reply({
    embeds: [embed],
    ephemeral: true
  })
}

async function handleStats(interaction, token) {
  const response = await fetch(`${API_URL}/api/memory/stats`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })

  if (!response.ok) {
    throw new Error('Failed to get stats')
  }

  const stats = await response.json()

  const embed = {
    color: 0x0099ff,
    title: '📊 Your Memory Stats',
    fields: [
      {
        name: 'Total Memories',
        value: stats.total_memories.toString(),
        inline: true
      },
      {
        name: 'This Week',
        value: stats.this_week.toString(),
        inline: true
      },
      {
        name: 'Facts',
        value: (stats.by_type.fact || 0).toString(),
        inline: true
      },
      {
        name: 'Preferences',
        value: (stats.by_type.preference || 0).toString(),
        inline: true
      }
    ],
    timestamp: new Date()
  }

  await interaction.reply({
    embeds: [embed],
    ephemeral: true
  })
}

client.login(process.env.DISCORD_TOKEN)
