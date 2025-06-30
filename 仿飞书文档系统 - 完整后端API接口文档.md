# 仿飞书文档系统 - 完整后端API接口文档

## 📋 基础信息

- **API 基础地址**: `http://8.134.200.53:8080/api`
- **认证方式**: Bearer Token (JWT)
- **请求格式**: JSON
- **响应格式**: JSON
- **API版本**: v3.0

## 🔐 认证说明

### JWT Token 格式
```http
Authorization: Bearer <your-jwt-token>
```

### Token 获取
通过登录接口获取，Token有效期为24小时

## 📊 统一响应格式

```json
{
  "code": "SUCCESS",
  "message": "操作成功",
  "data": {
    // 具体的响应数据
  }
}
```

### 响应状态码

| Code | HTTP状态码 | 说明 |
|------|-----------|------|
| SUCCESS | 200 | 操作成功 |
| ERROR | 400 | 操作失败 |
| UNAUTHORIZED | 401 | 未授权 |
| FORBIDDEN | 403 | 权限不足 |
| NOT_FOUND | 404 | 资源不存在 |
| VALIDATION_ERROR | 400 | 参数验证失败 |
| INTERNAL_ERROR | 500 | 服务器内部错误 |

## 👤 用户认证模块

### 1. 用户注册

**接口地址**: `POST /auth/register`

**请求参数**:
```json
{
  "username": "user123",
  "password": "password123",
  "nickname": "用户昵称",
  "avatarId": "avatar_001"
}
```

**参数说明**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | String | 是 | 用户名，3-20字符，唯一 |
| password | String | 是 | 密码，6-50字符 |
| nickname | String | 否 | 用户昵称，最大20字符 |
| avatarId | String | 否 | 头像ID |

**响应示例**:
```json
{
  "code": "SUCCESS",
  "message": "注册成功",
  "data": {
    "id": 1,
    "username": "user123",
    "nickname": "用户昵称",
    "avatar": "avatar_url",
    "status": "ACTIVE",
    "createdAt": "2024-01-01T10:00:00Z"
  }
}
```

### 2. 用户登录

**接口地址**: `POST /auth/login`

**请求参数**:
```json
{
  "username": "user123",
  "password": "password123"
}
```

**响应示例**:
```json
{
  "code": "SUCCESS",
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "user123",
      "nickname": "用户昵称",
      "avatar": "avatar_url",
      "status": "ACTIVE"
    }
  }
}
```

### 3. 获取当前用户信息

**接口地址**: `GET /auth/me`

**响应示例**:
```json
{
  "code": "SUCCESS",
  "message": "获取成功",
  "data": {
    "id": 1,
    "username": "user123",
    "email": "user@example.com",
    "nickname": "用户昵称",
    "avatar": "avatar_url",
    "status": "ACTIVE",
    "createdAt": "2024-01-01T10:00:00Z",
    "updatedAt": "2024-01-01T10:00:00Z"
  }
}
```

### 4. 更新用户信息

**接口地址**: `PUT /auth/profile`

**请求参数**:
```json
{
  "nickname": "新昵称",
  "email": "new@example.com",
  "avatarId": "new_avatar_001"
}
```

### 5. 修改密码

**接口地址**: `PUT /auth/password`

**请求参数**:
```json
{
  "oldPassword": "old_password",
  "newPassword": "new_password"
}
```

### 6. 退出登录

**接口地址**: `POST /auth/logout`

### 7. 刷新Token

**接口地址**: `POST /auth/refresh`

**请求参数**:
```json
{
  "refreshToken": "refresh_token_string"
}
```

### 8. 测试邮箱为空注册

**接口地址**: `POST /auth/test-register-without-email`

**响应示例**:
```json
{
  "code": "SUCCESS",
  "message": "邮箱为空注册测试成功",
  "data": {
    "id": 2,
    "username": "test_no_email_1640995200000",
    "email": null,
    "nickname": "测试用户",
    "avatar": "default_avatar",
    "status": "ACTIVE"
  }
}
```

## 📚 知识库管理模块

### 1. 创建知识库

**接口地址**: `POST /workspaces`

**请求参数**:
```json
{
  "name": "知识库名称",
  "description": "知识库描述",
  "icon": "📚",
  "visibility": "PRIVATE"
}
```

**参数说明**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | String | 是 | 知识库名称，最大50字符 |
| description | String | 否 | 知识库描述，最大500字符 |
| icon | String | 否 | 知识库图标 |
| visibility | String | 否 | 可见性：PRIVATE/INTERNAL/PUBLIC |

