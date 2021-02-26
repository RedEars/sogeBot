'use strict';

// bot libraries
import googleTranslateApi, {
  IOptions,
  ITranslateResponse,
  languages,
} from '@vitalets/google-translate-api';
import * as _ from 'lodash';

import { command, default_permission } from '../decorators';
import { error } from '../helpers/log';
import { ParameterError } from '../helpers/parameterError';
import { defaultPermissions } from '../helpers/permissions/';
import System from './_interface';

class Translate extends System {
  isLoaded: string[] = [];

  @command('!translate')
  @default_permission(defaultPermissions.VIEWERS)
  async translate(opts: CommandOptions): Promise<CommandResponse[]> {
    try {
      const to = opts.parameters.match(/-to ([a-zA-Z0-9_]+)/);
      const from = opts.parameters.match(/-from ([a-zA-Z0-9_]+)/);
      const textToTranslate = opts.parameters.match(/-text ([a-zA-Z0-9_]+)/);

      const options: IOptions = {};
      if (!_.isNil(from)) {
        options.from = from[1];
      }
      if (!_.isNil(to)) {
        options.to = to[1];
      } else {
        options.to = 'en';
      }

      let text = '';
      if (_.isNil(textToTranslate)) {
        return [
          {
            response:
              'Error: No text to translate submitted. Usage: !translate -from [iso code] -to [iso code] -text [text]. Example: !translate -from es -to en -text Hola',
            ...opts,
          },
        ];
      } else {
        text = textToTranslate[1];
      }

      return googleTranslateApi(text, options)
        .then((res: ITranslateResponse) => {
          console.log(res);
          // Send message
          const destLanguage: any = languages;
          return [
            {
              response: `${text} (Language: ${
                destLanguage[res.from.language.iso]
              }) means: ${res.text}`,
              ...opts,
            },
          ];
        })
        .catch(err => {
          console.error(err);
          return [
            {
              response: `Could not translate: ${err.error.message}`,
              ...opts,
            },
          ];
        });
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
}

export default new Translate();
