/*!
 * Coded by CallMeKory - https://github.com/callmekory
 * 'It’s not a bug – it’s an undocumented feature.'
 */
import { NezukoMessage } from 'typings'
import { get } from 'unirest'

import { Command } from '../../core/base/Command'
import { BotClient } from '../../core/BotClient'

export default class SystemIP extends Command {
  constructor(client: BotClient) {
    super(client, {
      name: 'ip',
      category: 'Bot Utils',
      description: 'Get the server IP',
      usage: [`ip <external/local>`],
      ownerOnly: true,
      args: false,
      webUI: true
    })
  }

  public async run(
    client: BotClient,
    msg: NezukoMessage,
    args: any[],
    api: boolean
  ) {
    // * ------------------ Setup --------------------

    const { warningMessage } = client.Utils

    // * ------------------ Logic --------------------

    const response = await get('https://ifconfig.co/json').headers({
      accept: 'application/json'
    })

    interface IFConfig {
      ip: string
      ip_decimal: number
      country: string
      country_eu: boolean
      country_iso: string
      city: string
      hostname: string
      latitude: number
      longitude: number
      asn: string
      asn_org: string
    }

    const data = response.body as IFConfig
    if (api) return data.ip
    return warningMessage(msg, `[ ${data.ip} ]`)
  }
}
