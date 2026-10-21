import { Link, NavLink, Outlet } from 'react-router-dom';
import { FaLeaf } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useT } from '../context/LanguageContext';
import { LanguageSwitch } from './AppLayout';

export default function PublicLayout() {
  const { user } = useAuth();
  const { t } = useT();
  return (
    <div className="public-shell">
      <a href="#main" className="skip-link">Skip to content</a>
      <header className="public-nav">
        <Link to="/" className="brand brand-dark"><FaLeaf aria-hidden="true" /> {t('app.name')}</Link>
        <div className="d-flex align-items-center gap-2">
          <LanguageSwitch />
          {user ? <Link className="btn btn-primary btn-sm" to="/dashboard">{t('nav.dashboard')}</Link> : (
            <>
              <NavLink className="btn btn-outline-primary btn-sm" to="/login">{t('nav.login')}</NavLink>
              <NavLink className="btn btn-primary btn-sm" to="/register">{t('nav.register')}</NavLink>
            </>
          )}
        </div>
      </header>
      <main id="main" tabIndex={-1}><Outlet /></main>
      <footer className="public-footer">
        <div>AgriTech – SkillWallet Full Stack (MERN) capstone project. Information in this app is general guidance, not professional agronomic advice.</div>
      </footer>
    </div>
  );
}
