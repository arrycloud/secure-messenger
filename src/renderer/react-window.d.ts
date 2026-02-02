declare module 'react-window' {
  import { ComponentType, CSSProperties, ReactNode } from 'react';

  export interface FixedSizeListProps {
    height: number | string;
    itemCount: number;
    itemSize: number;
    width: number | string;
    children: ComponentType<{
      index: number;
      style: CSSProperties;
      data?: any;
    }>;
    className?: string;
    direction?: 'ltr' | 'rtl' | 'vertical' | 'horizontal';
    initialScrollOffset?: number;
    innerElementType?: any;
    innerRef?: any;
    itemData?: any;
    itemKey?: (index: number, data: any) => any;
    onItemsRendered?: (props: {
      overscanStartIndex: number;
      overscanStopIndex: number;
      visibleStartIndex: number;
      visibleStopIndex: number;
    }) => void;
    onScroll?: (props: {
      scrollDirection: 'forward' | 'backward';
      scrollOffset: number;
      scrollUpdateWasRequested: boolean;
    }) => void;
    outerElementType?: any;
    outerRef?: any;
    overscanCount?: number;
    style?: CSSProperties;
    useIsScrolling?: boolean;
  }

  export class FixedSizeList extends React.Component<FixedSizeListProps> {}
}
