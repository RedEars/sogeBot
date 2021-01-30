<template>
  <v-container ref="quotesRef" style='min-height: 100vh'>
    <h2>{{ translate('menu.quotes') }}</h2>

    <v-text-field
      v-model="search"
      append-icon="mdi-magnify"
      label="Search"
      single-line
      hide-details
    ></v-text-field>

    <v-data-table
      :loading="state.loading !== $state.success"
      :headers="headers"
      :search="search"
      :items="items"
    >
      <template v-slot:[`item.createdAt`]="{ item }">
        {{ dayjs(item.createdAt).format('LL')}} {{ dayjs(item.createdAt).format('LTS') }}
      </template>
      <template v-slot:[`item.tags`]="{ item }">
        <v-chip v-for="tag of item.tags" v-bind:key="tag" small color="orange" class="ma-1">{{ tag }}</v-chip>
      </template>
    </v-data-table>
  </v-container>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from '@vue/composition-api'
import VueScrollTo from 'vue-scrollto';

import { getSocket } from 'src/panel/helpers/socket';
import { QuotesInterface } from 'src/bot/database/entity/quotes';
import { dayjs } from 'src/bot/helpers/dayjs';
import translate from 'src/panel/helpers/translate';
import { ButtonStates } from 'src/panel/helpers/buttonStates';


const socket = getSocket('/systems/quotes', true);
export default defineComponent({
  components: {
    loading: () => import('src/panel/components/loading.vue'),
  },
  setup(props, ctx) {
    const items = ref([] as QuotesInterface[]);
    const quotesRef = ref(null as Element | null);
    const search = ref('');

    const state = ref({
      loading: ButtonStates.progress,
    } as {
      loading: number;
    })

    const headers = [
      { value: 'createdAt', text: translate('systems.quotes.date.name') },
      { value: 'quote', text: translate('systems.quotes.quote.name') },
      { value: 'tags', text: translate('systems.quotes.tags.name') },
      { value: 'quotedByName', text: translate('systems.quotes.by.name') },
    ]

    const moveTo = () => {
      VueScrollTo.scrollTo(quotesRef.value as Element, 500, {
        container: 'body',
        force: true,
        onDone: function() {
          const scrollPos = window.scrollY || document.getElementsByTagName("html")[0].scrollTop;
          if (scrollPos === 0) {
            setTimeout(() => moveTo(), 100);
          }
        }
      })
    }

    onMounted(() => {
      state.value.loading = ButtonStates.progress;
      socket.emit('quotes:getAll', {}, (err: string | null, itemsGetAll: QuotesInterface[]) => {
        console.debug('Loaded', {items})
        items.value = itemsGetAll
        state.value.loading = ButtonStates.success;
      })
      ctx.root.$nextTick(() => {
        moveTo();
      });
    })

    return {
      dayjs,
      search,
      headers,
      items,
      state,
      translate,
      quotesRef,
    }
  }
});
</script>