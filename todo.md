# 寺院志愿者管理系统 - 开发任务清单

## 已完成功能 (Phase 1-8 核心)

### Phase 1-3: 基础架构 ✅
- [x] 数据库架构设计（18张表）
- [x] AES-256-CBC加密服务
- [x] HMAC-SHA256签名服务
- [x] 7级会员体系计算
- [x] 欢喜徽记自动授予（70小时）
- [x] RBAC权限控制（5级角色）
- [x] 审计日志服务
- [x] 双重认证系统（Manus OAuth + 志愿者代码登录）
- [x] 用户注册与管理CRUD
- [x] OAuth回调错误修复
- [x] 登录后自动初始化userRankSnapshot

### Phase 4: 部门管理（部分完成）✅
- [x] 部门CRUD后端API
- [x] 部门管理前端UI
- [x] RBAC权限验证

### Phase 5-6: 排班与考勤系统 ✅
- [x] 排班创建（日期、部门、班次时间、所需人数）
- [x] 志愿者分配到排班
- [x] 日历视图查看排班
- [x] 考勤确认界面
- [x] 自动记录工时到hours_ledger
- [x] 自动计算积分到point_ledger（统一1小时=10积分）
- [x] 自动更新user_rank_snapshot
- [x] 欢喜徽记自动授予
- [x] 积分历史查看

### Phase 7-8: 积分与奖励系统 ✅
- [x] 积分汇总查询
- [x] 积分账本查询
- [x] 部门奖励积分申请
- [x] 奖励积分审批流程（含月度配额验证）
- [x] 奖励商城（公开访问）
- [x] 兑换资格检查（等级+积分+欢喜徽记）
- [x] 兑换流程（选择→确认→生成HMAC签名码）
- [x] 兑换成功页面
- [x] 工作人员验证界面（/verify）
- [x] 兑换码验证与标记已使用
- [x] 库存管理
- [x] 兑换历史查询

### Bug修复 ✅
- [x] OAuth回调schema不匹配错误
- [x] 登录后跳转到原页面
- [x] 新用户OAuth登录自动初始化userRankSnapshot
- [x] 积分显示问题（Aaron Lee账户9000积分）

---

## 当前开发计划（简化版 - 基于2025-01-01需求更新）

### Phase 9: 数据库重构 - 层级部门与徽章系统

#### 9.1 部门表重构（支持层级结构）
- [x] 修改departments表schema，添加parentId字段
- [x] 添加level字段（1=方丈助理，2=中心，3=部门）
- [x] 添加fullPath字段（存储完整路径，如"方丈助理1/禅修中心/客堂"）
- [x] 创建数据库迁移脚本
- [x] 执行迁移：手动SQL执行完成

#### 9.2 徽章系统表设计
- [x] 创建badges表（徽章定义）
  - id, code（唯一标识，如"joy_badge", "temple_worker_1year"）
  - name（徽章名称）
  - description（描述）
  - iconUrl（图标）
  - category（类别：service_hours, engagement_duration, special）
  - autoGrantRule（自动授予规则，JSON格式）
- [x] 创建user_badges表（用户徽章记录）
  - id, userId, badgeId
  - grantedAt（授予时间）
  - grantedBy（授予人，可为null表示自动授予）
  - expiresAt（过期时间，可为null表示永久）
  - metadata（额外信息，JSON格式）
- [x] 执行迁移：手动SQL执行完成

#### 9.3 Engagement表重构（支持历史记录）
- [x] 修改engagements表schema
  - 保留现有字段：userId, departmentId, type, startDate, endDate, status
  - 添加effectiveFrom（生效时间）
  - 添加effectiveUntil（失效时间，null表示当前有效）
  - 添加replacedBy（被哪条记录替代，用于追踪历史变更）
- [x] 更新allowPointsOnPaidHours默认值为true（寺工和义工都获得积分）
- [x] 添加requiredBadges字段到rewards表
- [x] 执行迁移：手动SQL执行完成

---

### Phase 10: 后端API开发

#### 10.1 部门管理API（支持层级）
- [ ] 修改departments router
  - 创建部门时支持指定parentId
  - 列表查询返回树形结构
  - 添加getAncestors（获取所有上级部门）
  - 添加getDescendants（获取所有下级部门）
- [ ] 更新部门CRUD逻辑
  - 删除部门时检查是否有子部门
  - 移动部门时更新fullPath

