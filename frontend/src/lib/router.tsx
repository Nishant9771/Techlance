'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo } from 'react';
import type { ReactElement, ReactNode } from 'react';

type NavigateOptions = {
  replace?: boolean;
  state?: unknown;
};

type LocationState = {
  pathname: string;
  search: string;
  hash: string;
  state: unknown;
};

const POST_ROUTE = /^\/post\/([^/]+)$/;
const CONTRACT_ROUTE = /^\/contract\/([^/]+)$/;
const WORKSPACE_ROUTE = /^\/workspace\/([^/]+)$/;
const NAV_STATE_PARAM = '__navState';

function decodeParam(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function paramsFromPath(pathname: string) {
  const postMatch = pathname.match(POST_ROUTE);
  if (postMatch) {
    return { id: decodeParam(postMatch[1]) };
  }

  const contractMatch = pathname.match(CONTRACT_ROUTE);
  if (contractMatch) {
    return { id: decodeParam(contractMatch[1]) };
  }

  const workspaceMatch = pathname.match(WORKSPACE_ROUTE);
  if (workspaceMatch) {
    return { id: decodeParam(workspaceMatch[1]) };
  }

  return {};
}

function stateStorageKey(token: string) {
  return `nav-state:${token}`;
}

function withSerializedState(to: string, state: unknown) {
  if (typeof window === 'undefined') {
    return to;
  }

  const token = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  try {
    sessionStorage.setItem(stateStorageKey(token), JSON.stringify(state));
  } catch {
    // Ignore storage failures and continue navigation without state.
  }

  const target = new URL(to, window.location.origin);
  target.searchParams.set(NAV_STATE_PARAM, token);

  return `${target.pathname}${target.search}${target.hash}`;
}

function readSerializedState(token: string | null) {
  if (!token || typeof window === 'undefined') {
    return null;
  }

  const raw = sessionStorage.getItem(stateStorageKey(token));
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function useNavigate() {
  const router = useRouter();

  return useCallback(
    (to: string, options?: NavigateOptions) => {
      const target = options?.state !== undefined ? withSerializedState(to, options.state) : to;

      if (options?.replace) {
        router.replace(target);
        return;
      }

      router.push(target);
    },
    [router],
  );
}

export function useParams<
  TParams extends Record<string, string | undefined> = Record<string, string | undefined>,
>() {
  const pathname = usePathname() || '/';
  return paramsFromPath(pathname) as TParams;
}

export function useLocation(): LocationState {
  const pathname = usePathname() || '/';
  const searchParams = useSearchParams();

  const search = useMemo(() => {
    if (!searchParams) {
      return '';
    }

    const serialized = searchParams.toString();
    return serialized ? `?${serialized}` : '';
  }, [searchParams]);

  const state = useMemo(() => {
    return readSerializedState(searchParams?.get(NAV_STATE_PARAM) ?? null);
  }, [searchParams]);

  return {
    pathname,
    search,
    hash: '',
    state,
  };
}

export function BrowserRouter({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function Routes({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

type RouteProps = {
  path?: string;
  element?: ReactElement | null;
  children?: ReactNode;
};

export function Route({ element, children }: RouteProps) {
  return element ?? <>{children}</>;
}

export function Navigate({ to, replace = false }: { to: string; replace?: boolean }) {
  const navigate = useNavigate();

  useEffect(() => {
    navigate(to, { replace });
  }, [navigate, replace, to]);

  return null;
}

export { Link };
export const NavLink = Link;
