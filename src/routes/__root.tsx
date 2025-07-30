import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { ENABLE_ROUTER_DEVTOOLS } from '../config/constants'

export const Route = createRootRoute({
  component: () => (
    <>
      <Outlet />
      {ENABLE_ROUTER_DEVTOOLS && <TanStackRouterDevtools />}
    </>
  ),
})
