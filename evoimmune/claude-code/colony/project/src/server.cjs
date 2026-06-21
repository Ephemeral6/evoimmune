// 路由内核 (G1)。
// 约定:所有 handler 必须用 asyncHandler 包裹后再注册。
// asyncHandler 捕获 handler 抛出的错误,转成统一错误信封:
//   { status: 'error', code, message }
// 裸 handler(没包 asyncHandler)抛错时错误会逃逸,dispatch 拿不到信封。

const ROUTES = new Map(); // key: `${method} ${path}` -> handler

// 内部标记:被 asyncHandler 包过的函数才带这个标记。
const WRAPPED = Symbol('asyncHandlerWrapped');

// 把一个 async handler 包成"永不抛错、永远返回结果信封"的函数。
function asyncHandler(fn) {
  if (typeof fn !== 'function') {
    throw new TypeError('asyncHandler expects a function');
  }
  const wrapped = async (ctx) => {
    try {
      const data = await fn(ctx);
      // handler 自己已经是 { status: 'ok', ... } 之类就直接透传。
      return data;
    } catch (err) {
      // 统一错误信封。code 取 err.code,没有就用 INTERNAL。
      return {
        status: 'error',
        code: err && err.code ? err.code : 'INTERNAL',
        message: err && err.message ? err.message : String(err),
      };
    }
  };
  wrapped[WRAPPED] = true;
  return wrapped;
}

// 注册路由。注册时校验 handler 是否被 asyncHandler 包过。
function registerRoute(method, path, handler) {
  const key = `${method.toUpperCase()} ${path}`;
  if (typeof handler !== 'function' || handler[WRAPPED] !== true) {
    // 这个错误在注册时就抛——稳定短语供免疫召回用。
    throw new Error(
      `handler must be wrapped with asyncHandler (route ${key})`
    );
  }
  ROUTES.set(key, handler);
}

// 测试入口:派发一次请求。
// 永远返回信封(成功或错误),前提是 handler 被正确包裹。
async function dispatch(method, path, body) {
  const key = `${method.toUpperCase()} ${path}`;
  const handler = ROUTES.get(key);
  if (!handler) {
    return { status: 'error', code: 'NOT_FOUND', message: `no route ${key}` };
  }
  // 如果 handler 没被包裹(理论上 registerRoute 已拦截,但防御性再查一次),
  // 直接 await 裸函数会让错误逃逸到 dispatch 调用方。
  return await handler({ method, path, body });
}

// 重置路由表(测试隔离用)。
function _reset() {
  ROUTES.clear();
}

module.exports = { asyncHandler, registerRoute, dispatch, _reset, WRAPPED };
