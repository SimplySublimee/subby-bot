/*!
 * Coded by CallMeKory - https://github.com/callmekory
 * 'It’s not a bug – it’s an undocumented feature.'
 */
import { GeneralDBConfig, NezukoMessage } from 'typings'
import { get } from 'unirest'
import urljoin from 'url-join'

import { Command } from '../../core/base/Command'
import { BotClient } from '../../core/BotClient'
import { database } from '../../core/database/database'
import { Log } from '../../core/Logger'
import { Utils } from '../../core/Utils'

/**
 * Command to enable, disable and get information for your PiHole server
 */
export default class PiHole extends Command {
  public color: string

  constructor(client: BotClient) {
    super(client, {
      args: true,
      category: 'Networking',
      description: 'PiHole stats and management',
      name: 'pihole',
      ownerOnly: true,
      usage: ['pihole [enable/disable]', 'pihole stats'],
      webUI: true
    })
    this.color = 'green'
  }

  // TODO add pihole typings
  public async run(client: BotClient, msg: NezukoMessage, args: any[]) {
    // * ------------------ Setup --------------------

    const { p } = client
    const { errorMessage, validOptions, missingConfig, embed, capitalize } = Utils
    const { channel } = msg

    // * ------------------ Config --------------------

    const db = await database.models.Configs.findOne({ where: { id: client.config.ownerID } })
    const config = JSON.parse(db.get('config') as string) as GeneralDBConfig
    const { host, apiKey } = config.pihole

    // * ------------------ Check Config --------------------

    if (!host || !apiKey) {
      const settings = [`${p}config set pihole host <PIHOLEURL>`, `${p}config set pihole apiKey <APIKEY>`]
      return missingConfig(msg, 'pihole', settings)
    }

    // * ------------------ Logic --------------------

    const setState = async (newState) => {
      try {
        const response = await get(urljoin(host, `admin/api.php?${newState}&auth=${apiKey}`)).headers({
          accept: 'application/json'
        })
        const data = await response.body

        if (data.status !== 'enabled' && data.status !== 'disabled') {
          await errorMessage(msg, 'API key is incorrect')
        }

        const text = newState === 'enable' ? 'enabled' : 'disabled'
        const color = newState === 'enable' ? 'green' : 'yellow'

        return channel.send(embed(msg, color).setDescription(`**PiHole [ ${text} ]**`))
      } catch (e) {
        Log.error('PiHole', 'Failed to connect to PiHole', e)
        await errorMessage(msg, 'Failed to connect to PiHole')
      }
    }

    const getStats = async () => {
      try {
        const response = await get(urljoin(host, '/admin/api.php')).headers({
          accept: 'application/json'
        })
        const data = await response.body

        return {
          status: data.status,
          domainsBeingBlocked: data.domains_being_blocked,
          totalQueries: data.dns_queries_all_types,
          queriesToday: data.dns_queries_today,
          adsBlockedToday: data.ads_blocked_today,
          clientsSeen: data.clients_ever_seen,
          clientsUnique: data.unique_clients,
          forwarded: data.queries_forwarded,
          cached: data.queries_cached,
          blockedPercentage: data.ads_percentage_today
        }
      } catch (e) {
        Log.error('PiHole', 'Failed to connect to PiHole', e)
        await errorMessage(msg, 'Failed to connect to PiHole')
      }
    }

    // * ------------------ Usage Logic --------------------

    switch (args[0]) {
      case 'enable':
      case 'disable':
        return setState(args[0])

      case 'stats': {
        const status = await getStats()
        if (status && typeof status !== 'string') {
          return channel.send(
            embed(msg, this.color, 'pi.png')
              .setTitle('PiHole Stats')
              .addField('Status', capitalize(status.status), true)
              .addField('URL\'s Being Blocked', status.domainsBeingBlocked, true)
              .addField('Total Queries', status.totalQueries, true)
              .addField('Queries Today', status.queriesToday, true)
              .addField('Blocked Today', status.adsBlockedToday, true)
              .addField('Queries Today', status.queriesToday, true)
              .addField('Forwarded', status.forwarded, true)
              .addField('Cached', status.cached, true)
              .addField('Percentage', Math.round(status.blockedPercentage), true)
          )
        }
        return
      }
    }
    return validOptions(msg, ['enable', 'disable', 'stats'])
  }
}
