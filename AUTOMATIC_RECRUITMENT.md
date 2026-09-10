# 自招问卷统一入口

完成 GitHub 推送且 Netlify 成功部署本次修改后，对外只发：

https://facadeevaluation.netlify.app/local.html?LANG=es

英语使用 `LANG=en`，加泰罗尼亚语使用 `LANG=ca`；页面内可以切换语言。旧的个人邀请清单不再需要分发。此入口仅管理自招版，Prolific 的测试配置不变。

## 分配规则

- 每个 B01–B25 区块目标 4 份通过基本完整性检查的完成答卷，共 100 个完成名额。
- 打开链接本身不占名额。点击“继续”时，服务器分配编码 ID 和当前占用较少的区块；同等占用的区块随机选择。
- 名额通过强一致性读取与 ETag 条件写入更新。多个访问者不能靠并发请求占用同一个剩余名额；冲突时重试，无法确认写入时不继续随机分配。
- 预约 45 分钟。有实际操作且页面可见时，每 5 分钟续期；一次预约最多保留 24 小时。超过期限，名额可供他人领取。恢复时优先保留原编号和原区块，原区块没有空位时不会偷偷更换题目。
- 不同意、理解题导致的终止会尝试释放名额；关闭浏览器则等待预约到期。居民筛选退出的记录保存，但不占完成名额。
- 答卷必须先保存到私有 Blobs，才会计入完成名额。迟交、不可判断项目或两次注意力题失败的答卷保留为待审查，不直接填满目标。
- 满额时显示暂时没有名额，不继续无限收集。人工排除某份已完成答卷后，可以用下方管理工具重新开放它对应的一个名额，原答卷不删除。

“完成名额”只是按当前规则得出的初步可用数，不是最终科学有效性判定。两来源合并的样本量、代表性、最终质量排除仍由研究者核对。此后台不自动扣除 Prolific 招募人数；启用 Prolific 正式收集前应重新核对两来源目标。

## 数据在哪里

1. **主记录**：Netlify 后台 Data & Storage → Blobs → `facade-local-responses`。只存在于服务端私有存储，不写进 GitHub。每个参与者一个不可被重试覆盖的记录。
2. **名额台账**：Blobs → `facade-local-allocation`。保存编码分配、预约到期和提交状态，不存放人类回答。
3. **兼容副本**：继续尝试发送到 Forms → `facade_pairwise_data`。仍可能在 Spam；副本失败不影响已经保存的 Blobs 主记录。研究分析应以私有存储导出为完整来源，不把 Forms 中看不到当作没有保存。

答卷页面的“提交成功”现在以私有存储成功为依据。重试不会生成第二份主记录。服务器已收到答卷但浏览器未收到回执时，重新进入统一链接可下载自己的服务器备份。不得以清除 cookie 的方式让同一人再次参与。

## 部署

1. 将本次代码及 `package.json`、`package-lock.json`、`netlify.toml`、`netlify/` 和新增 `tools/` 文件一并提交、推送 GitHub。
2. Netlify 自动安装依赖并执行 `npm run build`，然后部署 `local-allocation` Function。无需把 API token 放进问卷代码，也无需注册另一家数据库。
3. 在 Netlify 的部署日志确认构建成功，Functions 中存在 `local-allocation`。
4. 先打开统一入口确认能显示继续按钮；仅打开入口不会占用名额。技术测试应在预览环境或本地模拟执行，不要用正式入口提交虚拟回答污染研究数据。
5. 只有函数和私有存储在实际部署中可用时，统一链接才可使用。GitHub Pages 或直接打开本地 HTML 不提供后台；本地文件自动使用不上传的 preview 模式。

本次不自动修改 Netlify 套餐。Functions/Blobs 使用受你的套餐和额度约束，不能保证无限免费。若实际站点未提供 Blobs 上下文或额度不足，入口会明确失败并可重试，不会退化为不受控随机分配。

## 私有导出与人工补招

管理工具在研究者电脑运行，不是在公开网页中运行。需要该站点的 Netlify Site ID 和具有相应访问权限的个人访问令牌。

在 PowerShell 中设定 `NETLIFY_SITE_ID` 和 `NETLIFY_AUTH_TOKEN` 两个当前进程环境变量。令牌不要发到聊天、不写进 GitHub、不加到链接。可使用 `Read-Host -MaskInput` 交互输入令牌。

```powershell
$env:NETLIFY_SITE_ID = Read-Host 'Netlify Site ID'
$env:NETLIFY_AUTH_TOKEN = Read-Host 'Netlify access token' -MaskInput
node tools/manage-local-allocation.mjs --out 'C:\Users\45785\Desktop\Facade_Visual_Perception_Evaluation\Facade_evaluator_Test\analysis\local_responses'
```

工具将生成独立时间戳目录，包含 `all_responses`、`preliminary_usable` 与 `allocation-report.json`。后者列出每组完成及尚有效的预约数；研究分析先检查原始记录，再使用暂定可用子集。数据绝不能导出到公开问卷仓库，工具也会拒绝这种路径。

如果人工审核后确实排除了一份已计入目标的答卷，明确指定编号及理由：

```powershell
node tools/manage-local-allocation.mjs --out 'C:\Users\45785\Desktop\Facade_Visual_Perception_Evaluation\Facade_evaluator_Test\analysis\local_responses' --release-id 'L-替换为实际32位编号' --reason '写明已确认的排除理由' --confirm-release
```

该操作只将其台账标记为 `excluded_after_review`，保留原答卷并开放一个名额。不要仅因平台 Spam 标记就排除，也不要为了凑人数反复释放同一个人。使用完令牌后移除当前进程环境变量：

```powershell
Remove-Item Env:NETLIFY_AUTH_TOKEN
```

## 限制与隐私

必要的 HttpOnly cookie 保留 30 天，用来识别同一浏览器的分配。它不是实名验证，无法可靠识别换设备、清 cookie 或无痕重复参与的人；本实现不使用 IP/设备指纹来假装解决该问题。原有 24 小时答题进度恢复仍独立保留。

参与者说明已补充私有 Netlify 存储和 cookie 用途。技术上线不代表前述伦理范围、图片使用和外部处理安排已经获得新的批准，原有待确认字段保持真实。后续须按研究批准的留存/删除要求管理服务器副本，不能依赖它永久保存。

如已通过旧个人链接收集正式答卷，不要把新后台当作已经计入那些答卷；请先停发旧链接并导出核对存量，再调整/同步新招募目标。这里的 100 个名额是本次自动分配流程的目标，不会自动读取既有 Forms 记录。

技术依据：[Netlify Blobs 强一致性和条件写入](https://docs.netlify.com/build/data-and-storage/netlify-blobs/)。