#### 10.2 Engagement管理API
- [ ] 创建engagements router
  - create：创建新的服务关系（义工/寺工）
  - list：查询用户的所有engagement（含历史）
  - update：更新engagement（自动创建历史记录）
  - terminate：终止engagement（设置endDate和effectiveUntil）
  - getCurrent：获取用户当前有效的engagement
  - getHistory：获取用户的engagement变更历史
- [ ] 业务规则实现
  - 同一用户同一时间只能有一个有效的engagement
  - 更新engagement时自动将旧记录的effectiveUntil设为当前时间
  - 记录变更原因（metadata字段）

#### 10.3 徽章系统API
- [ ] 创建badges router
  - createBadge：创建徽章定义（管理员）
  - listBadges：列出所有徽章
  - grantBadge：手动授予徽章（管理员）
  - revokeBadge：撤销徽章（管理员）
  - getUserBadges：查询用户的所有徽章
  - checkEligibility：检查用户是否满足某徽章的自动授予条件
- [ ] 自动授予逻辑
  - 修改考勤确认流程，检查是否满足徽章条件
  - 实现"寺工满1年"徽章自动授予
  - 保留现有"欢喜徽记"（70小时）逻辑

#### 10.4 用户管理API（管理员创建账号）
- [ ] 修改users router
  - 添加adminCreateUser：管理员创建用户账号
  - 自动生成志愿者代码
  - 初始化userRankSnapshot
  - 可选：同时创建engagement记录
- [ ] 移除公开注册API（保留代码但禁用路由）

---

### Phase 11: 前端UI开发

#### 11.1 部门管理UI（层级结构）
- [ ] 重构部门管理页面
  - 使用树形组件展示部门层级
  - 支持拖拽调整部门归属
  - 创建部门时选择父部门
  - 显示完整路径（面包屑导航）
- [ ] 添加部门选择器组件（用于其他页面）

#### 11.2 Engagement管理UI
- [ ] 创建Engagement管理页面（/admin/engagements）
  - 用户列表，显示当前engagement状态
  - 点击用户查看engagement历史
  - 创建新engagement（选择用户、部门、类型、起止日期）
  - 更新engagement（自动记录历史）
  - 终止engagement
- [ ] 在用户详情页显示engagement信息
- [ ] 在排班/考勤页面显示用户的engagement类型

#### 11.3 徽章系统UI
- [ ] 创建徽章管理页面（/admin/badges）
  - 列出所有徽章定义
  - 创建新徽章（名称、描述、图标、自动授予规则）
  - 手动授予徽章给用户
  - 撤销用户徽章
- [ ] 在用户个人中心显示徽章
  - 已获得的徽章（带图标和获得时间）
  - 可获得的徽章（显示进度条）
- [ ] 在奖励兑换时检查徽章要求
  - 修改rewards表，添加requiredBadges字段（JSON数组）
  - 兑换时检查用户是否拥有所需徽章

#### 11.4 用户管理UI（管理员创建账号）
- [ ] 创建用户管理页面（/admin/users）
  - 用户列表（姓名、代码、角色、状态）
  - 创建新用户按钮
  - 创建用户表单（姓名、手机、角色、初始部门、engagement类型）
  - 编辑用户信息
  - 修改用户角色
  - 查看用户详情（积分、工时、徽章、engagement历史）
- [ ] 移除公开注册入口
  - 删除/register路由
  - 登录页面移除"注册"链接
  - 保留注册代码（注释掉）以备将来需要

#### 11.5 我的排班视图（志愿者端）
- [ ] 创建我的排班页面（/my-schedules）
  - Upcoming排班（未来7天）
  - Past排班（历史记录）
  - 日历视图（标注已分配的日期）
  - 显示排班详情（时间、部门、班次）

---

### Phase 12: 数据迁移与初始化

#### 12.1 部门数据导入
- [ ] 创建部门导入脚本（import-departments.ts）
- [ ] 根据提供的部门结构创建数据：
  ```
  方丈助理1
    禅修中心
      客堂、客房部、福田办、禅修办
    文化中心
      文创中心、本然茶空间、咖啡馆、福满堂、图书馆、文宣中心、财务部、福善中心
    义工中心
      斋堂
  方丈助理2
    寺务中心
      维修部、综治办、园林、菜地、采购
    新楼
      中轴线、十方面馆
  ```
