const Command = require('../../../core/Command')

class ClearMessages extends Command {
  constructor(client) {
    super(client, {
      name: 'clear',
      category: 'Admin',
      description: 'Removes # of messages',
      usage: `clear <0-100>`,
      aliases: ['delete', 'rm', 'purge'],
      guildOnly: true,
      args: true,
      permsNeeded: ['MANAGE_MESSAGES']
    })
  }

  async run(client, msg, args) {
    await msg.delete()

    const { Utils } = client
    const { channel } = msg
    const user = msg.mentions.users.first()

    if (channel.type === 'dm') return
    const amount = user ? args[1] : args[0]

    if (user && isNaN(args[1])) {
      const m = await channel.send(
        Utils.embed(msg, 'yellow').setDescription('The amount parameter isn`t a number!')
      )
      return m.delete(10000)
    }

    if (!user && isNaN(args[0])) {
      const m = await channel.send(
        Utils.embed(msg, 'yellow').setDescription('The amount parameter isn`t a number!')
      )
      return m.delete(10000)
    }

    if (amount > 100) {
      const m = await channel.send(
        Utils.embed(msg, 'yellow').setDescription(
          'You can`t delete more than 100 messages at once!'
        )
      )
      return m.delete(10000)
    }

    if (amount < 1) {
      const m = await channel.send(
        Utils.embed(msg, 'yellow').setDescription('You have to delete at least 1 msg!')
      )
      return m.delete(10000)
    }

    let messages = await channel.fetchMessages({ limit: user ? 100 : amount })

    if (user) {
      const filterBy = user ? user.id : client.user.id
      messages = messages
        .filter((m) => m.author.id === filterBy)
        .array()
        .slice(0, amount)
    }
    return channel.bulkDelete(messages)
  }
}
module.exports = ClearMessages