**响应示例**:
```json
{
  "code": "SUCCESS",
  "message": "创建成功",
  "data": {
    "id": 1,
    "name": "知识库名称",
    "description": "知识库描述",
    "icon": "📚",
    "status": "ACTIVE",
    "visibility": "PRIVATE",
    "owner": {
      "id": 1,
      "username": "user123",
      "nickname": "用户昵称",
      "avatar": "avatar_url"
    },
    "createdAt": "2024-01-01T10:00:00Z",
    "updatedAt": "2024-01-01T10:00:00Z",
    "documentCount": 0
  }
}
```

### 2. 获取知识库列表

**接口地址**: `GET /workspaces`

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | Integer | 否 | 页码，从0开始 |
| size | Integer | 否 | 每页大小，默认10 |
| sortBy | String | 否 | 排序字段 |
| sortDir | String | 否 | 排序方向：asc/desc |

### 3. 获取知识库详情

**接口地址**: `GET /workspaces/{id}`

### 4. 更新知识库

**接口地址**: `PUT /workspaces/{id}`

### 5. 删除知识库

**接口地址**: `DELETE /workspaces/{id}`

### 6. 搜索知识库

**接口地址**: `GET /workspaces/search`

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| keyword | String | 是 | 搜索关键词 |

## 📄 文档管理模块

### 1. 创建文档

**接口地址**: `POST /documents`

**请求参数**:
```json
{
  "title": "文档标题",
  "content": "文档内容",
  "contentJson": "JSON格式内容",
  "type": "RICH_TEXT",
  "workspaceId": 1
}
```

**参数说明**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| title | String | 是 | 文档标题 |
| content | String | 否 | 文档内容 |
| contentJson | String | 否 | JSON格式内容 |
| type | String | 否 | 文档类型：RICH_TEXT/MARKDOWN/CODE |
| workspaceId | Long | 是 | 所属知识库ID |

**响应示例**:
```json
{
  "code": "SUCCESS",
  "message": "创建成功",
  "data": {
    "id": 1,
    "title": "文档标题",
    "content": "文档内容",
    "contentJson": "JSON格式内容",
    "status": "DRAFT",
    "type": "RICH_TEXT",
    "workspace": {
      "id": 1,
      "name": "知识库名称",
      "description": "知识库描述",
      "icon": "📚"
    },
    "creator": {
      "id": 1,
      "username": "user123",
      "nickname": "用户昵称",
      "avatar": "avatar_url"
    },
    "lastModifier": null,
    "currentVersion": 1,
    "operationSequence": 1,
    "createdAt": "2024-01-01T10:00:00Z",
    "updatedAt": "2024-01-01T10:00:00Z"
  }
}
```

### 2. 获取文档详情

**接口地址**: `GET /documents/{id}`

### 3. 更新文档

**接口地址**: `PUT /documents/{id}`

**请求参数**:
```json
{
  "title": "新标题",
  "content": "新内容",
  "contentJson": "新JSON内容",
  "status": "PUBLISHED"
}
```

### 4. 删除文档

**接口地址**: `DELETE /documents/{id}`

### 5. 获取知识库下的文档列表

**接口地址**: `GET /documents/workspace/{workspaceId}`

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | Integer | 否 | 页码 |
| size | Integer | 否 | 每页大小 |
| sortBy | String | 否 | 排序字段 |
| sortDir | String | 否 | 排序方向 |

### 6. 搜索文档

**接口地址**: `GET /documents/search`

### 7. 获取最近文档

**接口地址**: `GET /documents/recent`

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| limit | Integer | 否 | 返回数量限制 |

## 🤝 协作管理模块

### 1. 邀请用户加入知识库

**接口地址**: `POST /workspaces/{workspaceId}/collaborators`

**请求参数**:
```json
{
  "username": "user123",
  "role": "EDITOR"
}
```

**参数说明**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | String | 是 | 被邀请用户名 |
| role | String | 是 | 角色：VIEWER/EDITOR/ADMIN |

### 2. 获取知识库协作者列表

**接口地址**: `GET /workspaces/{workspaceId}/collaborators`

### 3. 更新协作者角色

**接口地址**: `PUT /workspaces/{workspaceId}/collaborators/{userId}`

**请求参数**:
```json
{
  "role": "ADMIN"
}
```

### 4. 移除协作者

**接口地址**: `DELETE /workspaces/{workspaceId}/collaborators/{userId}`

### 5. 获取文档协作者列表

**接口地址**: `GET /documents/{documentId}/collaborators`

### 6. 获取用户权限

**接口地址**: `GET /workspaces/{workspaceId}/permissions`

**响应示例**:
```json
{
  "code": "SUCCESS",
  "message": "获取成功",
  "data": {
    "canRead": true,
    "canWrite": true,
    "canDelete": false,
    "canManage": false,
    "role": "EDITOR"
  }
}
```