- [ ] 执行导入脚本

#### 12.2 徽章数据初始化
- [ ] 创建徽章初始化脚本（init-badges.ts）
- [ ] 创建基础徽章：
  - 欢喜徽记（70小时服务）
  - 寺工满1年徽章
  - 寺工满3年徽章
  - 寺工满5年徽章
- [ ] 执行初始化脚本

#### 12.3 现有数据迁移
- [ ] 迁移现有部门数据到新结构（如果有）
- [ ] 为现有用户创建engagement记录（如果需要）
- [ ] 为符合条件的用户授予徽章

---

### Phase 13: 测试与文档更新

#### 13.1 功能测试
- [ ] 测试部门层级创建、编辑、删除
- [ ] 测试engagement创建、更新、历史查询
- [ ] 测试徽章自动授予（考勤确认后）
- [ ] 测试徽章手动授予和撤销
- [ ] 测试管理员创建用户账号
- [ ] 测试奖励兑换时的徽章要求检查
- [ ] 测试我的排班视图

#### 13.2 文档更新
- [ ] 更新BUSINESS_CONFIG.md
  - 移除"14天最短服务期"要求
  - 移除"积分率差异化"说明
  - 添加部门层级结构说明
  - 添加徽章系统说明
  - 添加engagement历史记录说明
- [ ] 更新DEVELOPMENT.md
  - 添加部门层级结构设计
  - 添加徽章系统架构
  - 添加engagement历史追踪机制
- [ ] 更新API.md
  - 添加新的API端点文档
- [ ] 更新userGuide.md
  - 移除注册入口说明
  - 添加徽章系统使用说明
  - 添加我的排班查看说明

---

## 未来增强功能（Phase 14+）

### 管理工具
- [ ] 管理员仪表板（系统统计）
- [ ] 奖励管理界面（CRUD奖励目录）
- [ ] 审计日志查看器
- [ ] 积分统计报表（志愿者、部门、积分获取/使用）
- [ ] 导出Excel/CSV功能

### 高级功能
- [ ] 寺工轮班规则（自动生成月度排班）
- [ ] 系统通知功能（排班提醒、徽章获得通知）
- [ ] 移动端优化
- [ ] 微信小程序集成

---

## 开发原则（2025-01-01更新）

1. **简化优先**：由线下人员（义工中心）处理复杂情况，系统保持简洁
2. **统一积分率**：寺工和义工积分率相同（1小时=10积分），寺工薪资由财务部单独管理
3. **徽章驱动权益**：通过徽章系统实现灵活的权益管理（如"入住弥陀村需寺工满1年"）
4. **历史可追溯**：engagement变更记录完整历史，支持时间维度查询
5. **管理员控制**：账号注册由管理员（义工中心）控制，移除公开注册入口
6. **层级部门**：支持3级部门结构，员工可归属任意层级

---

**当前阶段**: Phase 9 - 数据库重构  
**下一步**: 重构departments表支持层级结构

### Phase 10: 后端API开发（使用示例数据）

#### 10.1 示例数据准备
- [x] 创建示例部门数据（层级结构）
- [x] 创建示例徽章数据（欢喜徽章、寺工1年徽章等）
- [x] 创建数据导入脚本

#### 10.2 层级部门管理API
- [x] 更新departments router支持层级查询
- [x] 实现获取部门树形结构API（db-queries.ts）
- [ ] 实现创建子部门API
- [ ] 更新部门列表显示（支持fullPath）

#### 10.3 Engagement管理API
- [x] 创建engagements router
- [ ] 实现创建engagement（记录义工/寺工状态）
- [x] 实现更新engagement（自动处理历史记录）
- [x] 实现查询用户当前engagement
- [x] 实现查询用户engagement历史

#### 10.4 徽章系统API
- [x] 创建badges router
- [x] 实现徽章列表查询（db-queries.ts）
- [x] 实现用户徽章查询（db-queries.ts）
- [x] 实现手动授予徽章（db-queries.ts）
- [ ] 实现自动授予徽章（基于规则）
- [x] 实现撤销徽章（db-queries.ts）

#### 10.5 奖励兑换资格检查增强
- [x] 更新奖励兑换逻辑，支持requiredBadges检查
- [x] 更新前端显示，展示所需徽章（BadgeDisplay组件）


### Phase 11: 移除公开注册 & 管理员创建用户

