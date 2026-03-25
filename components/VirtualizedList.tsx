import React from 'react';
import { List } from 'react-window';

type VirtualizedListProps<T> = {
    items: T[];
    itemHeight: number;
    height: number;
    overscan?: number;
    renderItem: (item: T, index: number) => React.ReactNode;
};

export function VirtualizedList<T>({ items, itemHeight, height, overscan = 4, renderItem }: VirtualizedListProps<T>) {
    if (items.length === 0) return null;

    const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
        <div style={style}>{renderItem(items[index], index)}</div>
    );

    return (
        <List
            height={height}
            itemCount={items.length}
            itemSize={itemHeight}
            width="100%"
            overscanCount={overscan}
        >
            {Row}
        </List>
    );
}
