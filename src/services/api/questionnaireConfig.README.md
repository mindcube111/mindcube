# 问卷配置 API 迁移说明

## 概述

问卷配置（上架状态、自定义类型、系统覆盖配置）已从 `localStorage` 迁移到后端 API，支持多设备同步和多人协作管理。

## API 接口

### 1. 获取所有问卷配置
```
GET /api/admin/questionnaire-config
```
返回：
- `questionnaires`: 所有问卷配置
- `publishState`: 上架状态映射
- `customTypes`: 自定义问卷类型
- `systemOverrides`: 系统问卷覆盖配置

### 2. 获取已上架问卷（公开接口）
```
GET /api/questionnaires/published
```
返回已上架的问卷列表，无需认证。

### 3. 更新单个问卷上架状态
```
PATCH /api/admin/questionnaire-config/publish-state/{value}
Body: { isPublished: boolean }
```

### 4. 批量更新上架状态
```
PATCH /api/admin/questionnaire-config/publish-state/batch
Body: { states: Record<string, boolean> }
```

### 5. 更新问卷配置
```
PATCH /api/admin/questionnaire-config/{value}
Body: { label?, description?, features?, duration?, price?, questions? }
```

### 6. 添加自定义问卷类型
```
POST /api/admin/questionnaire-config/custom
Body: QuestionnaireConfig
```

### 7. 删除自定义问卷类型
```
DELETE /api/admin/questionnaire-config/custom/{value}
```

## 前端使用

### 启用/禁用 API

通过环境变量控制：
```env
VITE_USE_QUESTIONNAIRE_CONFIG_API=true  # 默认启用
```

设置为 `false` 时，将降级到 `localStorage`（向后兼容）。

### 异步 API 函数

所有函数都提供了异步版本（带 `Async` 后缀）：

```typescript
// 加载上架状态
await loadPublishStateAsync()

// 保存上架状态
await savePublishStateAsync(state)

// 获取已上架问卷
await getPublishedQuestionnairesAsync()

// 切换上架状态
await toggleQuestionnairePublishAsync(value)

// 更新配置
await updateCustomQuestionnaireAsync(value, updates)
```

### 同步函数（向后兼容）

原有的同步函数仍然可用，会优先使用缓存，失败时使用 `localStorage`：

```typescript
loadPublishState()
savePublishState(state)
getPublishedQuestionnaires()
toggleQuestionnairePublish(value)
updateCustomQuestionnaire(value, updates)
```

## 缓存机制

- API 响应会缓存 5 分钟
- 更新操作会自动清除缓存
- 可通过 `clearConfigCache()` 手动清除缓存

## 降级策略

如果 API 请求失败，会自动降级到 `localStorage`，确保功能可用。

## 后端实现建议

1. **数据模型**：
   - `questionnaire_config` 表：存储问卷配置
   - `publish_state` 表：存储上架状态
   - `custom_types` 表：存储自定义问卷类型

2. **权限控制**：
   - `/admin/questionnaire-config/*` 需要管理员权限
   - `/questionnaires/published` 公开接口，无需认证

3. **数据迁移**：
   - 首次部署时，可以从 `localStorage` 迁移数据到数据库
   - 提供迁移脚本或管理界面

## 注意事项

1. 所有 API 接口都需要后端实现
2. 如果后端未实现，前端会自动降级到 `localStorage`
3. 建议在生产环境启用 API，以获得更好的协作体验



