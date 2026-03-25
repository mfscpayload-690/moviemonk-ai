declare module 'react-window' {
  import * as React from 'react';

  export interface ListChildComponentProps {
    index: number;
    style: React.CSSProperties;
  }

  export interface ListProps<ItemType = any> {
    height: number;
    itemCount: number;
    itemSize: number;
    width: number | string;
    overscanCount?: number;
    itemData?: ItemType[];
    children: React.ComponentType<ListChildComponentProps>;
  }

  export class List<ItemType = any> extends React.Component<ListProps<ItemType>> {}
}
