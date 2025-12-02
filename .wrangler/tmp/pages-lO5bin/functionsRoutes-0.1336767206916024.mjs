import { onRequest as __api___path___js_onRequest } from "C:\\Users\\26872\\Desktop\\心理网站编写\\02 管理器\\functions\\api\\[[path]].js"
import { onRequest as ___middleware_js_onRequest } from "C:\\Users\\26872\\Desktop\\心理网站编写\\02 管理器\\functions\\_middleware.js"

export const routes = [
    {
      routePath: "/api/:path*",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api___path___js_onRequest],
    },
  {
      routePath: "/",
      mountPath: "/",
      method: "",
      middlewares: [___middleware_js_onRequest],
      modules: [],
    },
  ]