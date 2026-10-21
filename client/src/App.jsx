import { lazy, Suspense, useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import RequireAuth from './components/RequireAuth';
import { Loading } from './components/ui';
import { useAuth } from './context/AuthContext';
import AppLayout from './layouts/AppLayout';
import PublicLayout from './layouts/PublicLayout';

// Code splitting: each page is loaded on demand (faster first load on slow rural networks).
const page = (loader) => lazy(loader);
const Landing = page(() => import('./pages/Landing'));
const Login = page(() => import('./pages/Login'));
const Register = page(() => import('./pages/Register'));
const Dashboard = page(() => import('./pages/Dashboard'));
const Farms = page(() => import('./pages/Farms'));
const Crops = page(() => import('./pages/Crops'));
const CropDetail = page(() => import('./pages/CropDetail'));
const Activities = page(() => import('./pages/Activities'));
const Soil = page(() => import('./pages/Soil'));
const CropInfo = page(() => import('./pages/CropInfo'));
const CropInfoDetail = page(() => import('./pages/CropInfoDetail'));
const Weather = page(() => import('./pages/Weather'));
const Alerts = page(() => import('./pages/Alerts'));
const Marketplace = page(() => import('./pages/Marketplace'));
const Cart = page(() => import('./pages/Cart'));
const Orders = page(() => import('./pages/Orders'));
const Services = page(() => import('./pages/Services'));
const Bookings = page(() => import('./pages/Bookings'));
const Community = page(() => import('./pages/Community'));
const PostDetail = page(() => import('./pages/PostDetail'));
const Profile = page(() => import('./pages/Profile'));
const AdminDashboard = page(() => import('./pages/admin/AdminDashboard'));
const AdminUsers = page(() => import('./pages/admin/AdminUsers'));
const AdminProducts = page(() => import('./pages/admin/AdminProducts'));
const AdminServices = page(() => import('./pages/admin/AdminServices'));
const AdminOrders = page(() => import('./pages/admin/AdminOrders'));
const AdminBookings = page(() => import('./pages/admin/AdminBookings'));
const AdminAlerts = page(() => import('./pages/admin/AdminAlerts'));

// Clears the session, then returns to the landing page.
function Logout() {
  const { logout } = useAuth();
  useEffect(() => { logout(); }, [logout]);
  return <Navigate to="/" replace />;
}

export default function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>
        <Route path="/logout" element={<Logout />} />
        <Route element={<RequireAuth />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/farms" element={<Farms />} />
            <Route path="/crops" element={<Crops />} />
            <Route path="/crops/:id" element={<CropDetail />} />
            <Route path="/activities" element={<Activities />} />
            <Route path="/soil" element={<Soil />} />
            <Route path="/crop-info" element={<CropInfo />} />
            <Route path="/crop-info/:slug" element={<CropInfoDetail />} />
            <Route path="/weather" element={<Weather />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/services" element={<Services />} />
            <Route path="/bookings" element={<Bookings />} />
            <Route path="/community" element={<Community />} />
            <Route path="/community/:id" element={<PostDetail />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
        </Route>
        <Route element={<RequireAuth role="admin" />}>
          <Route element={<AppLayout />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/products" element={<AdminProducts />} />
            <Route path="/admin/services" element={<AdminServices />} />
            <Route path="/admin/orders" element={<AdminOrders />} />
            <Route path="/admin/bookings" element={<AdminBookings />} />
            <Route path="/admin/alerts" element={<AdminAlerts />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