#### 11.1 移除公开注册入口
- [x] 检查并移除Landing页面的注册入口
- [x] 移除注册相关的路由和页面
- [x] 更新登录流程说明

#### 11.2 实现管理员创建用户功能
- [x] 创建admin.users router
- [x] 实现创建用户API（管理员权限）
- [x] 实现用户列表查询API
- [x] 创建用户管理页面UI
- [x] 添加创建用户表单（包含基本信息和初始Engagement）

### Phase 12: 徽章自动授予逻辑

#### 12.1 实现自动授予规则引擎
- [x] 创建badge auto-grant service
- [x] 实现基于服务时长的徽章授予（欢喜徽记70小时）
- [x] 实现基于Engagement时长的徽章授予（寺工满1年）
- [x] 在考勤确认后触发徽章检查
- [x] 在Engagement更新后触发徽章检查

### Phase 13: 管理员界面

#### 13.1 徽章管理界面
- [ ] 创建徽章管理页面
- [ ] 实现手动授予徽章功能
- [ ] 实现撤销徽章功能
- [ ] 显示徽章授予历史

#### 13.2 Engagement管理界面
- [ ] 创建Engagement管理页面
- [ ] 实现创建/更新Engagement表单
- [ ] 显示用户Engagement历史
- [ ] 支持批量操作

### Phase 14: 用户体验改进

#### 14.1 退出登录功能
- [x] 检查当前是否有退出登录按钮
- [x] 在用户界面添加退出登录按钮（Home页面header）
- [x] 确保退出后正确跳转到Landing页面

### Phase 15: 登录Bug修复 & 密码安全

#### 15.1 修复登录后重定向到Landing页面的Bug
- [ ] 调查登录后为什么被重定向回Landing页面
- [ ] 检查session cookie设置和验证逻辑
- [ ] 修复重定向逻辑，确保登录后停留在首页

#### 15.2 实现志愿者密码系统
- [x] 在users表添加password字段（加密存储）
- [x] 创建用户时自动生成初始密码（生日yymmdd格式）
- [x] 更新志愿者登录逻辑，要求输入密码
- [x] 实现密码加密存储（bcrypt）

#### 15.3 实现密码修改功能
- [ ] 创建密码修改API（protectedProcedure）
- [ ] 创建密码修改页面UI
- [ ] 验证旧密码 + 设置新密码
- [ ] 首次登录强制修改密码提示

### Phase 17: 修复登录重定向Bug（紧急）

#### 17.1 调查OAuth登录流程
- [x] 检查OAuth callback处理逻辑
- [x] 验证session cookie是否正确设置
- [x] 检查cookie的domain、path、sameSite等属性
- [x] 查看服务器日志中的认证错误

#### 17.2 调试前端认证状态
- [x] 检查useAuth hook的实现
- [x] 验证trpc.auth.me查询是否正常工作
- [x] 检查Home页面的登录判断逻辑
- [x] 查看浏览器控制台的错误信息

#### 17.3 修复根本原因
- [x] 根据调查结果修复问题
- [x] 增加AuthRedirect延迟到500ms确保cookie设置完成
- [x] 修复Home页面认证检查逻辑，防止在loading期间显示Landing页面
- [ ] 测试完整的登录流程（需要用户协助）

### Phase 18: 认证系统完善

#### 18.1 修复退出登录后立即登录404问题
- [ ] 调查退出后立即OAuth登录出现404的原因
- [ ] 检查session cookie清除的时序
- [ ] 修复OAuth callback处理逻辑
- [ ] 确保退出后可以立即重新登录

#### 18.2 实现邮箱/密码登录系统
- [ ] 在users表添加email字段（如果还没有）
- [ ] 创建email+password登录API
- [ ] 创建统一的登录页面UI（支持邮箱密码登录）
- [ ] 区分管理员登录和志愿者登录入口
- [ ] 更新Landing页面的登录按钮

#### 18.3 基于角色的首页内容
- [ ] 为管理员创建专用首页（管理仪表板）
- [ ] 为志愿者保留现有首页（积分、奖励等）
- [ ] 根据用户角色自动路由到对应首页
- [ ] 在导航栏显示角色标识

#### 18.4 创建测试用户
- [ ] 创建管理员测试账号（email+password）
- [ ] 创建志愿者测试账号（volunteerCode+password）
- [ ] 测试两种角色的完整登录流程
- [ ] 验证角色权限隔离