## 📊 仪表板模块

### 1. 获取用户仪表板数据

**接口地址**: `GET /dashboard`

**响应示例**:
```json
{
  "code": "SUCCESS",
  "message": "获取成功",
  "data": {
    "totalWorkspaces": 5,
    "totalDocuments": 25,
    "recentDocuments": [
      {
        "id": 1,
        "title": "文档标题",
        "status": "PUBLISHED",
        "type": "RICH_TEXT",
        "creator": {
          "id": 1,
          "username": "user123",
          "nickname": "用户昵称",
          "avatar": "avatar_url"
        },
        "updatedAt": "2024-01-01T11:00:00Z"
      }
    ],
    "recentWorkspaces": [
      {
        "id": 1,
        "name": "知识库名称",
        "description": "知识库描述",
        "icon": "📚",
        "documentCount": 5,
        "updatedAt": "2024-01-01T10:00:00Z"
      }
    ],
    "statistics": {
      "documentsCreatedToday": 3,
      "documentsCreatedThisWeek": 15,
      "documentsCreatedThisMonth": 25,
      "activeCollaborators": 8
    }
  }
}
```

### 2. 获取知识库仪表板数据

**接口地址**: `GET /dashboard/workspace/{workspaceId}`

## 💬 评论模块

### 1. 添加评论

**接口地址**: `POST /documents/{documentId}/comments`

**请求参数**:
```json
{
  "content": "评论内容",
  "parentId": null,
  "position": {
    "line": 10,
    "column": 5
  }
}
```

### 2. 获取文档评论列表

**接口地址**: `GET /documents/{documentId}/comments`

### 3. 更新评论

**接口地址**: `PUT /comments/{commentId}`

### 4. 删除评论

**接口地址**: `DELETE /comments/{commentId}`

### 5. 回复评论

**接口地址**: `POST /comments/{commentId}/replies`

## 📁 文件管理模块

### 1. 上传文件

**接口地址**: `POST /files/upload`

**请求参数**: multipart/form-data
- file: 文件内容
- type: 文件类型（image/document/avatar）

**响应示例**:
```json
{
  "code": "SUCCESS",
  "message": "上传成功",
  "data": {
    "id": "file_001",
    "filename": "document.pdf",
    "originalName": "原始文件名.pdf",
    "size": 1024000,
    "mimeType": "application/pdf",
    "url": "http://example.com/files/file_001.pdf",
    "uploadedAt": "2024-01-01T10:00:00Z"
  }
}
```

### 2. 获取文件信息

**接口地址**: `GET /files/{fileId}`

### 3. 下载文件

**接口地址**: `GET /files/{fileId}/download`

### 4. 删除文件

**接口地址**: `DELETE /files/{fileId}`

### 5. 获取用户文件列表

**接口地址**: `GET /files`

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | String | 否 | 文件类型过滤 |
| page | Integer | 否 | 页码 |
| size | Integer | 否 | 每页大小 |

## 🔔 通知模块

### 1. 获取通知列表

**接口地址**: `GET /notifications`

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| status | String | 否 | 状态：READ/UNREAD |
| type | String | 否 | 类型：COMMENT/MENTION/INVITE |
| page | Integer | 否 | 页码 |
| size | Integer | 否 | 每页大小 |

**响应示例**:
```json
{
  "code": "SUCCESS",
  "message": "获取成功",
  "data": {
    "notifications": [
      {
        "id": 1,
        "type": "COMMENT",
        "title": "新评论",
        "content": "用户A在文档《标题》中添加了评论",
        "status": "UNREAD",
        "relatedId": 123,
        "relatedType": "DOCUMENT",
        "sender": {
          "id": 2,
          "username": "userA",
          "nickname": "用户A",
          "avatar": "avatar_url"
        },
        "createdAt": "2024-01-01T10:00:00Z"
      }
    ],
    "total": 10,
    "unreadCount": 5
  }
}
```

### 2. 标记通知为已读

**接口地址**: `PUT /notifications/{notificationId}/read`

### 3. 标记所有通知为已读

**接口地址**: `PUT /notifications/read-all`

### 4. 删除通知

**接口地址**: `DELETE /notifications/{notificationId}`

### 5. 获取未读通知数量

**接口地址**: `GET /notifications/unread-count`

## 🔍 搜索模块

### 1. 全局搜索

**接口地址**: `GET /search`

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| q | String | 是 | 搜索关键词 |
| type | String | 否 | 搜索类型：ALL/WORKSPACE/DOCUMENT |
| workspaceId | Long | 否 | 限定知识库范围 |
| page | Integer | 否 | 页码 |
| size | Integer | 否 | 每页大小 |

