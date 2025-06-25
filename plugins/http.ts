export default defineNuxtPlugin(() => {
    const token = useCookie("token");//获取token

    // 创建自定义fetch实例(添加基地址)
    const customFetch = $fetch.create({
        baseURL: "http://8.134.200.53:8080",
        onRequest({ options }) {
            if (token.value) {
                const headers = new Headers(options.headers);
                headers.set("Authorization", `Bearer ${token.value}`);
                options.headers = headers;
            }
        },
    });

    // 提供自定义fetch实例
    return {
        provide: {
            axios: customFetch,
        },
    };
});
