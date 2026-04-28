'use client';

import { Suspense, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { RoleProvider, useRole } from '@/context/RoleContext';
import SignIn from '@/views/SignIn';
import Onboarding from '@/views/Onboarding';
import UserDashboard from '@/views/UserDashboard';
import ActorDashboard from '@/views/ActorDashboard';
import SupplierDashboard from '@/views/SupplierDashboard';
import CreateProject from '@/views/CreateProject';
import PostDetails from '@/views/PostDetails';
import Offers from '@/views/Offers';
import Contract from '@/views/Contract';
import Workspace from '@/views/Workspace';
import Projects from '@/views/Projects';
import Profile from '@/views/Profile';
import Messages from '@/views/Messages';
import Settings from '@/views/Settings';
import Shop from '@/views/Shop';
import Orders from '@/views/Orders';
import ProjectIntelligence from '@/views/ProjectIntelligence';
import BlockchainTrustDashboard from '@/views/BlockchainTrustDashboard';

const POST_ROUTE = /^\/post\/[^/]+$/;
const CONTRACT_ROUTE = /^\/contract\/[^/]+$/;
const WORKSPACE_ROUTE = /^\/workspace\/[^/]+$/;

function DashboardRouter() {
  const { role, loading } = useRole();

  if (loading) {
    return null;
  }

  if (role === 'supplier') {
    return <SupplierDashboard />;
  }

  if (role === 'actor') {
    return <ActorDashboard />;
  }

  return <UserDashboard />;
}

function isKnownPath(pathname: string) {
  return (
    pathname === '/' ||
    pathname === '/onboarding' ||
    pathname === '/home' ||
    pathname === '/create-project' ||
    pathname === '/offers' ||
    pathname === '/projects' ||
    pathname === '/profile' ||
    pathname === '/messages' ||
    pathname === '/settings' ||
    pathname === '/shop' ||
    pathname === '/project-intelligence' ||
    pathname === '/blockchain-trust' ||
    pathname === '/supplier/orders' ||
    POST_ROUTE.test(pathname) ||
    CONTRACT_ROUTE.test(pathname) ||
    WORKSPACE_ROUTE.test(pathname)
  );
}

function renderPath(pathname: string) {
  if (pathname === '/') return <SignIn />;
  if (pathname === '/onboarding') return <Onboarding />;
  if (pathname === '/home') return <DashboardRouter />;
  if (pathname === '/create-project') return <CreateProject />;
  if (pathname === '/offers') return <Offers />;
  if (pathname === '/projects') return <Projects />;
  if (pathname === '/profile') return <Profile />;
  if (pathname === '/messages') return <Messages />;
  if (pathname === '/settings') return <Settings />;
  if (pathname === '/shop') return <Shop />;
  if (pathname === '/project-intelligence') return <ProjectIntelligence />;
  if (pathname === '/blockchain-trust') return <BlockchainTrustDashboard />;
  if (pathname === '/supplier/orders') return <Orders />;
  if (POST_ROUTE.test(pathname)) return <PostDetails />;
  if (CONTRACT_ROUTE.test(pathname)) return <Contract />;
  if (WORKSPACE_ROUTE.test(pathname)) return <Workspace />;
  return null;
}

function RouteRenderer() {
  const pathname = usePathname() || '/';
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { loading: roleLoading } = useRole();
  const knownPath = isKnownPath(pathname);
  const isPublicPath = pathname === '/';
  const loading = authLoading || (!!user && roleLoading);

  useEffect(() => {
    if (!knownPath) {
      router.replace('/home');
      return;
    }

    if (loading) {
      return;
    }

    if (!user && !isPublicPath) {
      router.replace('/');
      return;
    }

    if (user && pathname === '/') {
      router.replace('/home');
    }
  }, [isPublicPath, knownPath, loading, pathname, router, user]);

  if (!knownPath || loading) {
    return null;
  }

  if (!user && !isPublicPath) {
    return null;
  }

  if (user && pathname === '/') {
    return null;
  }

  return renderPath(pathname);
}

export default function CatchAllPage() {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  if (!isHydrated) {
    return null;
  }

  return (
    <AuthProvider>
      <RoleProvider>
        <Suspense fallback={null}>
          <RouteRenderer />
        </Suspense>
      </RoleProvider>
    </AuthProvider>
  );
}
