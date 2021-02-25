<template lang="pug">
  div(style="overflow:hidden").widget.p-1
    b-card(no-body).border-0.h-100
          div(v-if="!popout").card-header
            div(v-if="typeof nodrag === 'undefined'").grip.text-secondary
              fa(icon="grip-vertical" fixed-width)
            div
              b-dropdown(ref="dropdown" boundary="window" no-caret :text="translate('widget-title-soundboard')" variant="outline-primary" toggle-class="border-0")
                b-dropdown-form
                  input(type="range" step="1" v-model.number="volume").w-100
                template(v-if="!popout")
                  b-dropdown-divider
                  b-dropdown-item
                    a(href="#" @click.prevent="$refs.dropdown.hide(); $nextTick(() => EventBus.$emit('remove-widget', 'soundboard'))" class="text-danger"
                      v-html="translate('remove-widget').replace('$name', translate('widget-title-soundboard'))")
            div.pr-3
              fa(icon="music" fixed-width).text-secondary
          b-card-text.pt-3
            b-container
              b-row(no-gutters)
                b-col(cols="4" v-for="sound of sounds" :key="sound").px-1.pt-0.pb-1
                  button(
                    style="overflow: hidden;"
                    class="btn btn-outline-secondary border-0 soundboard-list-group-item btn-block"
                    v-on:click="play(sound)" type="button"
                  ) {{sound}}
</template>

<script>
import { isNil } from 'lodash-es';

import { EventBus } from 'src/panel/helpers/event-bus';
import { getSocket } from 'src/panel/helpers/socket';
import translate from 'src/panel/helpers/translate';

export default {
  props: ['popout', 'nodrag'],
  data:  function () {
    return {
      translate,
      EventBus,
      socket: getSocket('/widgets/soundboard'),
      volume: 50,
      audio:  null,
      sounds: [],
    };
  },
  watch: {
    volume: function (val) {
      localStorage.setItem('/widget/soundboard/volume', JSON.stringify(val));
    },
  },
  created: function () {
    this.socket.emit('getSoundBoardSounds', (err, sounds) => {
      if (err) {
        return console.error(err);
      }
      this.sounds = sounds;
    });
    if (localStorage.getItem('/widget/soundboard/volume')) {
      this.volume = JSON.parse(localStorage.getItem('/widget/soundboard/volume'));
    }
  },
  methods: {
    setVolume: function (ev) {
      // steps by 5
      const path = ev.path || (ev.composedPath && ev.composedPath());
      this.volume = Math.round(Number(ev.offsetX / path[0].clientWidth * 100).toFixed(0) / 5) * 5;
    },
    play: function (sound) {
      if (!isNil(this.audio)) {
        this.audio.pause();
      }
      this.audio = new Audio('dist/soundboard/' + sound + '.mp3');
      this.audio.addEventListener('loadedmetadata', () => {
        this.audio.volume = this.volume / 100;
        this.audio.play();
      });
    },
  },
};
</script>
