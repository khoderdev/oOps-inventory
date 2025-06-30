import { useCallback, useEffect, useRef, useState } from "react";

interface UseFloatingButtonVisibilityOptions {
  debounceDelay?: number;
  showOnTop?: boolean;
  minScrollDistance?: number;
}

interface FloatingButtonState {
  visible: boolean;
  isScrolling: boolean;
  scrollDirection: "up" | "down" | null;
  isAtTop: boolean;
  isAtBottom: boolean;
}

const useFloatingButtonVisibility = (options: UseFloatingButtonVisibilityOptions = {}): FloatingButtonState => {
  const { debounceDelay = 150, showOnTop = true, minScrollDistance = 100 } = options;

  const [state, setState] = useState<FloatingButtonState>({
    visible: showOnTop,
    isScrolling: false,
    scrollDirection: null,
    isAtTop: true,
    isAtBottom: false
  });

  const lastScrollY = useRef(0);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastDirection = useRef<"up" | "down" | null>(null);
  const scrollContainerRef = useRef<Element | Window | null>(null);
  const ticking = useRef(false);
  const visibleRef = useRef(showOnTop);
  const isAtTopRef = useRef(true);
  const isAtBottomRef = useRef(false);

  const clearTimeouts = useCallback(() => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    const getScrollContainer = () => {
      const mainElement = document.querySelector('main[class*="overflow-y-auto"]');
      return mainElement || window;
    };

    const getScrollPosition = (container: Element | Window) => {
      const isWindow = container === window || !("scrollTop" in container);
      if (isWindow) {
        return {
          scrollTop: window.scrollY,
          scrollHeight: document.documentElement.scrollHeight,
          clientHeight: window.innerHeight
        };
      }
      const el = container as Element;
      return {
        scrollTop: el.scrollTop,
        scrollHeight: el.scrollHeight,
        clientHeight: el.clientHeight
      };
    };

    // const handleScroll = () => {
    //   const container = scrollContainerRef.current;
    //   if (!container) return;

    //   const { scrollTop: currentY, scrollHeight, clientHeight } = getScrollPosition(container);
    //   const diff = currentY - lastScrollY.current;

    //   if (Math.abs(diff) < 10) return; // <= place this here to suppress small flickery scroll events

    //   const direction = diff > 0 ? "down" : "up";
    //   const isAtTop = currentY <= 10;
    //   const isAtBottom = currentY + clientHeight >= scrollHeight - 10;
    //   const hasScrollableContent = scrollHeight > clientHeight + 20;

    //   let shouldShow = visibleRef.current;

    //   if (!hasScrollableContent) {
    //     shouldShow = showOnTop;
    //   } else if (isAtTop && showOnTop) {
    //     shouldShow = true;
    //   } else if (isAtBottom) {
    //     shouldShow = true;
    //   } else if (direction === "up" && currentY > minScrollDistance) {
    //     if (lastDirection.current !== direction || !visibleRef.current) {
    //       shouldShow = true;
    //     }
    //   } else if (direction === "down") {
    //     if (lastDirection.current !== direction || visibleRef.current) {
    //       shouldShow = false;
    //     }
    //   }

    //   setState(prev => ({
    //     ...prev,
    //     visible: shouldShow,
    //     scrollDirection: direction,
    //     isScrolling: true,
    //     isAtTop,
    //     isAtBottom
    //   }));

    //   visibleRef.current = shouldShow;

    //   lastDirection.current = direction;
    //   lastScrollY.current = currentY;

    //   clearTimeouts();
    //   scrollTimeoutRef.current = setTimeout(() => {
    //     setState(prev => ({ ...prev, isScrolling: false }));
    //   }, debounceDelay);
    // };
    const handleScroll = () => {
      const container = scrollContainerRef.current;
      if (!container) return;

      const { scrollTop: currentY, scrollHeight, clientHeight } = getScrollPosition(container);
      const diff = currentY - lastScrollY.current;

      // Ignore very small scrolls (less than 15 px), unless at top or bottom
      if (Math.abs(diff) < 15 && currentY > 10 && currentY + clientHeight < scrollHeight - 10) {
        return;
      }

      const direction = diff > 0 ? "down" : "up";

      const isAtTop = currentY <= 10;
      const isAtBottom = currentY + clientHeight >= scrollHeight - 10;
      const hasScrollableContent = scrollHeight > clientHeight + 20;

      let shouldShow = visibleRef.current;

      if (!hasScrollableContent) {
        // No scrollable content, show if configured
        shouldShow = showOnTop;
      } else if (isAtTop && showOnTop) {
        // Always show at top if configured
        shouldShow = true;
      } else if (isAtBottom) {
        // Always show at bottom
        shouldShow = true;
      } else if (direction === "up" && currentY > minScrollDistance) {
        // Show only when scrolling up past min distance
        shouldShow = true;
      } else if (direction === "down") {
        // Hide always when scrolling down
        shouldShow = false;
      }

      // Prevent flickering by only updating state if something really changed
      const isVisibilityChanged = shouldShow !== visibleRef.current;
      const isDirectionChanged = direction !== lastDirection.current;

      if (isVisibilityChanged || isDirectionChanged || isAtTop !== isAtTopRef.current || isAtBottom !== isAtBottomRef.current) {
        setState(prev => ({
          ...prev,
          visible: shouldShow,
          scrollDirection: direction,
          isScrolling: true,
          isAtTop,
          isAtBottom
        }));
      }

      visibleRef.current = shouldShow;
      isAtTopRef.current = isAtTop;
      isAtBottomRef.current = isAtBottom;
      lastDirection.current = direction;
      lastScrollY.current = currentY;

      clearTimeouts();
      scrollTimeoutRef.current = setTimeout(() => {
        setState(prev => ({ ...prev, isScrolling: false }));
      }, debounceDelay);
    };

    const handleScrollEvent = () => {
      if (!ticking.current) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking.current = false;
        });
        ticking.current = true;
      }
    };

    const container = getScrollContainer();
    scrollContainerRef.current = container;

    const { scrollTop: currentY, scrollHeight, clientHeight } = getScrollPosition(container);
    const isAtTop = currentY <= 10;
    const isAtBottom = currentY + clientHeight >= scrollHeight - 10;

    const initialVisible = showOnTop ? isAtTop || !scrollHeight : visibleRef.current;
    setState(prev => ({
      ...prev,
      isAtTop,
      isAtBottom,
      visible: initialVisible
    }));

    visibleRef.current = initialVisible;
    isAtTopRef.current = isAtTop;
    isAtBottomRef.current = isAtBottom;

    lastScrollY.current = currentY;

    const isWindow = !("scrollTop" in container);
    if (isWindow) {
      window.addEventListener("scroll", handleScrollEvent, { passive: true });
    } else {
      (container as Element).addEventListener("scroll", handleScrollEvent, { passive: true });
    }

    return () => {
      clearTimeouts();
      if (isWindow) {
        window.removeEventListener("scroll", handleScrollEvent);
      } else {
        (container as Element).removeEventListener("scroll", handleScrollEvent);
      }
    };
  }, [debounceDelay, minScrollDistance, showOnTop, clearTimeouts]);

  useEffect(() => () => clearTimeouts(), [clearTimeouts]);

  return state;
};

export default useFloatingButtonVisibility;
