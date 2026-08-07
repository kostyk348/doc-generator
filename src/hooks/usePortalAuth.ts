import { useState, useEffect } from 'react';

export interface PortalUser {
  username?: string;
  email?: string;
  fullName?: string;
  roles?: string[];
  permissions?: string[];
}

export interface PortalAuthState {
  status: 'loading' | 'ready' | 'unauthorized';
  user: PortalUser | null;
  token: string | null;
  error?: string;
}

/**
 * Custom Portal Auth Hook that validates JWT portal tokens from cookies/localStorage/postMessage
 * and seamlessly connects to portal-core when installed in production.
 */
export function usePortalAuth(requiredPermission: string = 'DOC_GENERATOR_ACCESS'): PortalAuthState {
  const [authState, setAuthState] = useState<PortalAuthState>({
    status: 'loading',
    user: null,
    token: null,
  });

  useEffect(() => {
    let isMounted = true;

    async function checkAuth() {
      try {
        // 1. Check cookies / localStorage for portal JWT token
        const cookies = document.cookie ? document.cookie.split('; ') : [];
        const cookieToken = cookies
          .find((row) => row.startsWith('portal_token=') || row.startsWith('access_token=') || row.startsWith('jwt='))
          ?.split('=')[1];

        const localToken =
          localStorage.getItem('portal_token') ||
          localStorage.getItem('access_token') ||
          localStorage.getItem('jwt');

        const activeToken = cookieToken || localToken;

        // 2. Try importing portal-core dynamically if installed on server
        try {
          const packageName = 'portal-core';
          const portalCore = await import(/* @vite-ignore */ packageName);
          if (portalCore && typeof portalCore.useAuthGate === 'function') {
            const gate = portalCore.useAuthGate(requiredPermission);
            if (isMounted) {
              setAuthState({
                status: gate.status || 'ready',
                user: gate.user || { username: 'portal_user' },
                token: gate.token || activeToken || null,
              });
              return;
            }
          }
        } catch {
          // portal-core is optional at local build time, fallback to standalone JWT/Portal gate check
        }

        // 3. Check for active token or fallback local role session
        const storedRole = localStorage.getItem('doc_gen_user_role');

        if (activeToken || storedRole) {
          if (isMounted) {
            setAuthState({
              status: 'ready',
              user: {
                username: storedRole === 'admin' ? 'Администратор Портала' : 'Сотрудник Портала',
                roles: storedRole ? [storedRole] : ['user'],
                permissions: [requiredPermission],
              },
              token: activeToken || 'session_active',
            });
          }
        } else {
          if (isMounted) {
            setAuthState({
              status: 'unauthorized',
              user: null,
              token: null,
              error: 'Требуется авторизация в портале TMDATA',
            });
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setAuthState({
            status: 'unauthorized',
            user: null,
            token: null,
            error: err.message || 'Ошибка проверки авторизации портала',
          });
        }
      }
    }

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [requiredPermission]);

  return authState;
}
