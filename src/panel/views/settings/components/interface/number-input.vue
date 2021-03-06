<template>
  <div class="input-group">
    <div class="input-group-prepend">
      <span class="input-group-text">
        <template v-if="typeof translatedTitle === 'string'">{{ translatedTitle }}</template>
        <template v-else>
          {{ translatedTitle.title }}
          <small class="text-info pl-1" data-toggle="tooltip" data-html="true" :title="translatedTitle.help">[?]</small>
        </template>
      </span>
    </div>
    <input :min="min" :max="max" @focus="show = true" @blur="show = false" v-model.number="currentValue" :step="step || 1" type="number" class="form-control" :readonly="readonly" />
    <div class="input-group-append" v-if="defaultValue !== currentValue && !readonly">
      <b-button @click="currentValue = defaultValue">
        <fa icon="history" fixed-width/>
      </b-button>
    </div>
  </div>
</template>

<script lang="ts">
import {
  defineComponent, ref, watch, 
} from '@vue/composition-api';

import translate from 'src/panel/helpers/translate';

export default defineComponent({
  props: {
    value:        Number,
    defaultValue: Number,
    title:        String,
    readonly:     Boolean,
    min:          [Number, String],
    max:          [Number, String],
    step:         [Number, String],
  },
  setup(props: {
    defaultValue: number;
    value: number;
    min: number | string;
    max: number | string;
    step: number;
    title: string,
    readonly: boolean
  }, ctx) {
    const currentValue = ref(props.value);
    const translatedTitle = ref(translate(props.title));

    watch(currentValue, (val) => {
      let step = String(props.step || 0);

      if (step.includes('.')) {
        step = String(step.split('.')[1].length);
      }

      currentValue.value = Number(Number(currentValue.value).toFixed(Number(step)));
      if (typeof props.min !== 'undefined' && props.min > currentValue.value) {
        currentValue.value = Number(props.min);
      }
      if (typeof props.max !== 'undefined' && props.max < currentValue.value) {
        currentValue.value = Number(props.max);
      }

      ctx.emit('update', { value: val });
    });

    return { currentValue, translatedTitle };
  },
});
</script>