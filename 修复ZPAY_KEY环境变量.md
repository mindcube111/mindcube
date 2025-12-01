# 🔴 紧急修复：ZPAY_KEY 环境变量问题

## 问题确认

错误信息显示签名字符串末尾是 `商户KEY`，这明确说明：
**环境变量 `ZPAY_KEY` 的值仍然是占位符，而不是真实的商户密钥！**

---

## ✅ 立即修复步骤

### 第一步：确认易支付后台的商户密钥

1. **登录易支付后台**
   - 访问：https://zpayz.cn
   - 登录您的商户账号

2. **复制商户密钥（PKEY）**
   - 商户中心 → API接口设置
   - 找到 **商户密钥（PKEY）** 或 **KEY**
   - **完整复制**密钥值（应该是：`MDZp0po0WbUsFhzLtgMLbAcHIYa8WnFm` 或类似的长字符串）

---

### 第二步：在 Cloudflare Dashboard 中更新环境变量

1. **登录 Cloudflare Dashboard**
   - 访问：https://dash.cloudflare.com/

2. **进入项目设置**
   - Workers 和 Pages → `psychological-assessment-platform`
   - Settings → Variables

3. **找到 `ZPAY_KEY` 变量**
   - 点击 `ZPAY_KEY` 变量
   - **检查当前值**：
     - ❌ 如果是 `商户KEY` → 需要替换
     - ❌ 如果是其他占位符文本 → 需要替换
     - ⚠️ 即使是真实密钥，也要确认是否完全正确

4. **更新 `ZPAY_KEY` 的值**
   - **删除**当前的值（如果是占位符）
   - **粘贴**从易支付后台复制的真实密钥
   - **确保完全一致**（包括大小写、所有字符，不能有空格或换行）
   - **保存**

5. **同时检查其他环境变量**
   - `ZPAY_PID`：应该是 `2025120114591699`
   - `PUBLIC_BASE_URL`：应该是 `https://mindcube.top`

---

### 第三步：必须重新部署 Worker ⚠️⚠️⚠️

**这是最关键的一步！**

环境变量修改后，**必须重新部署 Worker 才能生效**。

#### 方法 A：推送代码触发自动部署

```powershell
# 创建一个空提交来触发重新部署
git commit --allow-empty -m "更新: 修复支付环境变量"
git push
```

#### 方法 B：在 Cloudflare Dashboard 手动重新部署

1. 在 Cloudflare Dashboard → **Deployments** 标签
2. 找到最新的部署
3. 点击 **Retry deployment**（重新部署）或 **Retry**
4. 等待部署完成（1-3 分钟）

---

### 第四步：验证修复

部署完成后：

1. **测试支付功能**
   - 访问网站并尝试支付
   - 如果仍然报错，查看错误信息

2. **查看 Cloudflare Workers 日志**
   - 进入项目 → **Logs** 标签
   - 尝试支付，查看日志输出
   - 查找 `=== 支付配置深度诊断 ===` 日志
   - 检查：
     - `key_preview` - 应该显示真实密钥（如 `MDZp0p...WnFm`）
     - `key_ends_with_placeholder` - 应该是 `false`
     - `is_placeholder` - 应该是 `false`

---

## 🔍 验证清单

请确认以下所有项：

- [ ] 已从易支付后台复制真实的商户密钥
- [ ] 在 Cloudflare Dashboard 中更新了 `ZPAY_KEY` 的值
- [ ] `ZPAY_KEY` 的值是完整且正确的（没有空格、换行等）
- [ ] 已保存环境变量
- [ ] **已重新部署 Worker**（最重要！）
- [ ] 部署已完成
- [ ] 测试支付功能

---

## 📋 正确的商户密钥格式

商户密钥应该是：
- ✅ 32 位或更长的字符串
- ✅ 包含字母和数字
- ✅ 类似：`MDZp0po0WbUsFhzLtgMLbAcHIYa8WnFm`
- ❌ **不是**：`商户KEY`、`你的`、`your`、`example` 等占位符

---

## 🆘 如果问题仍然存在

### 1. 检查密钥是否正确

在易支付后台：
- 确认商户ID（PID）是：`2025120114591699`
- 确认商户密钥（PKEY）是正确的值

### 2. 检查环境变量是否正确保存

在 Cloudflare Dashboard：
- 重新打开 `ZPAY_KEY` 变量
- 确认显示的值不是占位符

### 3. 确认已重新部署

- 查看 Deployments 页面
- 确认最新部署的时间在您修改环境变量之后

### 4. 查看日志

部署后，测试支付并查看 Cloudflare Workers 日志中的：
- `=== 支付配置深度诊断 ===`
- `KEY 验证详情:`

把日志中的 `key_preview` 和 `key_ends_with_placeholder` 的值告诉我，我可以进一步诊断。

---

## ⚠️ 重要提醒

1. **环境变量修改后必须重新部署才能生效！**
2. **密钥值必须完全正确，不能有空格或多余字符**
3. **如果修改后仍然报错，请查看日志确认实际读取到的值**

---

**当前问题**：环境变量 `ZPAY_KEY` 的值仍然是 `商户KEY`，需要更新为易支付后台的真实密钥值。


