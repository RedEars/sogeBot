'use strict';

// bot libraries
import * as http from 'http';

import { command, default_permission } from '../decorators';
import { error } from '../helpers/log';
import { ioServer } from '../helpers/panel';
import { ParameterError } from '../helpers/parameterError';
import { defaultPermissions } from '../helpers/permissions/';
import System from './_interface';

class Cams extends System {
  isLoaded: string[] = [];
  availableCams = ['1', '2'];
  mainCameraIp = '192.168.178.34';

  @command('!cam')
  @default_permission(defaultPermissions.VIEWERS)
  async cam(opts: CommandOptions): Promise<CommandResponse[]> {
    try {
      const cam = opts.parameters;
      if (!cam || !this.availableCams.includes(cam)) {
        return [
          {
            response:
              'Invalid cam specified. Please use !cam 1 or !cam 2 to switch between the cams.',
            ...opts,
          },
        ];
      }

      if (cam === '1') {
        this.setZoom(0);
        this.mainCameraIp = '192.168.178.34';
        ioServer?.emit('cam:main', {
          ip:      '192.168.178.34',
          camName: '!CAM 1',
        });
        ioServer?.emit('cam:small', {
          ip:      '192.168.178.32',
          camName: '!CAM 2',
        });
      }

      if (cam === '2') {
        this.setZoom(0);
        this.mainCameraIp = '192.168.178.32';
        ioServer?.emit('cam:main', {
          ip:      '192.168.178.32',
          camName: '!CAM 2',
        });
        ioServer?.emit('cam:small', {
          ip:      '192.168.178.34',
          camName: '!CAM 1',
        });
      }

      return [];
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

  @command('!zoom')
  @default_permission(defaultPermissions.VIEWERS)
  async zoom(opts: CommandOptions): Promise<CommandResponse[]> {
    try {
      const param = opts.parameters;
      if (!param) {
        return [
          {
            response: 'Error: No zoom level specified (0-4)',
            ...opts,
          },
        ];
      }

      const zoomLevel = parseInt(param);
      if (zoomLevel < 0 || zoomLevel > 4) {
        return [
          {
            response: 'Error: Invalid zoom level specified (0-4)',
            ...opts,
          },
        ];
      }

      this.setZoom(zoomLevel);
      return [];
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

  setZoom(zoomLevel: number) {
    const options = {
      host:    this.mainCameraIp,
      port:    8080,
      path:    `/ptz?zoom=${zoomLevel}`,
      headers: { Accept: 'application/json' },
    };
    http
      .get(options, resp => {
        let data = '';

        resp.on('data', chunk => {
          data += chunk;
        });

        resp.on('end', () => {
          console.log(data);
        });
      })
      .on('error', err => {
        console.log('Error: ' + err.message);
      });
  }
}

export default new Cams();