**响应示例**:
```json
{
  "code": "SUCCESS",
  "message": "搜索成功",
  "data": {
    "results": [
      {
        "type": "DOCUMENT",
        "id": 1,
        "title": "文档标题",
        "content": "匹配的内容片段...",
        "workspace": {
          "id": 1,
          "name": "知识库名称"
        },
        "score": 0.95,
        "highlights": ["关键词1", "关键词2"]
      }
    ],
    "total": 15,
    "page": 0,
    "size": 10,
    "searchTime": 120
  }
}
```

### 2. 搜索建议

**接口地址**: `GET /search/suggestions`

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| q | String | 是 | 搜索关键词 |
| limit | Integer | 否 | 建议数量限制 |

## 📈 统计分析模块

### 1. 获取知识库统计

**接口地址**: `GET /analytics/workspace/{workspaceId}`

**响应示例**:
```json
{
  "code": "SUCCESS",
  "message": "获取成功",
  "data": {
    "documentCount": 25,
    "collaboratorCount": 8,
    "viewCount": 1250,
    "editCount": 156,
    "commentCount": 89,
    "dailyStats": [
      {
        "date": "2024-01-01",
        "views": 45,
        "edits": 12,
        "comments": 8
      }
    ],
    "topDocuments": [
      {
        "id": 1,
        "title": "热门文档",
        "viewCount": 156,
        "editCount": 23
      }
    ]
  }
}
```

### 2. 获取文档统计

**接口地址**: `GET /analytics/document/{documentId}`

### 3. 获取用户活动统计

**接口地址**: `GET /analytics/user/activity`

## ⚙️ 系统管理模块

### 1. 获取系统信息

**接口地址**: `GET /system/info`

**响应示例**:
```json
{
  "code": "SUCCESS",
  "message": "获取成功",
  "data": {
    "version": "1.0.0",
    "buildTime": "2024-01-01T00:00:00Z",
    "environment": "production",
    "features": {
      "collaboration": true,
      "realTimeEdit": true,
      "fileUpload": true,
      "notifications": true
    }
  }
}
```

### 2. 健康检查

**接口地址**: `GET /system/health`

### 3. 获取系统配置

**接口地址**: `GET /system/config`

## 🚫 错误处理

### 常见错误码

| 错误码 | HTTP状态码 | 说明 |
|--------|-----------|------|
| UNAUTHORIZED | 401 | 未授权访问 |
| FORBIDDEN | 403 | 权限不足 |
| NOT_FOUND | 404 | 资源不存在 |
| VALIDATION_ERROR | 400 | 参数验证失败 |
| DUPLICATE_NAME | 400 | 名称重复 |
| WORKSPACE_NOT_FOUND | 404 | 知识库不存在 |
| DOCUMENT_NOT_FOUND | 404 | 文档不存在 |
| USER_NOT_FOUND | 404 | 用户不存在 |
| INVALID_PASSWORD | 400 | 密码错误 |
| TOKEN_EXPIRED | 401 | Token已过期 |
| RATE_LIMIT_EXCEEDED | 429 | 请求频率超限 |

### 错误响应格式

```json
{
  "code": "VALIDATION_ERROR",
  "message": "参数验证失败",
  "data": {
    "errors": [
      {
        "field": "username",
        "message": "用户名不能为空"
      }
    ]
  }
}
```

## 📝 开发规范

### 1. 请求规范
- 使用RESTful API设计
- 统一使用JSON格式
- 请求头必须包含Content-Type: application/json

### 2. 认证规范
- 除登录注册外，所有接口都需要JWT认证
- Token放在Authorization头中
- Token过期需要重新登录

### 3. 分页规范
- 页码从0开始
- 默认每页10条记录
- 最大每页100条记录

### 4. 排序规范
- 支持多字段排序
- 默认按更新时间倒序
- 格式：sortBy=field1,field2&sortDir=desc

### 5. 搜索规范
- 支持模糊匹配
- 支持多关键词搜索
- 支持高亮显示

## 🔧 部署说明

### 环境要求
- Java 11+
- MySQL 8.0+
- Redis 6.0+
- Elasticsearch 7.x (可选，用于全文搜索)

### 配置参数
```yaml
server:
  port: 8080

spring:
  datasource:
    url: jdbc:mysql://localhost:3306/collaborative_docs
    username: root
    password: password
  
  redis:
    host: localhost
    port: 6379
  
jwt:
  secret: your-secret-key
  expiration: 86400000

file:
  upload:
    path: /data/uploads
    max-size: 10MB
```

### API限流
- 登录接口：每分钟5次
- 上传接口：每分钟10次
- 其他接口：每分钟100次

---

**📞 技术支持**

如有问题，请联系开发团队或查看在线文档。
