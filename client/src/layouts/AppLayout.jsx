import { useState } from 'react';
import { Button, Dropdown, Offcanvas } from 'react-bootstrap';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  FaBell, FaBoxOpen, FaBook, FaCalendarCheck, FaCloudSun, FaComments, FaFlask, FaHome, FaLeaf, FaListAlt, FaSeedling, FaShoppingBasket,
  FaShoppingCart, FaTools, FaTractor, FaUser, FaUsers, FaBars, FaBullhorn, FaClipboardList, FaWarehouse,
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useT } from '../context/LanguageContext';

export function LanguageSwitch({ className = '' }) {
  const { lang, setLang, t } = useT();
  return (
    <select className={`form-select form-select-sm lang-select ${className}`} aria-label={t('common.language')} value={lang} onChange={(e) => setLang(e.target.value)}>
      <option value="en">English</option>
      <option value="hi">हिन्दी</option>
    </select>
  );
}

function Section({ label, rows, onNavigate, t }) {
  return (
    <>
      {label && <div className="nav-section">{label}</div>}
      {rows.map(([to, Icon, key, badge]) => (
        <NavLink key={to} to={to} end={to === '/admin' || to === '/dashboard'} className="side-link" onClick={onNavigate}>
          <Icon aria-hidden="true" /><span>{t(key)}</span>{badge > 0 && <span className="badge rounded-pill bg-warning text-dark ms-auto">{badge}</span>}
        </NavLink>
      ))}
    </>
  );
}

function Nav({ onNavigate }) {
  const { user } = useAuth();
  const { count } = useCart();
  const { t } = useT();
  const farmer = [
    ['/dashboard', FaHome, 'nav.dashboard'], ['/farms', FaTractor, 'nav.farms'], ['/crops', FaSeedling, 'nav.crops'], ['/activities', FaClipboardList, 'nav.activities'],
    ['/soil', FaFlask, 'nav.soil'], ['/crop-info', FaBook, 'nav.cropInfo'], ['/weather', FaCloudSun, 'nav.weather'], ['/alerts', FaBell, 'nav.alerts'],
  ];
  const shop = [
    ['/marketplace', FaShoppingBasket, 'nav.market'], ['/cart', FaShoppingCart, 'nav.cart', count], ['/orders', FaBoxOpen, 'nav.orders'],
    ['/services', FaTools, 'nav.services'], ['/bookings', FaCalendarCheck, 'nav.bookings'], ['/community', FaComments, 'nav.community'],
  ];
  const admin = [
    ['/admin', FaHome, 'nav.admin'], ['/admin/users', FaUsers, 'nav.adminUsers'], ['/admin/products', FaWarehouse, 'nav.adminProducts'], ['/admin/services', FaTools, 'nav.adminServices'],
    ['/admin/orders', FaListAlt, 'nav.adminOrders'], ['/admin/bookings', FaCalendarCheck, 'nav.adminBookings'], ['/admin/alerts', FaBullhorn, 'nav.adminAlerts'],
  ];
  return (
    <nav aria-label="Main">
      {user.role === 'admin' && <Section label="Admin" rows={admin} onNavigate={onNavigate} t={t} />}
      <Section label={user.role === 'admin' ? 'Farmer tools' : 'My farm'} rows={farmer} onNavigate={onNavigate} t={t} />
      <Section label="Shop & services" rows={shop} onNavigate={onNavigate} t={t} />
    </nav>
  );
}

export default function AppLayout() {
  const { user, logout } = useAuth();
  const { t } = useT();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const doLogout = () => nav('/logout'); // /logout leaves the protected area first, then clears the session

  const brand = <NavLink to="/dashboard" className="brand"><FaLeaf aria-hidden="true" /> {t('app.name')}</NavLink>;
  const account = (
    <Dropdown align="end">
      <Dropdown.Toggle variant="light" size="sm" className="d-flex align-items-center gap-2"><FaUser aria-hidden="true" /> <span className="d-none d-sm-inline">{user.name}</span></Dropdown.Toggle>
      <Dropdown.Menu>
        <Dropdown.Item as={NavLink} to="/profile">{t('nav.profile')}</Dropdown.Item>
        <Dropdown.Divider />
        <Dropdown.Item onClick={doLogout}>{t('nav.logout')}</Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );

  return (
    <div className="app-shell">
      <a href="#main" className="skip-link">Skip to content</a>
      <aside className="sidebar d-none d-lg-flex flex-column">
        <div className="sidebar-brand">{brand}</div>
        <div className="sidebar-scroll"><Nav /></div>
      </aside>
      <Offcanvas show={open} onHide={() => setOpen(false)} className="sidebar-offcanvas" aria-label="Navigation menu">
        <Offcanvas.Header closeButton closeVariant="white"><Offcanvas.Title as="div">{brand}</Offcanvas.Title></Offcanvas.Header>
        <Offcanvas.Body><Nav onNavigate={() => setOpen(false)} /></Offcanvas.Body>
      </Offcanvas>
      <div className="main-col">
        <header className="topbar">
          <Button variant="light" size="sm" className="d-lg-none" onClick={() => setOpen(true)} aria-label={t('nav.menu')}><FaBars /></Button>
          <div className="ms-auto d-flex align-items-center gap-2">
            <LanguageSwitch />
            {account}
          </div>
        </header>
        <main id="main" className="content" tabIndex={-1}><Outlet /></main>
      </div>
    </div>
  );
}
