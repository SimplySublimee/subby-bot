/*!
 * Coded by CallMeKory - https://github.com/callmekory
 * 'It’s not a bug – it’s an undocumented feature.'
 */
import { GeneralDBConfig, NezukoMessage } from 'typings'
import { YoutubeDataAPI } from 'youtube-v3-api'

import { Command } from '../../core/base/Command'
import { BotClient } from '../../core/BotClient'
import { database } from '../../core/database/database'
import { Utils } from '../../core/Utils'

/**
 * Command to search for Youtube videos
 */
export default class YoutubeSearch extends Command {
  public color: string

  constructor(client: BotClient) {
    super(client, {
      args: true,
      category: 'Media',
      description: 'Search Youtube videos',
      name: 'yt',
      usage: ['yt [video to search for]']
    })
    this.color = '#FF3333'
  }

  public async run(client: BotClient, msg: NezukoMessage, args: any[]) {
    // * ------------------ Setup --------------------
    const { p } = client
    const { paginate, embed, missingConfig } = Utils
    // * ------------------ Config --------------------

    const db = await database.models.Configs.findOne({ where: { id: client.config.ownerID } })
    const config = JSON.parse(db.get('config') as string) as GeneralDBConfig
    const { apiKey } = config.google
    const yt = new YoutubeDataAPI(apiKey)

    // * ------------------ Check Config --------------------

    if (!apiKey) {
      const settings = [`${p}config set google apiKey <key>`]
      return missingConfig(msg, 'google', settings)
    }

    // * ------------------ Logic --------------------
    const fetchVideos = async (searchTerm) => {
      const data = (await yt.searchAll(searchTerm, 25)) as any[]
      const results = []

      for (const i of data) {
        const { description, channelTitle, thumbnails } = i.snippet
        const { videoId } = i.id
        const { publishedAt, title } = i.snippet
        const thumbnail = thumbnails.high.url
        results.push(
          embed(msg, this.color, 'youtube.png')
            .setTitle(`YT - ${title}`)
            .setURL(`https://youtube.com/watch?v=${videoId})`)
            .addField('Channel', channelTitle, true)
            .addField('Published', publishedAt.toString().substring(0, 10), true)
            .addField('Description', description || 'No Description..')
            .setImage(thumbnail)
        )
      }
      return paginate(msg, results)
    }
    // * ------------------ Usage Logic --------------------
    return fetchVideos(args.join(' '))
  }
}
