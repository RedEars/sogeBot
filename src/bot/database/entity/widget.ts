import { EntitySchema } from 'typeorm';

import { ColumnNumericTransformer } from './_transformer';

export interface WidgetSocialInterface {
  id: string;
  type: string;
  hashtag: string;
  text: string;
  username: string;
  displayname: string;
  url: string;
  timestamp: number;
}

export const WidgetSocial = new EntitySchema<Readonly<Required<WidgetSocialInterface>>>({
  name:    'widget_social',
  columns: {
    id: {
      type:    String,
      primary: true,
    },
    type: {
      type: String,
    },
    hashtag: {
      type: String,
    },
    text: {
      type: 'text',
    },
    username: {
      type: String,
    },
    displayname: {
      type: String,
    },
    url: {
      type: String,
    },
    timestamp: {
      type:        'bigint',
      transformer: new ColumnNumericTransformer(),
      default:     0,
    },
  },
});