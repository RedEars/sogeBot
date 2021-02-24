'use strict';

// bot libraries
import * as http from 'http';

import { getRepository } from 'typeorm';

import { User, UserFeedInterface } from '../database/entity/user';
import { command, default_permission } from '../decorators';
import { error } from '../helpers/log';
import { ioServer } from '../helpers/panel';
import { ParameterError } from '../helpers/parameterError';
import { defaultPermissions } from '../helpers/permissions/';
import { translate } from '../translate';
import users from '../users.js';
import System from './_interface';

class Feeder extends System {
  isLoaded: string[] = [];

  @command('!feed')
  @default_permission(defaultPermissions.VIEWERS)
  async feed(opts: CommandOptions): Promise<CommandResponse[]> {
    try {
      await this.feedCat(100014999);
      await this.feedCat(100015000);
      const user = await users.getUserByUsername(opts.sender.username);
      console.log('username', opts.sender.username);
      console.log('user', user);
      const newFeed: UserFeedInterface = {
        amount:   Number(5),
        feededAt: new Date(),
      };
      user.feeds.push(newFeed);
      getRepository(User).save(user);
      return [
        {
          response: 'You have successfully fed us. Thank you! popCat',
          ...opts,
        },
      ];
    } catch (err) {
      if (!(err instanceof ParameterError)) {
        error(err.stack);
      }
      return [
        {
          response: 'There is currently a problem. Please try again later.',
          ...opts,
        },
      ];
    }
  }

  @command('!info')
  @default_permission(defaultPermissions.VIEWERS)
  async feedInfo(opts: CommandOptions): Promise<CommandResponse[]> {
    try {
      const feedData = await this.getDailyfeeds(100014999);
      console.log('fd', feedData);
      return [
        {
          response: 'We got ' + feedData.totalFedToday + 'g today! YEPPERS',
          ...opts,
        },
      ];
    } catch (err) {
      if (!(err instanceof ParameterError)) {
        error(err.stack);
      }
      return [
        {
          response: translate('points.failed.get').replace(
            '$command',
            opts.command,
          ),
          ...opts,
        },
      ];
    }
  }

  feedCat(catId: number) {
    return new Promise((resolve, reject) => {
      const currentDate = new Date();
      const day
        = currentDate.getFullYear()
        + ('0' + currentDate.getMonth() + 1).slice(-2)
        + ('0' + currentDate.getDate()).slice(-2);
      const options = {
        host:    'api.petkt.com',
        path:    `/latest/feedermini/save_dailyfeed?deviceId=${catId}&day=${day}&time=-1&amount=5`,
        headers: {
          Accept:            'application/json',
          'X-Session':       '25be7c1c56c04ab38d671de3b1d55073zi92dbyCuP6JJLuS4Eup',
          'F-Session':       '25be7c1c56c04ab38d671de3b1d55073zi92dbyCuP6JJLuS4Eup',
          'X-Timezone':      1.0,
          'X-Client':        'ios(14.0;iPhone12,3)',
          'Accept-Language': 'en-US;q=1, zh-Hans-US;q=0.9',
          'Content-Type':    'application/x-www-form-urlencoded',
          'User-Agent':      'PETKIT/7.18.1 (iPhone; iOS 14.0; Scale/3.00)',
          'X-TimezoneId':    'Europe/Berlin',
          'X-Locale':        'en_US',
        },
      };
      http
        .get(options, resp => {
          let data = '';

          // A chunk of data has been received.
          resp.on('data', chunk => {
            data += chunk;
          });

          // The whole response has been received. Print out the result.
          resp.on('end', async () => {
            const json = JSON.parse(data);
            console.log(json);
            if (json) {
              this.getDailyfeeds(catId);
            }
            resolve(json);
          });
        })
        .on('error', err => {
          console.log('Error: ' + err.message);
          reject(err);
        });
    });
  }

  getDailyfeeds(catId: number): Promise<any> {
    return new Promise((resolve, reject) => {
      const currentDate = new Date();
      const day
        = currentDate.getFullYear()
        + ('0' + (currentDate.getMonth() + 1)).slice(-2)
        + ('0' + currentDate.getDate()).slice(-2);
      const options = {
        host:    'api.petkt.com',
        path:    `/latest/feedermini/dailyfeeds?deviceId=${catId}&days=${day}`,
        headers: {
          'X-Session':       '25be7c1c56c04ab38d671de3b1d55073zi92dbyCuP6JJLuS4Eup',
          'F-Session':       '25be7c1c56c04ab38d671de3b1d55073zi92dbyCuP6JJLuS4Eup',
          'X-Timezone':      1.0,
          'X-Client':        'ios(14.0;iPhone12,3)',
          'Accept-Language': 'en-US;q=1, zh-Hans-US;q=0.9',
          'Content-Type':    'application/x-www-form-urlencoded',
          'User-Agent':      'PETKIT/7.18.1 (iPhone; iOS 14.0; Scale/3.00)',
          'X-TimezoneId':    'Europe/Berlin',
          'X-Locale':        'en_US',
        },
      };
      http
        .get(options, resp => {
          let data = '';
          // A chunk of data has been received.
          resp.on('data', chunk => {
            data += chunk;
          });

          // The whole response has been received. Print out the result.
          resp.on('end', () => {
            const json = JSON.parse(data);
            console.log(json);
            let dailyFeeds = [];
            let totalFedToday = 0;
            if (json && json.result && json.result.length) {
              dailyFeeds = json.result[0].items;
              totalFedToday = json.result[0].realAmount;
            }

            console.log('socket yes');
            ioServer?.emit('feeder:foodAmount', { amount: totalFedToday });
            if (dailyFeeds.length) {
              /*
              console.log("daily feed", dailyFeeds[dailyFeeds.length - 1]);
              ioServer?.emit("lastFeed", {
                date: dailyFeeds[dailyFeeds.length - 1].state.completedAt,
              });
              */
            }

            resolve({ totalFedToday: totalFedToday });
          });
        })
        .on('error', err => {
          console.log('Error: ' + err.message);
          reject(err);
        });
    });
  }
}

export default new Feeder();
