import { useFetch, useCookie } from 'nuxt/app';

export const fetchDocumentHistory = async (documentId, page = 0, size = 20, sort = "versionNumber,desc") => {
    try {
        // 构造API URL，包含路径参数和查询参数
        const apiUrl = `http://8.134.200.53:8080/api/documents/${documentId}/versions`;
        console.log("获取的文档id：",documentId)

        // 从cookie中获取token
        const tokenCookie = useCookie('token');
        const token = tokenCookie.value;

        const headers = {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            'Content-Type': 'application/json'
        };

        const { data, error } = await useFetch(apiUrl, {
            headers,
            method: 'GET'
        });

        if (error.value) {
            throw new Error(error.value.message || '获取历史版本失败');
        }

        if (!data.value || !data.value.success || !data.value.data) {
            throw new Error('接口返回数据格式不正确');
        }

        const responseData = data.value.data;
        const history = responseData.versions.map(version => ({
            date: version.createdAt.split('T')[0],
            title: version.title,
            uuid: version.id.toString(),
            description: version.description,
            versionNumber: version.versionNumber,
            isMajor: version.isMajor,
            fileSize: version.fileSize,
            creator: version.creator.username
        }));

        return {
            history
        };
    } catch (error) {
        console.error('获取历史版本数据失败:', error);
    }
};
