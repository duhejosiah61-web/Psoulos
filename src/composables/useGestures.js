export function useGestures() {
  /**
   * 触发触觉反馈 (Haptic Engine)
   * @param {string} type 'light' | 'medium' | 'heavy'
   */
  const triggerVibration = (type = 'light') => {
    if (!navigator.vibrate) return;
    try {
      switch (type) {
        case 'light':
          navigator.vibrate(15);
          break;
        case 'medium':
          navigator.vibrate(30);
          break;
        case 'heavy':
          // 双重震动，模拟强反馈或错误
          navigator.vibrate([50, 40, 50]);
          break;
        default:
          navigator.vibrate(15);
      }
    } catch (e) {
      // 某些浏览器可能由于无交互而阻止震动，忽略即可
    }
  };

  /**
   * 为指定的 DOM 元素挂载“屏幕左侧边缘向右滑动”事件 (侧滑返回)
   * @param {HTMLElement} element 要监听的容器（通常是全屏 div）
   * @param {Function} onSwipeBack 触发滑动返回时的回调函数
   * @param {Object} options 配置项 (threshold: 触发距离, edgeWidth: 边缘判定宽度)
   */
  const setupSwipeBack = (element, onSwipeBack, options = {}) => {
    if (!element) return;
    
    const threshold = options.threshold || 70; // 必须滑动的最小 X 轴距离 (px)
    const edgeWidth = options.edgeWidth || 35; // 只有在距离屏幕左侧 edgeWidth px 以内的触摸才算边缘滑动
    
    let startX = 0;
    let startY = 0;
    let isEdgeSwipe = false;
    let hasTriggered = false;

    const onTouchStart = (e) => {
      if (!e.touches || e.touches.length === 0) return;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      hasTriggered = false;
      
      // 只有起始点在左侧边缘区域，才判定为潜在的侧滑返回
      if (startX <= edgeWidth) {
        isEdgeSwipe = true;
      } else {
        isEdgeSwipe = false;
      }
    };

    const onTouchMove = (e) => {
      if (!isEdgeSwipe || hasTriggered) return;
      if (!e.touches || e.touches.length === 0) return;

      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      
      const deltaX = currentX - startX;
      const deltaY = Math.abs(currentY - startY);

      // 如果纵向滑动幅度过大，取消侧滑判定
      if (deltaY > 40) {
        isEdgeSwipe = false;
        return;
      }

      // 如果向右滑动超过阈值，且还未触发过
      if (deltaX >= threshold && !hasTriggered) {
        hasTriggered = true;
        isEdgeSwipe = false; // 触发后立即取消本次手势的后续检测
        triggerVibration('medium'); // 边缘触发反馈
        if (typeof onSwipeBack === 'function') {
          onSwipeBack();
        }
      }
    };

    const onTouchEnd = (e) => {
      isEdgeSwipe = false;
    };

    element.addEventListener('touchstart', onTouchStart, { passive: true });
    element.addEventListener('touchmove', onTouchMove, { passive: true });
    element.addEventListener('touchend', onTouchEnd, { passive: true });
    element.addEventListener('touchcancel', onTouchEnd, { passive: true });

    // 暴露注销方法
    return () => {
      element.removeEventListener('touchstart', onTouchStart);
      element.removeEventListener('touchmove', onTouchMove);
      element.removeEventListener('touchend', onTouchEnd);
      element.removeEventListener('touchcancel', onTouchEnd);
    };
  };

  return {
    triggerVibration,
    setupSwipeBack
  };
}
