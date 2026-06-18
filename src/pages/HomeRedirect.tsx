import { Navigate } from 'react-router-dom';
import { isAuthenticated } from '../lib/auth';

/** 根路径入口：游客 → 公开市场，已登录 → 应用首页 */
export default function HomeRedirect() {
  return <Navigate to={isAuthenticated() ? '/app/agents' : '/agents'} replace />;
}
