import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import { BarChart2, Key, ShoppingCart, Wallet, Settings, X, User, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useIsMobile } from '../../../hooks/useIsMobile';
import LoginModal from '../../../components/LoginModal';
import FloatingSupportButton from '../components/FloatingSupportButton';
import SidebarAgentSection from '../components/SidebarAgentSection';
import '../api-hub.css';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { path: '/hub/models', label: '模型市场', icon: <ShoppingCart size={18} strokeWidth={2} /> },
  { path: '/hub/logs', label: '账户总览', icon: <BarChart2 size={18} strokeWidth={2} /> },
  { path: '/hub/keys', label: 'API Keys', icon: <Key size={18} strokeWidth={2} /> },
  { path: '/hub/wallet', label: '充值', icon: <Wallet size={18} strokeWidth={2} /> },
];

const PAGE_TITLES: Record<string, string> = {
  '/hub/logs': '账户总览',
  '/hub/keys': 'API Keys',
  '/hub/models': '模型市场',
  '/hub/wallet': '充值',
};

const ApiHubLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { isLogin, isCheckingLoginStatus, userProfile, setLoginModalOpen, logout, requireAuth } = useAuth();

  const [showUserModal, setShowUserModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarHovered, setSidebarHovered] = useState(false);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => !prev);
  }, []);

  // Auto-show login modal when not logged in
  useEffect(() => {
    if (!isCheckingLoginStatus && !isLogin) {
      setLoginModalOpen(true);
    }
  }, [isCheckingLoginStatus, isLogin, setLoginModalOpen]);

  const currentTitle = useMemo(() => {
    for (const [path, title] of Object.entries(PAGE_TITLES)) {
      if (location.pathname.startsWith(path)) return title;
    }
    return '';
  }, [location.pathname]);

  const handleGoWorkspace = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const handleNavigate = useCallback(
    (path: string) => {
      if (!requireAuth()) return;
      navigate(path);
    },
    [navigate, requireAuth],
  );

  const handleLogout = useCallback(() => {
    setShowLogoutConfirm(false);
    setShowUserModal(false);
    logout();
  }, [logout]);

  // 判断 name 是否是真实用户名（而不是后端默认生成的"用户xxxx"、纯数字、或者和手机号相同的兜底值）
  const isRealName = !!(
    userProfile?.name &&
    !/^用户\d+$/.test(userProfile.name) &&
    !/^\d+$/.test(userProfile.name) &&
    userProfile.name !== userProfile.phone &&
    userProfile.name.length >= 2
  );
  const displayName = isRealName
    ? userProfile!.name
    : userProfile?.phone || '用户';
  const avatarLetter = isRealName ? userProfile!.name.charAt(0).toUpperCase() : '';
  const maskedPhone = userProfile?.phone
    ? userProfile.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
    : '';

  return (
    <div className={`api-hub-root${isMobile ? ' mobile' : ''}`} style={{ display: 'flex', minHeight: '100vh' }}>
      {/* 侧栏 - 桌面端 */}
      {!isMobile && (
        <aside
          className={`api-hub-sidebar${sidebarCollapsed ? ' collapsed' : ''}`}
          onMouseEnter={() => setSidebarHovered(true)}
          onMouseLeave={() => setSidebarHovered(false)}
        >
          <button
            type="button"
            className="api-hub-sidebar-logo"
            onClick={handleGoWorkspace}
            title="返回首页"
          >
            <div className="api-hub-sidebar-logo-icon">
              <span
                role="img"
                aria-label="Token Factory"
                style={{
                  display: 'inline-block',
                  width: 18,
                  height: 18,
                  backgroundColor: 'currentColor',
                  maskImage: 'url("/logo.svg")',
                  WebkitMaskImage: 'url("/logo.svg")',
                  maskSize: 'contain',
                  WebkitMaskSize: 'contain',
                  maskRepeat: 'no-repeat',
                  WebkitMaskRepeat: 'no-repeat',
                  maskPosition: 'center',
                  WebkitMaskPosition: 'center',
                }}
              />
            </div>
            {!sidebarCollapsed && <span className="api-hub-sidebar-logo-text">智能体词元(Token)工场</span>}
          </button>

          <nav className="api-hub-nav">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.path}
                type="button"
                className={`api-hub-nav-item${location.pathname.startsWith(item.path) ? ' active' : ''}`}
                onClick={() => handleNavigate(item.path)}
                data-tooltip={sidebarCollapsed ? item.label : undefined}
              >
                {item.icon}
                {!sidebarCollapsed && item.label}
              </button>
            ))}
          </nav>

          <SidebarAgentSection collapsed={sidebarCollapsed} />

          <div className="api-hub-sidebar-footer">
            {isLogin ? (
              <button
                type="button"
                className="api-hub-user-btn"
                onClick={() => setShowUserModal(true)}
                data-tooltip={sidebarCollapsed ? displayName : undefined}
              >
                <div className="api-hub-user-avatar-ring">
                  <div className="api-hub-user-avatar">
                    {isRealName ? (
                      avatarLetter
                    ) : (
                      <User size={16} strokeWidth={2.2} />
                    )}
                  </div>
                </div>
                {!sidebarCollapsed && (
                  <>
                    <div className="api-hub-user-info">
                      <span className="api-hub-user-name">{displayName}</span>
                      {isRealName && maskedPhone && (
                        <span className="api-hub-user-phone">{maskedPhone}</span>
                      )}
                    </div>
                    <Settings size={15} strokeWidth={1.8} className="api-hub-user-settings-icon" />
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                className="api-hub-user-btn"
                onClick={() => setLoginModalOpen(true)}
                data-tooltip={sidebarCollapsed ? '未登录' : undefined}
              >
                <div className="api-hub-user-avatar-ring" style={{ background: 'transparent' }}>
                  <div className="api-hub-user-avatar" style={{ background: '#E5E7EB' }}>
                    <User size={15} color="#9CA3AF" />
                  </div>
                </div>
                {!sidebarCollapsed && (
                  <div className="api-hub-user-info">
                    <span className="api-hub-user-name" style={{ color: '#9CA3AF' }}>未登录</span>
                    <span className="api-hub-user-phone" style={{ color: '#D1D5DB' }}>点击登录账号</span>
                  </div>
                )}
              </button>
            )}
          </div>
        </aside>
      )}

      {/* 收起/展开按钮 - 贴边半圆设计（桌面端） */}
      {!isMobile && (
        <button
          type="button"
          className={`api-hub-sidebar-toggle${sidebarCollapsed ? ' collapsed' : ''}${sidebarHovered || sidebarCollapsed ? ' visible' : ''}`}
          onClick={toggleSidebar}
          onMouseEnter={() => setSidebarHovered(true)}
          onMouseLeave={() => setSidebarHovered(false)}
          data-tooltip={sidebarCollapsed ? '展开菜单' : '收起菜单'}
          style={{ left: sidebarCollapsed ? 68 : 240 }}
        >
          <div className="api-hub-sidebar-toggle-inner">
            {sidebarCollapsed ? <ChevronsRight size={12} strokeWidth={2.5} /> : <ChevronsLeft size={12} strokeWidth={2.5} />}
          </div>
        </button>
      )}

      {/* 主内容区 */}
      <div className="api-hub-main">
        {!isMobile && (
          <header className="api-hub-header">
            <h1 className="api-hub-header-title">{currentTitle}</h1>
          </header>
        )}

        {isMobile && (
          <header className="api-hub-mobile-header">
            <button
              type="button"
              className="api-hub-mobile-header-logo"
              onClick={handleGoWorkspace}
            >
              <span
                role="img"
                aria-label="Token Factory"
                style={{
                  display: 'inline-block',
                  width: 18,
                  height: 18,
                  backgroundColor: 'currentColor',
                  maskImage: 'url("/logo.svg")',
                  WebkitMaskImage: 'url("/logo.svg")',
                  maskSize: 'contain',
                  WebkitMaskSize: 'contain',
                  maskRepeat: 'no-repeat',
                  WebkitMaskRepeat: 'no-repeat',
                  maskPosition: 'center',
                  WebkitMaskPosition: 'center',
                }}
              />
            </button>
            <span className="api-hub-mobile-header-title">{currentTitle}</span>
            <button
              type="button"
              className="api-hub-mobile-header-user"
              onClick={() => isLogin ? setShowUserModal(true) : setLoginModalOpen(true)}
            >
              <div className="api-hub-user-avatar" style={{ width: 28, height: 28, fontSize: 12 }}>
                {isLogin && isRealName ? avatarLetter : <User size={14} strokeWidth={2.2} />}
              </div>
            </button>
          </header>
        )}

        <div className="api-hub-content">
          <div className="api-hub-content-inner">
            <Outlet />
          </div>
        </div>
      </div>

      {/* 底部 Tab 导航 - 移动端 */}
      {isMobile && (
        <nav className="api-hub-bottom-tab">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.path}
              type="button"
              className={`api-hub-bottom-tab-item${location.pathname.startsWith(item.path) ? ' active' : ''}`}
              onClick={() => handleNavigate(item.path)}
            >
              {item.icon}
              <span className="api-hub-bottom-tab-label">{item.label}</span>
            </button>
          ))}
        </nav>
      )}

      {/* 登录弹窗 */}
      <LoginModal />

      <FloatingSupportButton />

      {/* 用户信息弹窗 */}
      {showUserModal && (
        <div className="api-hub-modal-overlay" onClick={() => setShowUserModal(false)}>
          <div
            className="api-hub-modal"
            style={{ maxWidth: 384 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="api-hub-user-modal-content">
              <button
                type="button"
                className="api-hub-btn-ghost api-hub-user-modal-close"
                onClick={() => setShowUserModal(false)}
              >
                <X size={18} />
              </button>

              <div className="api-hub-user-avatar-ring api-hub-user-modal-avatar-ring">
                <div className="api-hub-user-avatar api-hub-user-modal-avatar">
                  {isRealName ? (
                    avatarLetter
                  ) : (
                    <User size={28} strokeWidth={2} />
                  )}
                </div>
              </div>

              <div className="api-hub-user-modal-name">{displayName}</div>
              {isRealName && userProfile?.phone && (
                <div className="api-hub-user-modal-phone">{userProfile.phone}</div>
              )}

              <button
                type="button"
                className="api-hub-btn-secondary api-hub-user-modal-logout-btn"
                onClick={() => {
                  setShowUserModal(false);
                  setShowLogoutConfirm(true);
                }}
              >
                退出登录
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 退出确认弹窗 */}
      {showLogoutConfirm && (
        <div className="api-hub-modal-overlay" onClick={() => setShowLogoutConfirm(false)}>
          <div
            className="api-hub-modal"
            style={{ maxWidth: 384 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="api-hub-logout-modal-content">
              <h3 className="api-hub-logout-modal-title">确认退出</h3>
              <p className="api-hub-logout-modal-desc">确定要退出登录吗？</p>

              <div className="api-hub-logout-modal-actions">
                <button
                  type="button"
                  className="api-hub-btn-secondary"
                  onClick={() => setShowLogoutConfirm(false)}
                >
                  取消
                </button>
                <button type="button" className="api-hub-btn-primary" onClick={handleLogout}>
                  确认退出
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiHubLayout;