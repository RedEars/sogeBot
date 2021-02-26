import { Aki } from 'aki-api';

import { command, settings } from '../decorators';
import Game from './_interface';

/*
 * !akinator - let akinator guess your person
 */

class Akinator extends Game {
  availableRegions = [
    'en',
    'en_objects',
    'en_animals',
    'ar',
    'cn',
    'de',
    'de_animals',
    'es',
    'es_animals',
    'fr',
    'fr_objects',
    'fr_animals',
    'il',
    'it',
    'it_animals',
    'jp',
    'jp_animals',
    'kr',
    'nl',
    'pl',
    'pt',
    'ru',
    'tr',
    'id',
  ];
  akiUsers: any = [];

  @settings()
  defaultRegion = 'en';

  @command('!akinator info')
  async info(opts: CommandOptions) {
    return [
      {
        response: 'Akinator info',
        ...opts,
      },
    ];
  }

  @command('!akinator')
  async main(opts: CommandOptions) {
    let region = this.defaultRegion;
    if (opts.parameters && opts.parameters !== 'info') {
      region = opts.parameters;
    }

    if (opts.parameters && !this.availableRegions.includes(opts.parameters)) {
      return [
        {
          response: 'Invalid region specified',
          ...opts,
        },
      ];
    }

    const akiUser = {
      user: opts.sender.userId,
      aki:  new Aki(region, false),
    };
    console.log('start game', akiUser);
    const res = this.startGame(akiUser, true);
    console.log('res', res);
    return [
      {
        response: res,
        ...opts,
      },
    ];
  }

  async startGame(akiObj: any, replace = false) {
    const index = this.akiUsers.findIndex((obj: any) => {
      return obj.user === akiObj.user;
    });
    if (index === -1) {
      await akiObj.aki.start();
      this.akiUsers.push(akiObj);
    } else {
      if (!replace) {
        this.akiUsers[index] = akiObj;
      } else {
        this.akiUsers.splice(index, 1);
        await akiObj.aki.start();
        this.akiUsers.push(akiObj);
      }
    }
    let emote = '';
    if (akiObj.aki.progress < 10) {
      emote = 'FDMThink';
    } else if (akiObj.aki.progress < 20) {
      emote = 'monkaHmm';
    } else if (akiObj.aki.progress < 35) {
      emote = 'Hmmm';
    } else if (akiObj.aki.progress < 50) {
      emote = 'monkaThink';
    } else if (akiObj.aki.progress < 70) {
      emote = 'peepoHolmes';
    } else if (akiObj.aki.progress >= 70) {
      emote = 'weSmart';
    }
    let say = `${emote} ${akiObj.aki.question}.`;
    say
      = say
      + ` [Answer with: 1 (${akiObj.aki.answers[0]}), 2 (${akiObj.aki.answers[1]}), 3 (${akiObj.aki.answers[2]}), 4 (${akiObj.aki.answers[3]}), 5 (${akiObj.aki.answers[4]})]`;

    return say;
  }

  @command('1')
  async answerOne(opts: CommandOptions) {
    console.log('answer one');
    const res = this.answerAki(opts.sender.userId, 0);
    return [
      {
        response: res,
        ...opts,
      },
    ];
  }

  @command('2')
  async answerTwo(opts: CommandOptions) {
    const res = this.answerAki(opts.sender.userId, 0);
    return [
      {
        response: res,
        ...opts,
      },
    ];
  }

  async answerAki(user: any, answer: any) {
    const index = this.akiUsers.findIndex((obj: any) => {
      return obj.user === user;
    });
    if (index === -1) {
      return;
    }

    await this.akiUsers[index].aki.step(answer);
    // akiUsers[index].aki = akiUsers[index].aki;
    console.log('progress:', this.akiUsers[index].aki.progress);

    if (this.akiUsers[index].aki.progress >= 80) {
      const prevAnswers = [...this.akiUsers[index].aki.answers];
      const akiRes = { ...this.akiUsers[index] };
      const win = akiRes.aki;
      await win.win();
      // console.log("firstGuess:", win.answers);
      // console.log("guessCount:", win.guessCount);

      this.akiUsers[index].aki.answers = prevAnswers;

      return `Tu personaje es ${win.answers[0].name} (${win.answers[0].description})? PepeWink Responde !si o !no`;
    }

    let emote = '';
    if (this.akiUsers[index].aki.progress < 10) {
      emote = 'FDMThink';
    } else if (this.akiUsers[index].aki.progress < 20) {
      emote = 'monkaHmm';
    } else if (this.akiUsers[index].aki.progress < 35) {
      emote = 'Hmmm';
    } else if (this.akiUsers[index].aki.progress < 50) {
      emote = 'monkaThink';
    } else if (this.akiUsers[index].aki.progress < 70) {
      emote = 'peepoHolmes';
    } else if (this.akiUsers[index].aki.progress >= 70) {
      emote = 'weSmart';
    }
    let say = `${emote} ${this.akiUsers[index].aki.question}.`;
    if (this.akiUsers[index].aki.currentStep < 6) {
      say
        = say
        + ` [Responde: 1 (${this.akiUsers[index].aki.answers[0]}), 2 (${this.akiUsers[index].aki.answers[1]}), 3 (${this.akiUsers[index].aki.answers[2]}), 4 (${this.akiUsers[index].aki.answers[3]}), 5 (${this.akiUsers[index].aki.answers[4]})]`;
    } else if (this.akiUsers[index].aki.currentStep === 6) {
    }
    return say;
  }
}

export default new Akinator();
