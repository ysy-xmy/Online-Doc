export default defineNuxtRouteMiddleware((to, from) => {
    //后面接口开启后，需要检查token

    // 拿到token
    const token = useCookie("token");

    // 如果访问登录页面，不需要检查token
    if (to.path === "/Login" || to.path === "/Login/register") {
        return;
    }

    // 如果没有token，重定向到登录页面
    if (!token.value) {
        return navigateTo("/Login");
    }
});
