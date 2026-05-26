import { NavLink } from 'react-router-dom';
import styles from './AppHeader.module.css';

/**
 * 顶部固定导航栏
 * 包含应用名称、主导航链接
 */
export default function AppHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        {/* Logo + 应用名 */}
        <div className={styles.brand}>
          <span className={styles.brandIcon}>🏛</span>
          <div className={styles.brandText}>
            <span className={styles.brandName}>石化公文排版工具</span>
            <span className={styles.brandSub}>离线版 · 规则引擎驱动</span>
          </div>
        </div>

        {/* 主导航 */}
        <nav className={styles.nav}>
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              [styles.navLink, isActive ? styles.navLinkActive : ''].join(' ')
            }
          >
            <span className={styles.navIcon}>✏️</span>
            编辑器
          </NavLink>
          <NavLink
            to="/templates"
            className={({ isActive }) =>
              [styles.navLink, isActive ? styles.navLinkActive : ''].join(' ')
            }
          >
            <span className={styles.navIcon}>📋</span>
            模板管理
          </NavLink>
        </nav>

        {/* 右侧信息区 */}
        <div className={styles.statusArea}>
          <span className={styles.offlineBadge}>
            <span className={styles.offlineDot} />
            完全离线
          </span>
        </div>
      </div>
    </header>
  );
}
