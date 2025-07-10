import React from 'react';
import { useResponsive } from '../../hooks/useWindowSize';
import './WindowStatus.less';

interface WindowStatusProps {
  visible?: boolean;
}

const WindowStatus: React.FC<WindowStatusProps> = ({ visible = false }) => {
  const { width, height, isMobile, isTablet, isDesktop, isSmallHeight, isVerySmallHeight } = useResponsive();

  if (!visible) return null;

  return (
    <div className="window-status">
      <div className="window-status-header">
        <span className="window-status-title">窗口状态</span>
        <span className="window-status-size">{width} × {height}</span>
      </div>
      
      <div className="window-status-badges">
        {isMobile && <span className="badge badge-mobile">移动设备</span>}
        {isTablet && <span className="badge badge-tablet">平板设备</span>}
        {isDesktop && <span className="badge badge-desktop">桌面设备</span>}
        {isSmallHeight && <span className="badge badge-small-height">小高度</span>}
        {isVerySmallHeight && <span className="badge badge-very-small-height">极小高度</span>}
      </div>
    </div>
  );
};

export default WindowStatus; 