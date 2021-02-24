'use strict';

// bot libraries
import Color = require('color');

import { command, default_permission } from '../decorators';
import { error } from '../helpers/log';
import { ParameterError } from '../helpers/parameterError';
import { defaultPermissions } from '../helpers/permissions/';
import { translate } from '../translate';
import System from './_interface';

class MagicHue extends System {
  isLoaded: string[] = [];
  rgbColor: any;

  @command('!color')
  @default_permission(defaultPermissions.VIEWERS)
  async feed(opts: CommandOptions): Promise<CommandResponse[]> {
    try {
      let color = opts.parameters;
      color = color.replace(/ /g, '');
      if (!color) {
        // this.getColorFromDevice();
        return [
          {
            response: translate('color.failed.set').replace(
              '$command',
              opts.command,
            ),
            ...opts,
          },
        ];
      }
      if (color === 'flash') {
        this.sendLightPreset(56, 100, 6000);
        return [];
      }
      console.log('set color', color);
      this.setLightColor(Color(color));
      return [];
    } catch (err) {
      if (!(err instanceof ParameterError)) {
        error(err.stack);
      }
      return [
        {
          response: translate('color.failed.set').replace(
            '$command',
            opts.command,
          ),
          ...opts,
        },
      ];
    }
  }

  getLightState() {
    return this.sendLightCommand('-i').then((res: any) => {
      const settings = {
        on:    false,
        color: Color.hsv([0, 0, 100]),
      };

      const colors = res.match(/\(\d{1,3}\, \d{1,3}, \d{1,3}\)/g);
      const isOn = res.match(/\] ON /g);

      if (isOn && isOn.length > 0) {
        settings.on = true;
      }
      if (colors && colors.length > 0) {
        settings.color = Color('rgb' + colors);
      }
      return settings;
    });
  }

  getColorFromDevice() {
    this.getLightState().then((res: any) => {
      this.rgbColor = res.color;
      console.log(
        'DEVICE COLOR - (H,S,V): %s  (R,G,B): %s',
        Math.round(res.color.hue())
          + ','
          + Math.round(res.color.saturationv())
          + ','
          + Math.round(res.color.value()),
        res.color
          .rgb()
          .round()
          .array(),
      );
    });
  }

  setLightBrightness(value: number) {
    this.rgbColor = Color(this.rgbColor).value(value);
    this.setLightToCurrentColor();
  }

  setLightToCurrentColor() {
    console.log('set light to current color');
    const color = this.rgbColor;
    const base
      = '-x RGBW -c '
      + color
        .rgb()
        .round()
        .array();
    this.sendLightCommand(base);
  }

  sendLightCommand(execCommand: string) {
    const exec = require('child_process').exec;
    const cmd
      = '../../../tools/flux_led.py 192.168.178.25 ' + execCommand + ' -v';
    return exec(cmd);
  }

  sendLightPreset(preset: number, speed: number, time: number) {
    console.log('send preset');
    const base = '-p ' + preset + ' ' + speed;
    this.sendLightCommand(base);

    if (time) {
      setTimeout(() => {
        this.setLightToCurrentColor();
      }, time);
    }
  }

  setLightColor(color = Color.hsv([0, 0, 100])) {
    const exec = require('child_process').exec;
    const execCommand
      = '-x RGBW -c '
      + color
        .rgb()
        .round()
        .array();
    this.rgbColor = color;
    const cmd
      = '../../../tools/flux_led.py 192.168.178.25 ' + execCommand + ' -v';
    console.log('cmd', cmd);
    return exec(cmd);
  }
}

export default new MagicHue();
