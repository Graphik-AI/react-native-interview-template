jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('@shopify/flash-list', () => {
  const React = require('react');
  const { ScrollView, View } = require('react-native');

  function useLayoutState(initialState) {
    return React.useState(initialState);
  }

  function useRecyclingState(initialState, deps, onReset) {
    const valueStore = React.useRef();
    const [, setCounter] = React.useState(0);

    React.useMemo(() => {
      valueStore.current =
        typeof initialState === 'function' ? initialState() : initialState;
      if (onReset) {
        onReset();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);

    const setState = React.useCallback((nextValue) => {
      const resolved =
        typeof nextValue === 'function'
          ? nextValue(valueStore.current)
          : nextValue;
      if (resolved !== valueStore.current) {
        valueStore.current = resolved;
        setCounter((prev) => prev + 1);
      }
    }, []);

    return [valueStore.current, setState];
  }

  const FlashList = React.forwardRef(function MockFlashList(props, ref) {
    const {
      data = [],
      renderItem,
      extraData,
      ListEmptyComponent,
      ListHeaderComponent,
      ListFooterComponent,
      ItemSeparatorComponent,
      contentContainerStyle,
      style,
      testID,
      ...rest
    } = props;

    React.useImperativeHandle(ref, () => ({
      scrollToIndex: jest.fn(),
      scrollToOffset: jest.fn(),
      scrollToEnd: jest.fn(),
    }));

    const renderSlot = (Component) => {
      if (!Component) return null;
      return React.isValidElement(Component)
        ? Component
        : React.createElement(Component);
    };

    const items = Array.isArray(data) ? data : [];

    return React.createElement(
      ScrollView,
      { testID, style, contentContainerStyle, ...rest },
      renderSlot(ListHeaderComponent),
      items.length === 0
        ? renderSlot(ListEmptyComponent)
        : items.map((item, index) =>
            React.createElement(
              View,
              { key: `cell-${index}` },
              renderItem
                ? renderItem({ item, index, target: 'Cell', extraData })
                : null,
              ItemSeparatorComponent && index < items.length - 1
                ? React.createElement(ItemSeparatorComponent)
                : null,
            ),
          ),
      renderSlot(ListFooterComponent),
    );
  });

  return {
    FlashList,
    useLayoutState,
    useRecyclingState,
  };
});
